package handler

import (
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// ==================== ORDERS ====================

// CreateOrder creates a new order
// @Summary Create order
// @Description Create a new order. You can optionally create multiple order items in the same request via the items array. total_amount is computed server-side from items and service/discount fields.
// @Tags Orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateOrderRequest true "Create order request"
// @Success 201 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders [post]
func (h *Handler) CreateOrder(c echo.Context) error {
	var req model.CreateOrderRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create order request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	role, _ := c.Get("role").(string)
	userID, _ := c.Get("user_id").(string)
	if role == "waiter" && userID != "" {
		req.WaiterID = &userID
	}
	if role == "cashier" && userID != "" {
		req.CashierID = &userID
		if cr, _ := c.Get("cash_register_id").(string); cr != "" && req.CashRegisterID == nil {
			req.CashRegisterID = &cr
		}
	}

	orderTypeStr := "dine_in"
	if req.OrderType != nil && *req.OrderType == "takeaway" {
		orderTypeStr = "takeaway"
	}
	if orderTypeStr != "takeaway" && req.TableID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"table_id is required",
			"missing required field: table_id",
			http.StatusBadRequest,
		))
	}
	if req.TableID != "" {
		if _, err := uuid.Parse(req.TableID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid table_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
	}
	if req.WaiterID != nil && *req.WaiterID != "" {
		if _, err := uuid.Parse(*req.WaiterID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid waiter_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
	}
	if req.CashierID != nil && *req.CashierID != "" {
		if _, err := uuid.Parse(*req.CashierID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid cashier_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
	}

	for i, it := range req.Items {
		if it.GoodID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"good_id is required",
				"items["+strconv.Itoa(i)+"].good_id is required",
				http.StatusBadRequest,
			))
		}
		if _, err := uuid.Parse(it.GoodID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid good_id format",
				"items["+strconv.Itoa(i)+"].good_id: "+err.Error(),
				http.StatusBadRequest,
			))
		}
		if it.Quantity <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"quantity must be greater than 0",
				"items["+strconv.Itoa(i)+"].quantity must be greater than 0",
				http.StatusBadRequest,
			))
		}
	}

	order, err := h.service.Order().CreateOrder(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateOrder failed: %v", err)
		if strings.Contains(strings.ToLower(err.Error()), "cafe table not found") {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse(
				"cafe table not found",
				err.Error(),
				http.StatusNotFound,
			))
		}
		if strings.Contains(strings.ToLower(err.Error()), "table already has an active order") {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"table already has an active order",
				err.Error(),
				http.StatusConflict,
			))
		}
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// Auto-start table timer for immediate dine-in orders on time_based tables.
	// Best-effort only: order creation must stay successful even if timer start fails.
	orderType := "dine_in"
	if req.OrderType != nil && *req.OrderType == "takeaway" {
		orderType = "takeaway"
	}

	shouldAutoStartTimer := orderType == "dine_in" &&
		req.TableID != "" &&
		(req.ScheduledAt == nil || *req.ScheduledAt == "")

	if shouldAutoStartTimer && order != nil {
		if _, timerErr := h.service.TableTimer().StartTableTimerIfNeeded(
			c.Request().Context(),
			order.ID,
			userID,
			role,
		); timerErr != nil {
			log.Printf("CreateOrder auto-start timer skipped/failed for order %s: %v", order.ID, timerErr)
		}
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Order created successfully",
		order,
		http.StatusCreated,
	))
}

// AddOrderItems appends multiple items to an existing order
// @Summary Add order items
// @Description Append multiple order items to an existing order (e.g. dessert after meal). Item price is auto-filled from goods.price and order totals are recalculated server-side.
// @Tags Orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param request body model.AddOrderItemsRequest true "Add order items request"
// @Success 200 {object} model.AddOrderItemsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/items [post]
func (h *Handler) AddOrderItems(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.AddOrderItemsRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind add order items request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if len(req.Items) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"items is required",
			"items must not be empty",
			http.StatusBadRequest,
		))
	}
	for i, it := range req.Items {
		if it.GoodID == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"good_id is required",
				"items["+strconv.Itoa(i)+"].good_id is required",
				http.StatusBadRequest,
			))
		}
		if _, err := uuid.Parse(it.GoodID); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid good_id format",
				"items["+strconv.Itoa(i)+"].good_id: "+err.Error(),
				http.StatusBadRequest,
			))
		}
		if it.Quantity <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"quantity must be greater than 0",
				"items["+strconv.Itoa(i)+"].quantity must be greater than 0",
				http.StatusBadRequest,
			))
		}
	}

	resp, err := h.service.Order().AddOrderItems(c.Request().Context(), orderID, req)
	if err != nil {
		log.Printf("AddOrderItems failed for order %s: %v", orderID, err)

		errMsg := strings.ToLower(err.Error())

		if strings.Contains(errMsg, "good not found") {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse(
				"good not found",
				err.Error(),
				http.StatusNotFound,
			))
		}

		if strings.Contains(errMsg, "order not found") {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse(
				"order not found",
				err.Error(),
				http.StatusNotFound,
			))
		}

		if strings.Contains(errMsg, "cannot add items to") {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"cannot add items to this order",
				err.Error(),
				http.StatusConflict,
			))
		}

		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to add order items",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order items added successfully",
		resp,
		http.StatusOK,
	))
}

// GetOrderByID retrieves a single order by ID
// @Summary Get order by ID
// @Description Get a single order by its ID
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id} [get]
func (h *Handler) GetOrderByID(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().GetOrderByID(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("GetOrderByID failed for id %s: %v", orderID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	if order == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"order not found",
			"order not found",
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order retrieved successfully",
		order,
		http.StatusOK,
	))
}

// GetAllOrders retrieves all orders with filters and sorting
// @Summary Get all orders
// @Description Get all orders with type, status, period/from-to, table filters and created/updated date sorting
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param type query string false "Order type" Enums(dine_in,takeaway)
// @Param status query string false "Order status" Enums(open,cooking,ready,served,paid,cancelled,reserved,rescheduled)
// @Param from query string false "Start date (YYYY-MM-DD)"
// @Param to query string false "End date (YYYY-MM-DD)"
// @Param table_id query string false "Table ID"
// @Param sort_by query string false "Sort field" Enums(created_at,updated_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders [get]
func (h *Handler) GetAllOrders(c echo.Context) error {
	req := model.GetOrdersRequest{
		SortBy:    "created_at",
		SortOrder: "desc",
		Limit:     20,
		Offset:    0,
	}

	if v := strings.TrimSpace(c.QueryParam("type")); v != "" {
		switch model.OrderType(v) {
		case model.OrderTypeDineIn, model.OrderTypeTakeaway:
			orderType := model.OrderType(v)
			req.Type = &orderType
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid order type",
				"allowed values: dine_in, takeaway",
				http.StatusBadRequest,
			))
		}
	}

	if v := strings.TrimSpace(c.QueryParam("status")); v != "" {
		switch model.OrderStatus(v) {
		case model.OrderStatusOpen,
			model.OrderStatusCooking,
			model.OrderStatusReady,
			model.OrderStatusServed,
			model.OrderStatusPaid,
			model.OrderStatusCancelled,
			model.OrderStatusReserved,
			model.OrderStatusRescheduled:
			status := model.OrderStatus(v)
			req.Status = &status
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid order status",
				"allowed values: open, cooking, ready, served, paid, cancelled, reserved, rescheduled",
				http.StatusBadRequest,
			))
		}
	}

	if v := strings.TrimSpace(c.QueryParam("from")); v != "" {
		if _, err := time.Parse("2006-01-02", v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid from date",
				"use YYYY-MM-DD format",
				http.StatusBadRequest,
			))
		}
		req.From = &v
	}

	if v := strings.TrimSpace(c.QueryParam("to")); v != "" {
		if _, err := time.Parse("2006-01-02", v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid to date",
				"use YYYY-MM-DD format",
				http.StatusBadRequest,
			))
		}
		req.To = &v
	}

	if req.From != nil && req.To != nil {
		fromDate, _ := time.Parse("2006-01-02", *req.From)
		toDate, _ := time.Parse("2006-01-02", *req.To)
		if fromDate.After(toDate) {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid date range",
				"from must be less than or equal to to",
				http.StatusBadRequest,
			))
		}
	}

	if v := strings.TrimSpace(c.QueryParam("table_id")); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid table_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.TableID = &v
	}

	if v := strings.TrimSpace(c.QueryParam("sort_by")); v != "" {
		switch v {
		case "created_at", "updated_at":
			req.SortBy = v
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid sort_by",
				"allowed values: created_at, updated_at",
				http.StatusBadRequest,
			))
		}
	}

	if v := strings.TrimSpace(c.QueryParam("sort_order")); v != "" {
		switch v {
		case "asc", "desc":
			req.SortOrder = v
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid sort_order",
				"allowed values: asc, desc",
				http.StatusBadRequest,
			))
		}
	}

	if v := strings.TrimSpace(c.QueryParam("limit")); v != "" {
		limit, err := strconv.ParseInt(v, 10, 32)
		if err != nil || limit <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		req.Limit = int32(limit)
	}

	if v := strings.TrimSpace(c.QueryParam("offset")); v != "" {
		offset, err := strconv.ParseInt(v, 10, 32)
		if err != nil || offset < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		req.Offset = int32(offset)
	}

	orders, err := h.service.Order().GetAllOrders(c.Request().Context(), req)
	if err != nil {
		log.Printf("GetAllOrders failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch orders",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Orders retrieved successfully",
		orders,
		http.StatusOK,
	))
}

// GetOrdersByStatus retrieves orders by status with pagination
// @Summary Get orders by status
// @Description Get orders filtered by status with pagination
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param status path string true "Order status"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/status/{status} [get]
func (h *Handler) GetOrdersByStatus(c echo.Context) error {
	status := c.Param("status")
	if status == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"status is required",
			"missing path parameter: status",
			http.StatusBadRequest,
		))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	orders, err := h.service.Order().GetOrdersByStatus(c.Request().Context(), status, limit, offset)
	if err != nil {
		log.Printf("GetOrdersByStatus failed for status %s: %v", status, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch orders",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Orders retrieved successfully",
		orders,
		http.StatusOK,
	))
}

// GetOrdersByWaiterID retrieves orders by waiter ID with pagination
// @Summary Get orders by waiter
// @Description Get orders filtered by waiter ID with pagination
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param waiterId path string true "Waiter ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/waiter/{waiterId} [get]
func (h *Handler) GetOrdersByWaiterID(c echo.Context) error {
	waiterID := c.Param("waiterId")
	if waiterID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"waiter_id is required",
			"missing path parameter: waiterId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(waiterID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid waiter_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	orders, err := h.service.Order().GetOrdersByWaiterID(c.Request().Context(), waiterID, limit, offset)
	if err != nil {
		log.Printf("GetOrdersByWaiterID failed for waiter_id %s: %v", waiterID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch orders",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Orders retrieved successfully",
		orders,
		http.StatusOK,
	))
}

// GetOrdersByTableID retrieves orders by table ID
// @Summary Get orders by table
// @Description Get orders filtered by table ID
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param tableId path string true "Table ID"
// @Success 200 {object} []model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/table/{tableId} [get]
func (h *Handler) GetOrdersByTableID(c echo.Context) error {
	tableID := c.Param("tableId")
	if tableID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"table_id is required",
			"missing path parameter: tableId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(tableID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid table_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	orders, err := h.service.Order().GetOrdersByTableID(c.Request().Context(), tableID)
	if err != nil {
		log.Printf("GetOrdersByTableID failed for table_id %s: %v", tableID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch orders",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Orders retrieved successfully",
		orders,
		http.StatusOK,
	))
}

// UpdateOrder updates an order
// @Summary Update order
// @Description Update an existing order
// @Tags Orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param request body model.UpdateOrderRequest true "Update order request"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id} [put]
func (h *Handler) UpdateOrder(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdateOrderRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update order request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().UpdateOrder(c.Request().Context(), orderID, req)
	if err != nil {
		log.Printf("UpdateOrder failed for id %s: %v", orderID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	if order == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"order not found",
			"order not found",
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order updated successfully",
		order,
		http.StatusOK,
	))
}

// UpdateOrderStatus updates an order status
// @Summary Update order status
// @Description Update status of an existing order
// @Tags Orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param request body model.UpdateOrderStatusRequest true "Update order status request"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/status [put]
func (h *Handler) UpdateOrderStatus(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdateOrderStatusRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update order status request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if req.Status == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"status is required",
			"missing required field: status",
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().UpdateOrderStatus(c.Request().Context(), orderID, req.Status)
	if err != nil {
		log.Printf("UpdateOrderStatus failed for id %s: %v", orderID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update order status",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order status updated successfully",
		order,
		http.StatusOK,
	))
}

// GetOrderTablePrice calculates the table price for an order based on duration
// @Summary Get table price for order
// @Description Calculates price based on table's price_per_hour and time elapsed. Uses scheduled_at if set, otherwise created_at. Returns error if table has no hourly price.
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param id path string true "Order ID"
// @Success 200 {object} model.TablePriceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/table-price [get]
func (h *Handler) GetOrderTablePrice(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	timer, err := h.service.TableTimer().GetTableTimerState(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("GetOrderTablePrice failed for order %s: %v", orderID, err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"failed to calculate table price",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if timer.PricePerHour == nil || *timer.PricePerHour == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"this table has no hourly price set",
			"price_per_hour is null or 0",
			http.StatusBadRequest,
		))
	}

	startedAt := ""
	if timer.StartedAt != nil {
		startedAt = timer.StartedAt.Format(time.RFC3339)
	}

	durationMinutes := math.Round((float64(timer.TotalActiveSec)/60.0)*100) / 100
	durationHours := math.Round((float64(timer.TotalActiveSec)/3600.0)*10000) / 10000

	totalPrice := "0.00"
	if timer.CurrentAmount != nil && *timer.CurrentAmount != "" {
		totalPrice = *timer.CurrentAmount
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Table price calculated successfully",
		model.TablePriceResponse{
			TableID:         timer.TableID,
			PricePerHour:    *timer.PricePerHour,
			StartedAt:       startedAt,
			DurationMinutes: durationMinutes,
			DurationHours:   durationHours,
			TotalPrice:      totalPrice,
		},
		http.StatusOK,
	))
}

func isIgnorableTableTimerCloseError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())

	return strings.Contains(msg, "table timer is only available for time_based tables") ||
		strings.Contains(msg, "table timer is only available for dine_in orders") ||
		strings.Contains(msg, "order has no table")
}

// MarkOrderPaid marks an order as paid
// @Summary Mark order paid
// @Description Mark an order as paid
// @Tags Orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param request body model.MarkOrderPaidRequest true "Mark order paid request"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/pay [post]
func (h *Handler) MarkOrderPaid(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.MarkOrderPaidRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind mark order paid request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	// Always override cashier_id and cash_register_id from JWT token
	cashierID, _ := c.Get("user_id").(string)
	if cashierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"cashier_id is required",
			"missing user_id in token",
			http.StatusBadRequest,
		))
	}

	var cashRegisterID *string
	if cr, _ := c.Get("cash_register_id").(string); cr != "" {
		cashRegisterID = &cr
	}

	role, _ := c.Get("role").(string)

	effectiveTableCharge := req.TableCharge
	hasClientTableCharge := req.TableCharge != nil && strings.TrimSpace(*req.TableCharge) != ""

	timerResp, timerErr := h.service.TableTimer().CloseTableTimer(
		c.Request().Context(),
		orderID,
		cashierID,
		role,
	)
	if timerErr != nil {
		if !isIgnorableTableTimerCloseError(timerErr) {
			log.Printf("MarkOrderPaid failed to close table timer for order %s: %v", orderID, timerErr)
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"failed to close table timer",
				timerErr.Error(),
				http.StatusBadRequest,
			))
		}
	} else if !hasClientTableCharge && timerResp != nil && timerResp.FinalAmount != nil && *timerResp.FinalAmount != "" {
		effectiveTableCharge = timerResp.FinalAmount
	}

	order, err := h.service.Order().MarkOrderPaid(
		c.Request().Context(),
		orderID,
		cashierID,
		cashRegisterID,
		req.PaymentType,
		req.DiscountPercent,
		req.DiscountAmount,
		req.DiscountComment,
		&req.CustomerPaidAmount,
		effectiveTableCharge,
		req.CashAmount,
		req.CardAmount,
	)
	if err != nil {
		log.Printf("MarkOrderPaid failed for order %s: %v", orderID, err)

		errMsg := strings.ToLower(err.Error())

		if strings.Contains(errMsg, "insufficient payment") ||
			strings.Contains(errMsg, "invalid payment_type") ||
			strings.Contains(errMsg, "customer_paid_amount") ||
			strings.Contains(errMsg, "cash_amount") ||
			strings.Contains(errMsg, "card_amount") ||
			strings.Contains(errMsg, "discount_percent") ||
			strings.Contains(errMsg, "discount_amount") ||
			strings.Contains(errMsg, "table_charge") ||
			strings.Contains(errMsg, "provide only one of discount_percent or discount_amount") ||
			strings.Contains(errMsg, "for split payment, cash_amount + card_amount must equal customer_paid_amount") {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid payment payload",
				err.Error(),
				http.StatusBadRequest,
			))
		}

		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to mark order paid",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order marked as paid successfully",
		order,
		http.StatusOK,
	))
}

// AssignWaiterToOrder assigns a waiter to an order
// @Summary Assign waiter to order
// @Description Assign a waiter to an order
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param waiterId path string true "Waiter ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/assign-waiter/{waiterId} [post]
func (h *Handler) AssignWaiterToOrder(c echo.Context) error {
	orderID := c.Param("id")
	waiterID := c.Param("waiterId")
	if orderID == "" || waiterID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id and waiterId are required",
			"missing path parameters: id, waiterId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(waiterID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid waiter_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().AssignWaiterToOrder(c.Request().Context(), orderID, waiterID)
	if err != nil {
		log.Printf("AssignWaiterToOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to assign waiter",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Waiter assigned successfully",
		order,
		http.StatusOK,
	))
}

// AssignCashierToOrder assigns a cashier to an order
// @Summary Assign cashier to order
// @Description Assign a cashier to an order
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param cashierId path string true "Cashier ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/assign-cashier/{cashierId} [post]
func (h *Handler) AssignCashierToOrder(c echo.Context) error {
	orderID := c.Param("id")
	cashierID := c.Param("cashierId")
	if orderID == "" || cashierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id and cashierId are required",
			"missing path parameters: id, cashierId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(cashierID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid cashier_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().AssignCashierToOrder(c.Request().Context(), orderID, cashierID)
	if err != nil {
		log.Printf("AssignCashierToOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to assign cashier",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Cashier assigned successfully",
		order,
		http.StatusOK,
	))
}

// CancelOrder cancels an order
// @Summary Cancel order
// @Description Cancel an order
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/cancel [post]
func (h *Handler) CancelOrder(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().CancelOrder(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("CancelOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to cancel order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// Send notification to kitchen staff using saved tokens
	if h.fcmClient != nil {
		// Get all kitchen staff users with role='kitchen'
		kitchenStaff, err := h.repo.Tenant(c.Request().Context()).GetUsersByRole(c.Request().Context(), "kitchen")
		if err == nil {
			for _, staff := range kitchenStaff {
				if staff.FcmToken != nil && strings.TrimSpace(*staff.FcmToken) != "" {
					// Send cancellation notification to each kitchen staff
					_ = h.service.Order().SendNotificationByStatus(c.Request().Context(), h.fcmClient, *staff.FcmToken, order.ID, "cancelled", "")
				}
			}
		}
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order cancelled successfully",
		order,
		http.StatusOK,
	))
}

// MarkOrderCooking marks an order as cooking
// @Summary Mark order cooking
// @Description Mark an order as cooking
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/cooking [post]
func (h *Handler) MarkOrderCooking(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().MarkOrderCooking(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("MarkOrderCooking failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to mark order cooking",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order marked as cooking successfully",
		order,
		http.StatusOK,
	))
}

// MarkOrderReady marks an order as ready
// @Summary Mark order ready
// @Description Mark an order as ready
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/ready [post]
func (h *Handler) MarkOrderReady(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().MarkOrderReady(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("MarkOrderReady failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to mark order ready",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order marked as ready successfully",
		order,
		http.StatusOK,
	))
}

// MarkOrderServed marks an order as served
// @Summary Mark order served
// @Description Mark an order as served
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/served [post]
func (h *Handler) MarkOrderServed(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().MarkOrderServed(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("MarkOrderServed failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to mark order served",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order marked as served successfully",
		order,
		http.StatusOK,
	))
}

// DeleteOrder deletes an order (soft delete)
// @Summary Delete order
// @Description Delete (soft delete) an order
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id} [delete]
func (h *Handler) DeleteOrder(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if err := h.service.Order().DeleteOrder(c.Request().Context(), orderID); err != nil {
		log.Printf("DeleteOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order deleted successfully",
		struct{}{},
		http.StatusOK,
	))
}

// RestoreOrder restores a deleted order
// @Summary Restore order
// @Description Restore a soft-deleted order
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/restore [post]
func (h *Handler) RestoreOrder(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if err := h.service.Order().RestoreOrder(c.Request().Context(), orderID); err != nil {
		log.Printf("RestoreOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to restore order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order restored successfully",
		struct{}{},
		http.StatusOK,
	))
}

// ==================== ORDER ITEMS ====================

// CreateOrderItem creates order items in batch
// @Summary Create order items
// @Description Create one or more order items for the same order. price can be omitted; it will be auto-filled from goods.price.
// @Tags Order Items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateOrderItemRequest true "Create order items request"
// @Success 201 {array} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items [post]
func (h *Handler) CreateOrderItem(c echo.Context) error {
	var req model.CreateOrderItemRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create order item request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.OrderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order_id is required",
			"missing required field: order_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(req.OrderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if len(req.Items) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"at least one item is required",
			"missing required field: items",
			http.StatusBadRequest,
		))
	}

	items, err := h.service.Order().CreateOrderItems(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateOrderItems failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create order items",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Order items created successfully",
		items,
		http.StatusCreated,
	))
}

// GetOrderItemByID retrieves a single order item by ID
// @Summary Get order item by ID
// @Description Get a single order item by its ID
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Success 200 {object} model.OrderItemDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id} [get]
func (h *Handler) GetOrderItemByID(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().GetOrderItemByID(c.Request().Context(), itemID)
	if err != nil {
		log.Printf("GetOrderItemByID failed for id %s: %v", itemID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch order item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"order item not found",
			"order item not found",
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item retrieved successfully",
		item,
		http.StatusOK,
	))
}

// GetAllOrderItems retrieves all order items with pagination
// @Summary Get all order items
// @Description Get all order items with pagination
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items [get]
func (h *Handler) GetAllOrderItems(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	items, err := h.service.Order().GetAllOrderItems(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllOrderItems failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch order items",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order items retrieved successfully",
		items,
		http.StatusOK,
	))
}

// GetOrderItemsByOrderID retrieves all order items for an order
// @Summary Get order items by order
// @Description Get all order items for a given order
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param orderId path string true "Order ID"
// @Success 200 {object} []model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/order/{orderId} [get]
func (h *Handler) GetOrderItemsByOrderID(c echo.Context) error {
	orderID := c.Param("orderId")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order_id is required",
			"missing path parameter: orderId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	lang := c.QueryParam("lang")
	if lang == "" {
		lang = "uz"
	}

	items, err := h.service.Order().GetOrderItemsByOrderID(c.Request().Context(), orderID, lang)
	if err != nil {
		log.Printf("GetOrderItemsByOrderID failed for order_id %s: %v", orderID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch order items",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order items retrieved successfully",
		items,
		http.StatusOK,
	))
}

// GetOrderItemsByStatus retrieves order items by status with pagination
// @Summary Get order items by status
// @Description Get order items filtered by status with pagination
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param status path string true "Order item status"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/status/{status} [get]
func (h *Handler) GetOrderItemsByStatus(c echo.Context) error {
	status := c.Param("status")
	if status == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"status is required",
			"missing path parameter: status",
			http.StatusBadRequest,
		))
	}

	if !model.IsValidOrderItemStatus(status) {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item status",
			"allowed values: "+model.OrderItemStatusAllowedValues,
			http.StatusBadRequest,
		))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	items, err := h.service.Order().GetOrderItemsByStatus(c.Request().Context(), status, limit, offset)
	if err != nil {
		log.Printf("GetOrderItemsByStatus failed for status %s: %v", status, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch order items",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order items retrieved successfully",
		items,
		http.StatusOK,
	))
}

// UpdateOrderItem updates an order item
// @Summary Update order item
// @Description Update an existing order item
// @Tags Order Items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Param request body model.UpdateOrderItemRequest true "Update order item request"
// @Success 200 {object} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id} [put]
func (h *Handler) UpdateOrderItem(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdateOrderItemRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update order item request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().UpdateOrderItem(c.Request().Context(), itemID, req)
	if err != nil {
		log.Printf("UpdateOrderItem failed for id %s: %v", itemID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update order item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"order item not found",
			"order item not found",
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item updated successfully",
		item,
		http.StatusOK,
	))
}

// UpdateOrderItemQuantity updates quantity of an order item
// @Summary Update order item quantity
// @Description Update the quantity of an order item
// @Tags Order Items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Param request body model.UpdateOrderItemQuantityRequest true "Update order item quantity request"
// @Success 200 {object} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id}/quantity [put]
func (h *Handler) UpdateOrderItemQuantity(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdateOrderItemQuantityRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update order item quantity request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if req.Quantity <= 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"quantity must be greater than 0",
			"quantity must be greater than 0",
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().UpdateOrderItemQuantity(c.Request().Context(), itemID, req.Quantity)
	if err != nil {
		log.Printf("UpdateOrderItemQuantity failed for id %s: %v", itemID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update order item quantity",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item quantity updated successfully",
		item,
		http.StatusOK,
	))
}

// UpdateOrderItemStatus updates status of an order item
// @Summary Update order item status
// @Description Update the status of an order item
// @Tags Order Items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Param request body model.UpdateOrderItemStatusRequest true "Update order item status request"
// @Success 200 {object} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id}/status [put]
func (h *Handler) UpdateOrderItemStatus(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.UpdateOrderItemStatusRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update order item status request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if req.Status == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"status is required",
			"missing required field: status",
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().UpdateOrderItemStatus(c.Request().Context(), itemID, req.Status)
	if err != nil {
		log.Printf("UpdateOrderItemStatus failed for id %s: %v", itemID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to update order item status",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item status updated successfully",
		item,
		http.StatusOK,
	))
}

// CancelOrderItem cancels an order item
// @Summary Cancel order item
// @Description Cancel an order item
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Success 200 {object} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id}/cancel [post]
func (h *Handler) CancelOrderItem(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().CancelOrderItem(c.Request().Context(), itemID)
	if err != nil {
		log.Printf("CancelOrderItem failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to cancel order item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// Send notification to kitchen staff using saved tokens
	if h.fcmClient != nil {
		// Get all kitchen staff users with role='kitchen'
		kitchenStaff, err := h.repo.Tenant(c.Request().Context()).GetUsersByRole(c.Request().Context(), "kitchen")
		if err == nil {
			for _, staff := range kitchenStaff {
				if staff.FcmToken != nil && strings.TrimSpace(*staff.FcmToken) != "" {
					// Send cancellation notification to each kitchen staff
					_ = h.service.Order().SendNotificationByStatus(c.Request().Context(), h.fcmClient, *staff.FcmToken, item.OrderID, "cancelled", "")
				}
			}
		}
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item cancelled successfully",
		item,
		http.StatusOK,
	))
}

// MarkOrderItemCooking marks an order item as cooking
// @Summary Mark order item cooking
// @Description Mark an order item as cooking
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Success 200 {object} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id}/cooking [post]
func (h *Handler) MarkOrderItemCooking(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().MarkOrderItemCooking(c.Request().Context(), itemID)
	if err != nil {
		log.Printf("MarkOrderItemCooking failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to mark order item cooking",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item marked as cooking successfully",
		item,
		http.StatusOK,
	))
}

// MarkOrderItemReady marks an order item as ready
// @Summary Mark order item ready
// @Description Mark an order item as ready
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Success 200 {object} model.OrderItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id}/ready [post]
func (h *Handler) MarkOrderItemReady(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().MarkOrderItemReady(c.Request().Context(), itemID)
	if err != nil {
		log.Printf("MarkOrderItemReady failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to mark order item ready",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// Send notification to waiter using saved token
	if h.fcmClient != nil {
		// Get order to find waiter_id
		order, err := h.service.Order().GetOrderByID(c.Request().Context(), item.OrderID)
		if err == nil && order != nil && order.WaiterID != nil {
			// Get waiter's saved FCM token from database
			waiterUUID, err := uuid.Parse(*order.WaiterID)
			if err == nil {
				waiter, err := h.repo.Tenant(c.Request().Context()).GetUserByID(c.Request().Context(), waiterUUID)
				if err == nil && waiter.FcmToken != nil && strings.TrimSpace(*waiter.FcmToken) != "" {
					// Send notification with waiter's saved token
					_ = h.service.Order().SendNotificationByStatus(c.Request().Context(), h.fcmClient, *waiter.FcmToken, item.OrderID, "ready", "")
				}
			}
		}
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item marked as ready successfully",
		item,
		http.StatusOK,
	))
}

// DeleteOrderItem deletes an order item (soft delete)
// @Summary Delete order item
// @Description Delete (soft delete) an order item
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id} [delete]
func (h *Handler) DeleteOrderItem(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if err := h.service.Order().DeleteOrderItem(c.Request().Context(), itemID); err != nil {
		log.Printf("DeleteOrderItem failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete order item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item deleted successfully",
		struct{}{},
		http.StatusOK,
	))
}

// RestoreOrderItem restores a deleted order item
// @Summary Restore order item
// @Description Restore a soft-deleted order item
// @Tags Order Items
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order Item ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/order-items/{id}/restore [post]
func (h *Handler) RestoreOrderItem(c echo.Context) error {
	itemID := c.Param("id")
	if itemID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order item id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(itemID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order item id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if err := h.service.Order().RestoreOrderItem(c.Request().Context(), itemID); err != nil {
		log.Printf("RestoreOrderItem failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to restore order item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order item restored successfully",
		struct{}{},
		http.StatusOK,
	))
}

// // ==================== KITCHEN QUEUE ====================

// // GetKitchenQueue retrieves kitchen queue items
// // @Summary Get kitchen queue
// // @Description Get kitchen queue items (pending/cooking)
// // @Tags Kitchen
// // @Produce json
// // @Security BearerAuth
// // @Param lang query string false "Language (uz, ru, en)" default(uz)
// // @Success 200 {object} []service.KitchenQueueItem
// // @Failure 401 {object} model.ErrorResponse
// // @Failure 500 {object} model.ErrorResponse
// // @Router /api/v1/kitchen/queue [get]
// func (h *Handler) GetKitchenQueue(c echo.Context) error {
// 	items, err := h.service.Order().GetKitchenQueue(c.Request().Context())
// 	if err != nil {
// 		log.Printf("GetKitchenQueue failed: %v", err)
// 		return c.JSON(http.StatusInternalServerError, model.ErrorResponse{Message: "failed to fetch kitchen queue"})
// 	}
// 	return c.JSON(http.StatusOK, items)
// }

// ActivateOrder manually activates a reserved/rescheduled order
// @Summary Activate reserved order
// @Description Manually activate a reserved or rescheduled order (sets status to open)
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/activate [post]
func (h *Handler) ActivateOrder(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().ActivateOrder(c.Request().Context(), orderID)
	if err != nil {
		log.Printf("ActivateOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to activate order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order activated successfully",
		order,
		http.StatusOK,
	))
}

// RescheduleOrder reschedules a reserved/rescheduled order to a new time
// @Summary Reschedule order
// @Description Move a reservation to a new scheduled time with an optional comment
// @Tags Orders
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Order ID"
// @Param body body model.RescheduleOrderRequest true "Reschedule request"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders/{id}/reschedule [post]
func (h *Handler) RescheduleOrder(c echo.Context) error {
	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"order id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(orderID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid order id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var req model.RescheduleOrderRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request body",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	if req.ScheduledAt == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"scheduled_at is required",
			"scheduled_at must be a valid RFC3339 timestamp",
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().RescheduleOrder(c.Request().Context(), orderID, req)
	if err != nil {
		log.Printf("RescheduleOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to reschedule order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Order rescheduled successfully",
		order,
		http.StatusOK,
	))
}

// GetMyOrders retrieves current waiter's own orders
// @Summary Get my orders
// @Description Get current authenticated waiter's own orders with optional filters
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param scope query string false "Scope filter: active, reservations, history, all" default(active)
// @Param order_type query string false "Order type filter: dine_in, takeaway"
// @Param table_id query string false "Table ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} model.WaiterOrderListResponse
// @Failure 400 {object} model.ErrorData
// @Failure 401 {object} model.ErrorData
// @Failure 500 {object} model.ErrorData
// @Router /api/v1/orders/my [get]
func (h *Handler) GetMyOrders(c echo.Context) error {
	userID, _ := c.Get("user_id").(string)
	if userID == "" {
		return c.JSON(http.StatusUnauthorized, model.NewErrorResponse(
			"user not authenticated",
			"missing user_id in context",
			http.StatusUnauthorized,
		))
	}

	var req model.GetMyOrdersRequest

	// scope
	scope := model.WaiterOrderScopeActive
	if v := c.QueryParam("scope"); v != "" {
		scope = model.WaiterOrderScope(v)
		switch scope {
		case model.WaiterOrderScopeActive,
			model.WaiterOrderScopeReservations,
			model.WaiterOrderScopeHistory,
			model.WaiterOrderScopeAll:
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid scope",
				"scope must be one of: active, reservations, history, all",
				http.StatusBadRequest,
			))
		}
	}
	req.Scope = &scope

	// order_type
	if v := c.QueryParam("order_type"); v != "" {
		orderType := model.OrderType(v)
		switch orderType {
		case model.OrderTypeDineIn, model.OrderTypeTakeaway:
			req.OrderType = &orderType
		default:
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid order_type",
				"order_type must be one of: dine_in, takeaway",
				http.StatusBadRequest,
			))
		}
	}

	if v := c.QueryParam("table_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid table_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.TableID = &v
	}

	req.Limit = 20
	req.Offset = 0

	if v := c.QueryParam("limit"); v != "" {
		limit, err := strconv.ParseInt(v, 10, 32)
		if err != nil || limit <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		req.Limit = int32(limit)
	}

	if v := c.QueryParam("offset"); v != "" {
		offset, err := strconv.ParseInt(v, 10, 32)
		if err != nil || offset < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		req.Offset = int32(offset)
	}

	orders, err := h.service.Order().GetMyOrders(c.Request().Context(), userID, req)
	if err != nil {
		log.Printf("GetMyOrders failed for user_id %s: %v", userID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to fetch my orders",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"My orders retrieved successfully",
		orders,
		http.StatusOK,
	))
}
