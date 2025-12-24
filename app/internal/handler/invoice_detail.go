package handler

import (
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	invoiceID := req.InvoiceID
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invoice_id is required"})
	}

	resp, err := h.service.Invoice().CreateInvoiceDetail(c.Request().Context(), invoiceID, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, resp)
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
// @Success 200 {object} []model.InvoiceDetailResponse
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

	resp, err := h.service.Invoice().GetAllInvoiceDetails(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

func (h *Handler) GetInvoiceDetailsWithIngredients(c echo.Context) error {
	invoiceID := c.QueryParam("invoice_id")
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invoice_id is required"})
	}

	details, err := h.service.Invoice().GetInvoiceDetailsByInvoiceID(c.Request().Context(), invoiceID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	resp := make([]*model.InvoiceDetailWithIngredientResponse, 0, len(details))
	for _, d := range details {
		row, err := h.service.Invoice().GetInvoiceDetailWithIngredient(c.Request().Context(), d.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		resp = append(resp, row)
	}

	return c.JSON(http.StatusOK, resp)
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	resp, err := h.service.Invoice().GetInvoiceDetailByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
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
// @Success 200 {object} []model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/invoice/{invoice_id} [get]
func (h *Handler) GetInvoiceDetailsByInvoice(c echo.Context) error {
	invoiceID := c.Param("invoice_id")
	if invoiceID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invoice_id is required"})
	}

	resp, err := h.service.Invoice().GetInvoiceDetailsByInvoiceID(c.Request().Context(), invoiceID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
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
// @Success 200 {object} []model.InvoiceDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/invoice-details/ingredient/{ingredient_id} [get]
func (h *Handler) GetInvoiceDetailsByIngredient(c echo.Context) error {
	ingredientID := c.Param("ingredient_id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "ingredient_id is required"})
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

	resp, err := h.service.Invoice().GetInvoiceDetailsByIngredientID(c.Request().Context(), ingredientID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	var req model.UpdateInvoiceDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	resp, err := h.service.Invoice().UpdateInvoiceDetail(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	var req model.UpdateInvoiceDetailQuantityRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	resp, err := h.service.Invoice().UpdateInvoiceDetailQuantity(c.Request().Context(), id, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	err := h.service.Invoice().DeleteInvoiceDetail(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	err := h.service.Invoice().RestoreInvoiceDetail(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.NoContent(http.StatusNoContent)
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
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	resp, err := h.service.Invoice().GetInvoiceDetailWithIngredient(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}
