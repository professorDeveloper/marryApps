package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateGoodDetail creates a new good detail
// @Summary Create good detail
// @Description Create a new good detail (ingredient or compound in a good)
// @Tags Good Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateGoodDetailRequest true "Create good detail request"
// @Success 201 {object} model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/good-details [post]
func (h *Handler) CreateGoodDetail(c echo.Context) error {
	var req model.CreateGoodDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().CreateGoodDetail(c.Request().Context(), req.GoodID, req.IngredientID, req.CompoundID, req.Measurement, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Good detail created successfully", resp, http.StatusCreated))
}

// GetGoodDetail retrieves a good detail by ID
// @Summary Get good detail
// @Description Get good detail by ID
// @Tags Good Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Success 200 {object} model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/good-details/{id} [get]
func (h *Handler) GetGoodDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().GetGoodDetailByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good detail retrieved successfully", resp, http.StatusOK))
}

// GetGoodDetailsByGood retrieves all details for a good
// @Summary Get good details by good ID
// @Description Get all good details for a specific good
// @Tags Good Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param good_id path string true "Good ID"
// @Success 200 {object} []model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/goods/{good_id}/details [get]
func (h *Handler) GetGoodDetailsByGood(c echo.Context) error {
	goodID := c.Param("good_id")
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("good_id is required", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().GetGoodDetailsByGood(c.Request().Context(), goodID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good details retrieved successfully", resp, http.StatusOK))
}

// GetGoodDetailsByIngredient retrieves all good details for an ingredient
// @Summary Get good details by ingredient ID
// @Description Get all good details using a specific ingredient with pagination
// @Tags Good Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param ingredient_id path string true "Ingredient ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/ingredients/{ingredient_id}/goods [get]
func (h *Handler) GetGoodDetailsByIngredient(c echo.Context) error {
	ingredientID := c.Param("ingredient_id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient_id is required", "see logs for details", http.StatusInternalServerError))
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

	resp, err := h.service.Goods().GetGoodDetailsByIngredient(c.Request().Context(), ingredientID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good details retrieved successfully", resp, http.StatusOK))
}

// GetGoodDetailsByCompound retrieves all good details for a compound
// @Summary Get good details by compound ID
// @Description Get all good details using a specific compound with pagination
// @Tags Good Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param compound_id path string true "Compound ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compounds/{compound_id}/goods [get]
func (h *Handler) GetGoodDetailsByCompound(c echo.Context) error {
	compoundID := c.Param("compound_id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("compound_id is required", "see logs for details", http.StatusInternalServerError))
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

	resp, err := h.service.Goods().GetGoodDetailsByCompound(c.Request().Context(), compoundID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good details retrieved successfully", resp, http.StatusOK))
}

// UpdateGoodDetail updates a good detail
// @Summary Update good detail
// @Description Update good detail
// @Tags Good Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Param request body model.UpdateGoodDetailRequest true "Update good detail request"
// @Success 200 {object} model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/good-details/{id} [put]
func (h *Handler) UpdateGoodDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	var req model.UpdateGoodDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().UpdateGoodDetail(c.Request().Context(), id, req.GoodID, req.IngredientID, req.CompoundID, req.Measurement, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good detail updated successfully", resp, http.StatusOK))
}

// UpdateGoodDetailQuantity updates good detail quantity
// @Summary Update good detail quantity
// @Description Update good detail quantity
// @Tags Good Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Param request body model.UpdateGoodDetailQuantityRequest true "Update quantity request"
// @Success 200 {object} model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/good-details/{id}/quantity [put]
func (h *Handler) UpdateGoodDetailQuantity(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	var req model.UpdateGoodDetailQuantityRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().UpdateGoodDetailQuantity(c.Request().Context(), id, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good detail quantity updated successfully", resp, http.StatusOK))
}

// DeleteGoodDetail deletes a good detail
// @Summary Delete good detail
// @Description Delete a good detail (soft delete)
// @Tags Good Details
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/good-details/{id} [delete]
func (h *Handler) DeleteGoodDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	if err := h.service.Goods().DeleteGoodDetail(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusNoContent, model.NewSuccessResponse("Good detail deleted successfully", map[string]interface{}{}, http.StatusNoContent))
}

// RestoreGoodDetail restores a deleted good detail
// @Summary Restore good detail
// @Description Restore a deleted good detail
// @Tags Good Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Success 200 {object} model.GoodDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/good-details/{id}/restore [post]
func (h *Handler) RestoreGoodDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusInternalServerError))
	}

	resp, err := h.service.Goods().RestoreGoodDetail(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Good detail restored successfully", resp, http.StatusOK))
}
