package handler

import (
	"net/http"
	"strconv"
	"time"

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

// GetAllInvoices retrieves all invoices with pagination
// @Summary Get all invoices
// @Description Get all invoices with pagination
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.InvoiceResponse
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

	resp, err := h.service.Invoice().GetAllInvoices(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoices retrieved successfully",
		resp,
		http.StatusOK,
	))
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

// GetInvoicesByStatus retrieves invoices by status with pagination
// @Summary Get invoices by status
// @Description Get invoices filtered by status with pagination
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param status path string true "Invoice status (pending, arrived, received)"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/status/{status} [get]
func (h *Handler) GetInvoicesByStatus(c echo.Context) error {
	status := c.Param("status")
	if status == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"status is required",
			"missing path parameter: status",
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

	resp, err := h.service.Invoice().GetInvoicesByStatus(c.Request().Context(), status, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoices retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetInvoicesBySupplier retrieves invoices by supplier with pagination
// @Summary Get invoices by supplier
// @Description Get invoices for a specific supplier with pagination
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param supplier_id path string true "Supplier ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/supplier/{supplier_id} [get]
func (h *Handler) GetInvoicesBySupplier(c echo.Context) error {
	supplierID := c.Param("supplier_id")
	if supplierID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"supplier_id is required",
			"missing path parameter: supplier_id",
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

	resp, err := h.service.Invoice().GetInvoicesBySupplier(c.Request().Context(), supplierID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoices retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetInvoicesByDateRange retrieves invoices within a date range
// @Summary Get invoices by date range
// @Description Get invoices within a specified date range
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param start_date query string true "Start date (RFC3339 format)"
// @Param end_date query string true "End date (RFC3339 format)"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.InvoiceResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/date-range [get]
func (h *Handler) GetInvoicesByDateRange(c echo.Context) error {
	startDateStr := c.QueryParam("start_date")
	endDateStr := c.QueryParam("end_date")

	if startDateStr == "" || endDateStr == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"start_date and end_date are required",
			"missing required query parameters: start_date, end_date",
			http.StatusBadRequest,
		))
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start_date format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end_date format",
			err.Error(),
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

	resp, err := h.service.Invoice().GetInvoicesByDateRange(c.Request().Context(), startDate, endDate, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoices retrieved successfully",
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

// MarkInvoiceArrived marks an invoice as arrived
// @Summary Mark invoice arrived
// @Description Mark an invoice as arrived at the location
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
// @Router /api/v1/invoices/{id}/mark-arrived [post]
func (h *Handler) MarkInvoiceArrived(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().MarkInvoiceArrived(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice marked as arrived successfully",
		resp,
		http.StatusOK,
	))
}

// MarkInvoiceReceived marks an invoice as received
// @Summary Mark invoice received
// @Description Mark an invoice as fully received and verified
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
// @Router /api/v1/invoices/{id}/mark-received [post]
func (h *Handler) MarkInvoiceReceived(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().MarkInvoiceReceived(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice marked as received successfully",
		resp,
		http.StatusOK,
	))
}

// CancelInvoice cancels an invoice
// @Summary Cancel invoice
// @Description Cancel an invoice and mark it as cancelled
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
// @Router /api/v1/invoices/{id}/cancel [post]
func (h *Handler) CancelInvoice(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().CancelInvoice(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice cancelled successfully",
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
// @Success 200 {object} model.InvoiceWithDetailsResponse
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

// GetInvoiceStatsBySupplier retrieves invoice statistics grouped by supplier
// @Summary Get invoice stats by supplier
// @Description Get invoice statistics grouped by supplier
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.InvoiceStatsBySupplierResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/stats/supplier [get]
func (h *Handler) GetInvoiceStatsBySupplier(c echo.Context) error {
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

	resp, err := h.service.Invoice().GetInvoiceStatsBySupplier(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice statistics retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetInvoiceStatsByDateRange retrieves invoice statistics for a date range
// @Summary Get invoice stats by date range
// @Description Get invoice statistics for a specific date range
// @Tags Invoices
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param start_date query string true "Start date (RFC3339 format)"
// @Param end_date query string true "End date (RFC3339 format)"
// @Success 200 {object} model.InvoiceStatsByDateRangeResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoices/stats/date-range [get]
func (h *Handler) GetInvoiceStatsByDateRange(c echo.Context) error {
	startDateStr := c.QueryParam("start_date")
	endDateStr := c.QueryParam("end_date")

	if startDateStr == "" || endDateStr == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"start_date and end_date are required",
			"missing required query parameters: start_date, end_date",
			http.StatusBadRequest,
		))
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start_date format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end_date format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().GetInvoiceStatsByDateRange(c.Request().Context(), startDate, endDate)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice statistics retrieved successfully",
		resp,
		http.StatusOK,
	))
}
