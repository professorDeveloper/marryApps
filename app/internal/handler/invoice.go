package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateSupplierInvoice creates a new supplier invoice
// @Summary Create supplier invoice
// @Description Create a new supplier invoice
// @Tags Invoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateInvoiceRequest true "Create invoice request"
// @Success 201 {object} model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices [post]
func (h *Handler) CreateSupplierInvoice(c echo.Context) error {
	var req model.CreateInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().CreateInvoice(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Invoice created successfully",
		resp,
		http.StatusCreated,
	))
}

// GetAllInvoices retrieves all invoices with optional filters and pagination
// @Summary Get all invoices
// @Description Get all invoices with optional filters: date range, storage, supplier, ingredient, status
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param date_from query string false "Filter from date (YYYY-MM-DD or RFC3339)"
// @Param date_to query string false "Filter to date (YYYY-MM-DD or RFC3339)"
// @Param storage_id query string false "Filter by storage ID"
// @Param supplier_id query string false "Filter by supplier ID"
// @Param ingredient_id query string false "Filter by ingredient ID (invoices containing this ingredient)"
// @Param status query string false "Filter by status (pending, arrived, received, cancelled)"
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices [get]
func (h *Handler) GetAllInvoices(c echo.Context) error {
	limit := int32(20)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	dateFrom := c.QueryParam("date_from")
	dateTo := c.QueryParam("date_to")

	filter := model.InvoiceFilter{
		StorageID:    c.QueryParam("storage_id"),
		SupplierID:   c.QueryParam("supplier_id"),
		IngredientID: c.QueryParam("ingredient_id"),
		Status:       c.QueryParam("status"),
	}
	if dateFrom != "" {
		filter.DateFrom = &dateFrom
	}
	if dateTo != "" {
		filter.DateTo = &dateTo
	}

	resp, total, err := h.service.Invoice().GetAllInvoices(c.Request().Context(), filter, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, resp, "invoices"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoices retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoices retrieved successfully", resp, int32(total), limit, offset, http.StatusOK))
}

// GetInvoice retrieves a single invoice by ID
// @Summary Get invoice by ID
// @Description Get a single invoice by its ID
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Success 200 {object} model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id} [get]
func (h *Handler) GetInvoice(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().GetInvoiceByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice retrieved successfully",
		resp,
		http.StatusOK,
	))
}


// SearchInvoices searches invoices by supplier name
// @Summary Search invoices
// @Description Search invoices by supplier name
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param q query string true "Search query (supplier name)"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/search [get]
func (h *Handler) SearchInvoices(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"search query is required",
			"missing query parameter: q",
			http.StatusBadRequest,
		))
	}

	limit := int32(20)
	if l := c.QueryParam("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil {
			limit = int32(val)
		}
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil {
			offset = int32(val)
		}
	}

	resp, err := h.service.Invoice().SearchInvoices(c.Request().Context(), query, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoices retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateInvoice updates an existing invoice
// @Summary Update invoice
// @Description Update an existing invoice
// @Tags Invoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Param request body model.UpdateInvoiceRequest true "Update invoice request"
// @Success 200 {object} model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id} [put]
func (h *Handler) UpdateInvoice(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().UpdateInvoice(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice updated successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateInvoiceStatus updates invoice status
// @Summary Update invoice status
// @Description Update the status of an invoice
// @Tags Invoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Param request body model.UpdateInvoiceStatusRequest true "Status update request"
// @Success 200 {object} model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id}/status [patch]
func (h *Handler) UpdateInvoiceStatus(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateInvoiceStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().UpdateInvoiceStatus(c.Request().Context(), id, req.Status)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice status updated successfully",
		resp,
		http.StatusOK,
	))
}


// DeleteInvoice deletes an invoice (soft delete)
// @Summary Delete invoice
// @Description Delete (soft delete) an invoice
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id} [delete]
func (h *Handler) DeleteInvoice(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	err := h.service.Invoice().DeleteInvoice(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreInvoice restores a deleted invoice
// @Summary Restore invoice
// @Description Restore a soft-deleted invoice
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Success 200 {object} model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id}/restore [post]
func (h *Handler) RestoreInvoice(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	err := h.service.Invoice().RestoreInvoice(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice restored successfully",
		struct{}{},
		http.StatusOK,
	))
}

// GetInvoiceWithDetails retrieves a complete invoice with all details and ingredient information
// @Summary Get invoice with details
// @Description Get a complete invoice including all line items and ingredient details
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Success 200 {object} model.InvoiceGetWithDetailsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id}/details [get]
func (h *Handler) GetInvoiceWithDetails(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().GetInvoiceWithDetails(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice retrieved successfully",
		resp,
		http.StatusOK,
	))
}


// CreateInvoiceWithDetails creates a new invoice with all its details in a single atomic transaction
// @Summary Create invoice with details in batch
// @Description Create a new invoice and all its line items in one atomic call
// @Tags Invoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateInvoiceWithDetailsRequest true "Create invoice with details request"
// @Success 201 {object} model.CreateInvoiceWithDetailsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/batch [post]
func (h *Handler) CreateInvoiceWithDetails(c echo.Context) error {
	var req model.CreateInvoiceWithDetailsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	// Validate that details array is not empty
	if len(req.Details) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			"details array cannot be empty",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().CreateInvoiceWithDetails(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Invoice with details created successfully",
		resp,
		http.StatusCreated,
	))
}


// UpsertInvoiceDetails replaces all invoice details and adjusts stock accordingly
// @Summary Batch update invoice details
// @Description Replace all details of an invoice. Reverses old stock additions and applies new quantities.
// @Tags Invoices
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice ID"
// @Param request body model.UpsertInvoiceDetailsRequest true "New invoice details"
// @Success 200 {object} model.UpsertInvoiceDetailsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/{id}/details/batch [put]
func (h *Handler) UpsertInvoiceDetails(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "invoice id is required", http.StatusBadRequest))
	}

	var req model.UpsertInvoiceDetailsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Invoice().UpsertInvoiceDetails(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice details updated successfully",
		resp,
		http.StatusOK,
	))
}
