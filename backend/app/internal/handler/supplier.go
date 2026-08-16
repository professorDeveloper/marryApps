package handler

import (
	"log"
	"net/http"
	"strconv"
	"strings"

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

// GetAllSuppliers retrieves all suppliers
// @Summary Get all suppliers
// @Description Retrieve all suppliers with pagination, optional search and sorting
// @Tags Suppliers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search by supplier name"
// @Param sort_by query string false "Sort by field" Enums(name,created_at) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.PaginatedSuppliersResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/suppliers [get]
func (h *Handler) GetAllSuppliers(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		l, err := strconv.ParseInt(limitStr, 10, 32)
		if err != nil || l <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid limit",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(l)
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		o, err := strconv.ParseInt(offsetStr, 10, 32)
		if err != nil || o < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(o)
	}

	filter := model.SupplierListFilter{
		Search:    strings.TrimSpace(c.QueryParam("search")),
		SortBy:    strings.TrimSpace(c.QueryParam("sort_by")),
		SortOrder: strings.TrimSpace(c.QueryParam("sort_order")),
	}

	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	allowedSortBy := map[string]bool{
		"name":       true,
		"created_at": true,
	}
	if !allowedSortBy[filter.SortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_by",
			"allowed values: name, created_at",
			http.StatusBadRequest,
		))
	}

	allowedSortOrder := map[string]bool{
		"asc":  true,
		"desc": true,
	}
	if !allowedSortOrder[filter.SortOrder] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	suppliers, total, err := h.service.Supplier().GetAllSuppliers(c.Request().Context(), filter, limit, offset)
	if err != nil {
		log.Printf("GetAllSuppliers failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"Failed to retrieve suppliers",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, suppliers, "suppliers"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Suppliers retrieved successfully",
			maps,
			int32(total),
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Suppliers retrieved successfully",
		suppliers,
		int32(total),
		limit,
		offset,
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
