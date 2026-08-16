package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateOutgoingInvoice creates a new outgoing invoice
// @Summary Create outgoing invoice
// @Description Create a new outgoing invoice. Add items, then confirm to deduct stock.
// @Tags OutgoingInvoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateOutgoingInvoiceRequest true "Create outgoing invoice"
// @Success 201 {object} model.OutgoingInvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices [post]
func (h *Handler) CreateOutgoingInvoice(c echo.Context) error {
	var req model.CreateOutgoingInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.OutgoingInvoice().CreateOutgoingInvoice(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create outgoing invoice", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Outgoing invoice created", resp, http.StatusCreated))
}

// GetOutgoingInvoice returns an outgoing invoice with its items
// @Summary Get outgoing invoice by ID
// @Description Returns invoice header + all items with stock_before/stock_after
// @Tags OutgoingInvoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Invoice ID"
// @Success 200 {object} model.OutgoingInvoiceWithItemsResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id} [get]
func (h *Handler) GetOutgoingInvoice(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.OutgoingInvoice().GetOutgoingInvoice(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("outgoing invoice not found", err.Error(), http.StatusNotFound))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("ok", resp, http.StatusOK))
}

// ListOutgoingInvoices returns outgoing invoices with filters, pagination, and total sum
// @Summary List outgoing invoices
// @Description List invoices filtered by storage, group, status, date range. Returns total count and total sum.
// @Tags OutgoingInvoices
// @Produce json
// @Security BearerAuth
// @Param lang       query string false "Language (uz, ru, en)" default(uz)
// @Param storage_id query string false "Filter by storage UUID"
// @Param group_id   query string false "Filter by deduction act group UUID"
// @Param status     query string false "Filter by status (active/cancelled)"
// @Param start_date query string false "Start date (RFC3339)"
// @Param end_date   query string false "End date (RFC3339)"
// @Param limit      query int    false "Limit"  default(20)
// @Param offset     query int    false "Offset" default(0)
// @Success 200 {object} model.OutgoingInvoiceListResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices [get]
func (h *Handler) ListOutgoingInvoices(c echo.Context) error {
	limit := int32(20)
	offset := int32(0)
	if l, err := strconv.Atoi(c.QueryParam("limit")); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.Atoi(c.QueryParam("offset")); err == nil && o >= 0 {
		offset = int32(o)
	}

	var storageID, groupID, status, startDate, endDate *string
	if v := c.QueryParam("storage_id"); v != "" {
		storageID = &v
	}
	if v := c.QueryParam("group_id"); v != "" {
		groupID = &v
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

	resp, err := h.service.OutgoingInvoice().ListOutgoingInvoices(c.Request().Context(), storageID, groupID, status, startDate, endDate, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to list outgoing invoices", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, resp)
}

// UpdateOutgoingInvoice updates an active outgoing invoice header
// @Summary Update outgoing invoice
// @Description Update storage, group, date, description. Only works on active invoices.
// @Tags OutgoingInvoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param id      path  string true  "Invoice ID"
// @Param request body model.UpdateOutgoingInvoiceRequest true "Update invoice"
// @Success 200 {object} model.OutgoingInvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id} [put]
func (h *Handler) UpdateOutgoingInvoice(c echo.Context) error {
	id := c.Param("id")
	var req model.UpdateOutgoingInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.OutgoingInvoice().UpdateOutgoingInvoice(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update outgoing invoice", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Outgoing invoice updated", resp, http.StatusOK))
}

// ConfirmOutgoingInvoice confirms an invoice and deducts ingredient stock
// @Summary Confirm outgoing invoice
// @Description Confirms invoice. Deducts each item's quantity from ingredient_stock and saves stock snapshots.
// @Tags OutgoingInvoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Invoice ID"
// @Success 200 {object} model.OutgoingInvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id}/confirm [post]
func (h *Handler) ConfirmOutgoingInvoice(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.OutgoingInvoice().ConfirmOutgoingInvoice(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("failed to confirm outgoing invoice", err.Error(), http.StatusBadRequest))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Invoice confirmed, stock deducted", resp, http.StatusOK))
}

// CancelOutgoingInvoice cancels an active outgoing invoice
// @Summary Cancel outgoing invoice
// @Description Cancels an invoice (no stock change)
// @Tags OutgoingInvoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Invoice ID"
// @Success 200 {object} model.OutgoingInvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id}/cancel [post]
func (h *Handler) CancelOutgoingInvoice(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.OutgoingInvoice().CancelOutgoingInvoice(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("failed to cancel outgoing invoice", err.Error(), http.StatusBadRequest))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Outgoing invoice cancelled", resp, http.StatusOK))
}

// DeleteOutgoingInvoice soft-deletes an active outgoing invoice
// @Summary Delete outgoing invoice
// @Description Soft-deletes an invoice. Only active invoices can be deleted.
// @Tags OutgoingInvoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id   path  string true  "Invoice ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id} [delete]
func (h *Handler) DeleteOutgoingInvoice(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.OutgoingInvoice().DeleteOutgoingInvoice(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete outgoing invoice", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Outgoing invoice deleted", struct{}{}, http.StatusOK))
}

// CreateOutgoingInvoiceBatch creates an outgoing invoice with items in one call
// @Summary Create outgoing invoice with items (batch)
// @Description Creates invoice header and upserts all items in one request. Returns full invoice with stock preview.
// @Tags OutgoingInvoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateOutgoingInvoiceBatchRequest true "Batch create"
// @Success 201 {object} model.OutgoingInvoiceWithItemsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/batch [post]
func (h *Handler) CreateOutgoingInvoiceBatch(c echo.Context) error {
	var req model.CreateOutgoingInvoiceBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.OutgoingInvoice().CreateOutgoingInvoiceBatch(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create outgoing invoice batch", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Outgoing invoice created with items", resp, http.StatusCreated))
}

// UpsertOutgoingInvoiceItems adds or updates ingredient items in an active invoice
// @Summary Upsert outgoing invoice items
// @Description Add/update multiple ingredient items. Returns items with live stock preview.
// @Tags OutgoingInvoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param id      path  string true  "Invoice ID"
// @Param request body model.UpsertOutgoingInvoiceItemsRequest true "Items to upsert"
// @Success 200 {object} []model.OutgoingInvoiceItemResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id}/items [post]
func (h *Handler) UpsertOutgoingInvoiceItems(c echo.Context) error {
	id := c.Param("id")
	var req model.UpsertOutgoingInvoiceItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.OutgoingInvoice().UpsertOutgoingInvoiceItems(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to upsert items", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Items saved", resp, http.StatusOK))
}

// DeleteOutgoingInvoiceItem removes an item from an active invoice
// @Summary Delete outgoing invoice item
// @Description Remove an ingredient item from an active invoice
// @Tags OutgoingInvoices
// @Produce json
// @Security BearerAuth
// @Param lang    query string false "Language (uz, ru, en)" default(uz)
// @Param id      path  string true  "Invoice ID"
// @Param item_id path  string true  "Item ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/outgoing-invoices/{id}/items/{item_id} [delete]
func (h *Handler) DeleteOutgoingInvoiceItem(c echo.Context) error {
	itemID := c.Param("item_id")
	if err := h.service.OutgoingInvoice().DeleteOutgoingInvoiceItem(c.Request().Context(), itemID); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete item", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Item deleted", struct{}{}, http.StatusOK))
}
