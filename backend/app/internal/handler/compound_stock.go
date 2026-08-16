package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCompoundStock creates a new compound stock entry
// @Summary Create compound stock
// @Description Create a new compound stock entry for a branch
// @Tags Compound Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateCompoundStockRequest true "Create compound stock request"
// @Success 201 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock [post]
func (h *Handler) CreateCompoundStock(c echo.Context) error {
	var req model.CreateCompoundStockRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().CreateCompoundStock(c.Request().Context(), req.CompoundID, req.BranchID, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Compound stock created successfully",
		resp,
		http.StatusCreated,
	))
}

// GetCompoundStock retrieves compound stock by ID
// @Summary Get compound stock
// @Description Get compound stock by ID
// @Tags Compound Stock
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Stock ID"
// @Success 200 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/{id} [get]
func (h *Handler) GetCompoundStock(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().GetCompoundStockByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetCompoundStockByBranchAndCompound retrieves stock for a specific compound and branch
// @Summary Get compound stock by compound and branch
// @Description Get compound stock for a specific compound in a specific branch
// @Tags Compound Stock
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param compound_id query string true "Compound ID"
// @Param branch_id query string true "Branch ID"
// @Success 200 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/search [get]
func (h *Handler) GetCompoundStockByBranchAndCompound(c echo.Context) error {
	compoundID := c.QueryParam("compound_id")
	branchID := c.QueryParam("branch_id")

	if compoundID == "" || branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"compound_id and branch_id are required",
			"missing query parameters: compound_id, branch_id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().GetStockByCompoundAndBranch(c.Request().Context(), compoundID, branchID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"Operation failed",
			err.Error(),
			http.StatusNotFound,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetAllCompoundStock retrieves all compound stocks with pagination
// @Summary Get all compound stock
// @Description Get all compound stocks with pagination
// @Tags Compound Stock
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock [get]
func (h *Handler) GetAllCompoundStock(c echo.Context) error {
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

	resp, err := h.service.Compound().GetAllCompoundStock(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetCompoundStockByBranch retrieves all compound stocks for a branch
// @Summary Get compound stock by branch
// @Description Get all compound stocks for a specific branch with pagination
// @Tags Compound Stock
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param branch_id path string true "Branch ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/branches/{branch_id}/compound-stock [get]
func (h *Handler) GetCompoundStockByBranch(c echo.Context) error {
	branchID := c.Param("branch_id")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"branch_id is required",
			"missing path parameter: branch_id",
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

	resp, err := h.service.Compound().GetCompoundStockByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetCompoundStockByCompound retrieves all stock entries for a compound
// @Summary Get compound stock by compound
// @Description Get all stock entries for a specific compound across all branches with pagination
// @Tags Compound Stock
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param compound_id path string true "Compound ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compounds/{compound_id}/stock [get]
func (h *Handler) GetCompoundStockByCompound(c echo.Context) error {
	compoundID := c.Param("compound_id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"compound_id is required",
			"missing path parameter: compound_id",
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

	resp, err := h.service.Compound().GetCompoundStockByCompoundID(c.Request().Context(), compoundID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateCompoundStock updates compound stock quantity
// @Summary Update compound stock
// @Description Update compound stock quantity
// @Tags Compound Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Stock ID"
// @Param request body model.UpdateCompoundStockRequest true "Update compound stock request"
// @Success 200 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/{id} [put]
func (h *Handler) UpdateCompoundStock(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateCompoundStockRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Quantity == nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"quantity is required",
			"missing required field: quantity",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().UpdateCompoundStock(c.Request().Context(), id, *req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock updated successfully",
		resp,
		http.StatusOK,
	))
}

// AddToCompoundStock adds quantity to compound stock
// @Summary Add to compound stock
// @Description Add quantity to compound stock
// @Tags Compound Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Stock ID"
// @Param request body model.AddToCompoundStockRequest true "Add to compound stock request"
// @Success 200 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/{id}/add [post]
func (h *Handler) AddToCompoundStock(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.AddToCompoundStockRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().AddToCompoundStock(c.Request().Context(), id, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock updated successfully",
		resp,
		http.StatusOK,
	))
}

// RemoveFromCompoundStock removes quantity from compound stock
// @Summary Remove from compound stock
// @Description Remove quantity from compound stock
// @Tags Compound Stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Stock ID"
// @Param request body model.RemoveFromCompoundStockRequest true "Remove from compound stock request"
// @Success 200 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/{id}/remove [post]
func (h *Handler) RemoveFromCompoundStock(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.RemoveFromCompoundStockRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().RemoveFromCompoundStock(c.Request().Context(), id, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteCompoundStock deletes compound stock
// @Summary Delete compound stock
// @Description Delete compound stock (soft delete)
// @Tags Compound Stock
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Stock ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/{id} [delete]
func (h *Handler) DeleteCompoundStock(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Compound().DeleteCompoundStock(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreCompoundStock restores deleted compound stock
// @Summary Restore compound stock
// @Description Restore deleted compound stock
// @Tags Compound Stock
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Stock ID"
// @Success 200 {object} model.CompoundStockResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-stock/{id}/restore [post]
func (h *Handler) RestoreCompoundStock(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Compound().RestoreCompoundStock(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Compound stock restored successfully",
		resp,
		http.StatusOK,
	))
}
