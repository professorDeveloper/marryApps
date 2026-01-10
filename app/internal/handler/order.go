package handler

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// ==================== ORDERS ====================

// CreateOrder creates a new order
// @Summary Create order
// @Description Create a new order
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

	if req.TableID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"table_id is required",
			"missing required field: table_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(req.TableID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid table_id format",
			err.Error(),
			http.StatusBadRequest,
		))
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

	order, err := h.service.Order().CreateOrder(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateOrder failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create order",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Order created successfully",
		order,
		http.StatusCreated,
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

// GetAllOrders retrieves all orders with pagination
// @Summary Get all orders
// @Description Get all orders with pagination
// @Tags Orders
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.OrderResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/orders [get]
func (h *Handler) GetAllOrders(c echo.Context) error {
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

	orders, err := h.service.Order().GetAllOrders(c.Request().Context(), limit, offset)
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
	if req.CashierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"cashier_id is required",
			"missing required field: cashier_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(req.CashierID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid cashier_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	order, err := h.service.Order().MarkOrderPaid(c.Request().Context(), orderID, req.CashierID)
	if err != nil {
		log.Printf("MarkOrderPaid failed for id %s: %v", orderID, err)
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

// CreateOrderItem creates a new order item
// @Summary Create order item
// @Description Create a new order item
// @Tags Order Items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateOrderItemRequest true "Create order item request"
// @Success 201 {object} model.OrderItemResponse
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
	if req.GoodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"good_id is required",
			"missing required field: good_id",
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
	if req.Price == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"price is required",
			"missing required field: price",
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
	if _, err := uuid.Parse(req.GoodID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid good_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Order().CreateOrderItem(c.Request().Context(), req)
	if err != nil {
		log.Printf("CreateOrderItem failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to create order item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Order item created successfully",
		item,
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
// @Success 200 {object} model.OrderItemResponse
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

	items, err := h.service.Order().GetOrderItemsByOrderID(c.Request().Context(), orderID)
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
