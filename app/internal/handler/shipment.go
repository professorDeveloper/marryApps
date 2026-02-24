package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateShipment creates a new shipment (draft)
// @Summary Create shipment
// @Description Create a new shipment in draft status. Add items, then confirm to deduct stock.
// @Tags Shipments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateShipmentRequest true "Create shipment"
// @Success 201 {object} model.ShipmentResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments [post]
func (h *Handler) CreateShipment(c echo.Context) error {
	var req model.CreateShipmentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.Shipment().CreateShipment(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create shipment", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Shipment created", resp, http.StatusCreated))
}

// GetShipment returns a shipment with its items
// @Summary Get shipment by ID
// @Description Returns shipment header + all items with stock_before/stock_after snapshots
// @Tags Shipments
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shipment ID"
// @Success 200 {object} model.ShipmentWithItemsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id} [get]
func (h *Handler) GetShipment(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.Shipment().GetShipment(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("shipment not found", err.Error(), http.StatusNotFound))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("ok", resp, http.StatusOK))
}

// ListShipments returns shipments with filters and pagination
// @Summary List shipments
// @Description List shipments filtered by storage, supplier, status, date range
// @Tags Shipments
// @Produce json
// @Security BearerAuth
// @Param storage_id  query string false "Filter by storage UUID"
// @Param supplier_id query string false "Filter by supplier UUID"
// @Param status      query string false "Filter by status (draft/confirmed/cancelled)"
// @Param start_date  query string false "Start date (RFC3339)"
// @Param end_date    query string false "End date (RFC3339)"
// @Param limit       query int    false "Limit"  default(20)
// @Param offset      query int    false "Offset" default(0)
// @Success 200 {object} []model.ShipmentResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments [get]
func (h *Handler) ListShipments(c echo.Context) error {
	limit := int32(20)
	offset := int32(0)
	if l, err := strconv.Atoi(c.QueryParam("limit")); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.Atoi(c.QueryParam("offset")); err == nil && o >= 0 {
		offset = int32(o)
	}

	var storageID, supplierID, status, startDate, endDate *string
	if v := c.QueryParam("storage_id"); v != "" {
		storageID = &v
	}
	if v := c.QueryParam("supplier_id"); v != "" {
		supplierID = &v
	}
	if v := c.QueryParam("status"); v != "" {
		status = &v
	}
	if v := c.QueryParam("start_date"); v != "" {
		startDate = &v
	}
	if v := c.QueryParam("end_date"); v != "" {
		endDate = &v
	}

	rows, total, err := h.service.Shipment().ListShipments(c.Request().Context(), storageID, supplierID, status, startDate, endDate, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to list shipments", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":   rows,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// UpdateShipment updates a draft shipment header
// @Summary Update shipment
// @Description Update storage, supplier, date, description. Only works on draft shipments.
// @Tags Shipments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shipment ID"
// @Param request body model.UpdateShipmentRequest true "Update shipment"
// @Success 200 {object} model.ShipmentResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id} [put]
func (h *Handler) UpdateShipment(c echo.Context) error {
	id := c.Param("id")
	var req model.UpdateShipmentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.Shipment().UpdateShipment(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update shipment", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shipment updated", resp, http.StatusOK))
}

// ConfirmShipment confirms a draft shipment and deducts ingredient stock
// @Summary Confirm shipment
// @Description Confirms shipment (draft→confirmed). Deducts each item's quantity from ingredient_stock. Stock can go negative.
// @Tags Shipments
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shipment ID"
// @Success 200 {object} model.ShipmentResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id}/confirm [post]
func (h *Handler) ConfirmShipment(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.Shipment().ConfirmShipment(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("failed to confirm shipment", err.Error(), http.StatusBadRequest))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shipment confirmed, stock deducted", resp, http.StatusOK))
}

// CancelShipment cancels a draft shipment
// @Summary Cancel shipment
// @Description Cancels a draft shipment (no stock change)
// @Tags Shipments
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shipment ID"
// @Success 200 {object} model.ShipmentResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id}/cancel [post]
func (h *Handler) CancelShipment(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.Shipment().CancelShipment(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("failed to cancel shipment", err.Error(), http.StatusBadRequest))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shipment cancelled", resp, http.StatusOK))
}

// DeleteShipment soft-deletes a draft shipment
// @Summary Delete shipment
// @Description Soft-deletes a shipment. Only draft shipments can be deleted.
// @Tags Shipments
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shipment ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id} [delete]
func (h *Handler) DeleteShipment(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.Shipment().DeleteShipment(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete shipment", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shipment deleted", struct{}{}, http.StatusOK))
}

// CreateShipmentBatch creates a shipment with multiple items in one call
// @Summary Create shipment with items (batch)
// @Description Creates a shipment header and upserts all provided items in a single request. Returns full shipment with stock preview.
// @Tags Shipments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateShipmentBatchRequest true "Batch create"
// @Success 201 {object} model.ShipmentWithItemsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/batch [post]
func (h *Handler) CreateShipmentBatch(c echo.Context) error {
	var req model.CreateShipmentBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.Shipment().CreateShipmentBatch(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create shipment batch", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Shipment created with items", resp, http.StatusCreated))
}

// UpsertShipmentItem adds or updates one or more ingredient items in an active shipment
// @Summary Upsert shipment items
// @Description Add/update multiple ingredient items. Each item is upserted (insert or update by ingredient_id). Returns items with live stock preview.
// @Tags Shipments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shipment ID"
// @Param request body model.UpsertShipmentItemsRequest true "Items to upsert"
// @Success 200 {object} []model.ShipmentItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id}/items [post]
func (h *Handler) UpsertShipmentItem(c echo.Context) error {
	id := c.Param("id")
	var req model.UpsertShipmentItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.Shipment().UpsertShipmentItems(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to upsert items", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Items saved", resp, http.StatusOK))
}

// DeleteShipmentItem removes an item from a draft shipment
// @Summary Delete shipment item
// @Description Remove an ingredient item from a draft shipment
// @Tags Shipments
// @Produce json
// @Security BearerAuth
// @Param id      path string true "Shipment ID"
// @Param item_id path string true "Item ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/shipments/{id}/items/{item_id} [delete]
func (h *Handler) DeleteShipmentItem(c echo.Context) error {
	itemID := c.Param("item_id")
	if err := h.service.Shipment().DeleteShipmentItem(c.Request().Context(), itemID); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete item", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Item deleted", struct{}{}, http.StatusOK))
}
