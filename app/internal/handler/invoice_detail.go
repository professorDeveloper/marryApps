package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateInvoiceDetail creates a new invoice detail (line item)
// @Summary Create invoice detail
// @Description Create a new line item in an invoice
// @Tags Invoice Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateInvoiceDetailRequest true "Create invoice detail request"
// @Success 201 {object} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details [post]
func (h *Handler) CreateInvoiceDetail(c echo.Context) error {
	var req model.CreateInvoiceDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	invoiceID := req.InvoiceID
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invoice_id is required",
			"missing required field: invoice_id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().CreateInvoiceDetail(c.Request().Context(), invoiceID, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Invoice detail created successfully",
		resp,
		http.StatusCreated,
	))
}

// CreateInvoiceDetailsBatch creates multiple invoice details in a single call
// @Summary Create multiple invoice details in batch
// @Description Create multiple line items in an invoice with a single API call
// @Tags Invoice Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body []model.CreateInvoiceDetailRequest true "Array of invoice detail requests"
// @Success 201 {object} model.InvoiceDetailBatchResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/batch [post]
func (h *Handler) CreateInvoiceDetailsBatch(c echo.Context) error {
	var details []model.CreateInvoiceDetailRequest
	if err := c.Bind(&details); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if len(details) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			"details array cannot be empty",
			http.StatusBadRequest,
		))
	}

	// Extract invoice ID from first detail
	invoiceID := details[0].InvoiceID
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invoice_id is required",
			"missing required field: invoice_id in first detail",
			http.StatusBadRequest,
		))
	}

	// Verify all details belong to the same invoice
	for i, detail := range details {
		if detail.InvoiceID != invoiceID {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid request",
				fmt.Sprintf("all details must belong to the same invoice. Detail %d has different invoice_id", i+1),
				http.StatusBadRequest,
			))
		}
	}

	// Create a batch request from the slice
	req := &model.CreateInvoiceDetailBatchRequest{
		Details: details,
	}

	resp, err := h.service.Invoice().CreateInvoiceDetailsBatch(c.Request().Context(), invoiceID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Invoice details batch processed successfully",
		resp,
		http.StatusCreated,
	))
}

// GetAllInvoiceDetails retrieves all invoice details with pagination
// @Summary Get all invoice details
// @Description Get all invoice details with pagination
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details [get]
func (h *Handler) GetAllInvoiceDetails(c echo.Context) error {
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

	resp, total, err := h.service.Invoice().GetAllInvoiceDetails(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, resp, "invoice_detailed"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoice details retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoice details retrieved successfully", resp, int32(total), limit, offset, http.StatusOK))
}

func (h *Handler) GetInvoiceDetailsWithIngredients(c echo.Context) error {
	invoiceID := c.QueryParam("invoice_id")
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invoice_id is required",
			"missing query parameter: invoice_id",
			http.StatusBadRequest,
		))
	}

	details, _, err := h.service.Invoice().GetInvoiceDetailsByInvoiceID(c.Request().Context(), invoiceID, 1000, 0)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	resp := make([]*model.InvoiceDetailWithIngredientResponse, 0, len(details))
	for _, d := range details {
		row, err := h.service.Invoice().GetInvoiceDetailWithIngredient(c.Request().Context(), d.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
		}
		resp = append(resp, row)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice details retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetInvoiceDetail retrieves a single invoice detail by ID
// @Summary Get invoice detail by ID
// @Description Get a single invoice detail by its ID
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice Detail ID"
// @Success 200 {object} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/{id} [get]
func (h *Handler) GetInvoiceDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().GetInvoiceDetailByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice detail retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetInvoiceDetailsByInvoice retrieves all details for a specific invoice
// @Summary Get invoice details by invoice ID
// @Description Get all line items for a specific invoice with pagination
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param invoice_id path string true "Invoice ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/invoice/{invoice_id} [get]
func (h *Handler) GetInvoiceDetailsByInvoice(c echo.Context) error {
	invoiceID := c.Param("invoice_id")
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invoice_id is required",
			"missing path parameter: invoice_id",
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

	resp, total, err := h.service.Invoice().GetInvoiceDetailsByInvoiceID(c.Request().Context(), invoiceID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, resp, "invoice_detailed"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoice details retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoice details retrieved successfully", resp, int32(total), limit, offset, http.StatusOK))
}

// GetInvoiceDetailsByIngredient retrieves invoice details for a specific ingredient
// @Summary Get invoice details by ingredient ID
// @Description Get all invoice details containing a specific ingredient with pagination
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param ingredient_id path string true "Ingredient ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/ingredient/{ingredient_id} [get]
func (h *Handler) GetInvoiceDetailsByIngredient(c echo.Context) error {
	ingredientID := c.Param("ingredient_id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"ingredient_id is required",
			"missing path parameter: ingredient_id",
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

	resp, total, err := h.service.Invoice().GetInvoiceDetailsByIngredientID(c.Request().Context(), ingredientID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, resp, "invoice_detailed"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoice details retrieved successfully", maps, int32(total), limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedResponse("Invoice details retrieved successfully", resp, int32(total), limit, offset, http.StatusOK))
}

// UpdateInvoiceDetail updates an existing invoice detail
// @Summary Update invoice detail
// @Description Update an existing invoice detail (line item)
// @Tags Invoice Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice Detail ID"
// @Param request body model.UpdateInvoiceDetailRequest true "Update invoice detail request"
// @Success 200 {object} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/{id} [put]
func (h *Handler) UpdateInvoiceDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateInvoiceDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().UpdateInvoiceDetail(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice detail updated successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateInvoiceDetailQuantity updates the quantity of an invoice detail
// @Summary Update invoice detail quantity
// @Description Update the quantity of a line item in an invoice
// @Tags Invoice Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice Detail ID"
// @Param request body model.UpdateInvoiceDetailQuantityRequest true "Quantity update request"
// @Success 200 {object} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/{id}/quantity [put]
func (h *Handler) UpdateInvoiceDetailQuantity(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateInvoiceDetailQuantityRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().UpdateInvoiceDetailQuantity(c.Request().Context(), id, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice detail quantity updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteInvoiceDetail deletes an invoice detail (soft delete)
// @Summary Delete invoice detail
// @Description Delete (soft delete) an invoice detail
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice Detail ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/{id} [delete]
func (h *Handler) DeleteInvoiceDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	err := h.service.Invoice().DeleteInvoiceDetail(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreInvoiceDetail restores a deleted invoice detail
// @Summary Restore invoice detail
// @Description Restore a soft-deleted invoice detail
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice Detail ID"
// @Success 200 {object} model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/{id}/restore [post]
func (h *Handler) RestoreInvoiceDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	err := h.service.Invoice().RestoreInvoiceDetail(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice detail restored successfully",
		struct{}{},
		http.StatusOK,
	))
}

// GetInvoiceDetailWithIngredient retrieves invoice detail with ingredient information
// @Summary Get invoice detail with ingredient
// @Description Get invoice detail including the associated ingredient information
// @Tags Invoice Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Invoice Detail ID"
// @Success 200 {object} model.InvoiceDetailWithIngredientResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/{id}/with-ingredient [get]
func (h *Handler) GetInvoiceDetailWithIngredient(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Invoice().GetInvoiceDetailWithIngredient(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Invoice detail retrieved successfully",
		resp,
		http.StatusOK,
	))
}
