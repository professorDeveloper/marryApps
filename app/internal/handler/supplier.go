package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateSupplier creates a new supplier
// @Summary Create supplier
// @Description Create a new supplier
// @Tags Suppliers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateSupplierRequest true "Create supplier request"
// @Success 201 {object} model.SupplierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers [post]
func (h *Handler) CreateSupplier(c echo.Context) error {
	var req model.CreateSupplierRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Supplier().CreateSupplier(c.Request().Context(), &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Supplier created successfully",
		resp,
		http.StatusCreated,
	))
}

// GetAllSuppliers retrieves all suppliers with pagination
// @Summary Get all suppliers
// @Description Get all suppliers with pagination
// @Tags Suppliers
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.SupplierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers [get]
func (h *Handler) GetAllSuppliers(c echo.Context) error {
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

	resp, err := h.service.Supplier().GetAllSuppliers(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Suppliers retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetSupplier retrieves a single supplier by ID
// @Summary Get supplier by ID
// @Description Get a single supplier by its ID
// @Tags Suppliers
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Supplier ID"
// @Success 200 {object} model.SupplierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers/{id} [get]
func (h *Handler) GetSupplier(c echo.Context) error {
	id := c.Param("id")

	resp, err := h.service.Supplier().GetSupplierByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Supplier retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateSupplier updates a supplier
// @Summary Update supplier
// @Description Update a supplier
// @Tags Suppliers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Supplier ID"
// @Param request body model.UpdateSupplierRequest true "Update supplier request"
// @Success 200 {object} model.SupplierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers/{id} [put]
func (h *Handler) UpdateSupplier(c echo.Context) error {
	id := c.Param("id")

	var req model.UpdateSupplierRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Supplier().UpdateSupplier(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Supplier updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteSupplier soft-deletes a supplier
// @Summary Delete supplier
// @Description Soft delete a supplier
// @Tags Suppliers
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Supplier ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers/{id} [delete]
func (h *Handler) DeleteSupplier(c echo.Context) error {
	id := c.Param("id")

	err := h.service.Supplier().DeleteSupplier(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusNoContent, nil)
}

// RestoreSupplier restores a soft-deleted supplier
// @Summary Restore supplier
// @Description Restore a soft-deleted supplier
// @Tags Suppliers
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Supplier ID"
// @Success 200 {object} model.SupplierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers/{id}/restore [post]
func (h *Handler) RestoreSupplier(c echo.Context) error {
	id := c.Param("id")

	resp, err := h.service.Supplier().RestoreSupplier(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Supplier restored successfully",
		resp,
		http.StatusOK,
	))
}

// SearchSuppliers searches suppliers by name
// @Summary Search suppliers
// @Description Search suppliers by name
// @Tags Suppliers
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param q query string true "Search query"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.SupplierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers/search [get]
func (h *Handler) SearchSuppliers(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			"search query is required",
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

	resp, err := h.service.Supplier().SearchSuppliers(c.Request().Context(), query, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Suppliers searched successfully",
		resp,
		http.StatusOK,
	))
}
