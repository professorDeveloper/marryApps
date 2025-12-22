package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateCompoundDetail creates a new compound detail
// @Summary Create compound detail
// @Description Create a new compound detail (ingredient in a compound)
// @Tags Compound Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param request body model.CreateCompoundDetailRequest true "Create compound detail request"
// @Success 201 {object} model.CompoundDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-details [post]
func (h *Handler) CreateCompoundDetail(c echo.Context) error {
	var req model.CreateCompoundDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	resp, err := h.service.Compound().CreateCompoundDetail(c.Request().Context(), req.CompoundID, req.IngredientID, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, resp)
}

// GetCompoundDetail retrieves a compound detail by ID
// @Summary Get compound detail
// @Description Get compound detail by ID
// @Tags Compound Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Success 200 {object} model.CompoundDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-details/{id} [get]
func (h *Handler) GetCompoundDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	resp, err := h.service.Compound().GetCompoundDetailByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

// GetCompoundDetailsByCompound retrieves all details for a compound
// @Summary Get compound details by compound ID
// @Description Get all compound details for a specific compound
// @Tags Compound Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param compound_id path string true "Compound ID"
// @Success 200 {object} []model.CompoundDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compounds/{compound_id}/details [get]
func (h *Handler) GetCompoundDetailsByCompound(c echo.Context) error {
	compoundID := c.Param("compound_id")
	if compoundID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "compound_id is required"})
	}

	resp, err := h.service.Compound().GetCompoundDetailsByCompoundID(c.Request().Context(), compoundID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

// GetCompoundDetailsByIngredient retrieves all compound details for an ingredient
// @Summary Get compound details by ingredient ID
// @Description Get all compound details using a specific ingredient with pagination
// @Tags Compound Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param ingredient_id path string true "Ingredient ID"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} []model.CompoundDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/ingredients/{ingredient_id}/compounds [get]
func (h *Handler) GetCompoundDetailsByIngredient(c echo.Context) error {
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

	resp, err := h.service.Compound().GetCompoundDetailsByIngredientID(c.Request().Context(), ingredientID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

// UpdateCompoundDetail updates a compound detail
// @Summary Update compound detail
// @Description Update compound detail quantity
// @Tags Compound Details
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Param request body model.UpdateCompoundDetailRequest true "Update compound detail request"
// @Success 200 {object} model.CompoundDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-details/{id} [put]
func (h *Handler) UpdateCompoundDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	var req model.UpdateCompoundDetailRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	resp, err := h.service.Compound().UpdateCompoundDetail(c.Request().Context(), id, req.CompoundID, req.IngredientID, req.Quantity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}

// DeleteCompoundDetail deletes a compound detail
// @Summary Delete compound detail
// @Description Delete a compound detail (soft delete)
// @Tags Compound Details
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-details/{id} [delete]
func (h *Handler) DeleteCompoundDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	if err := h.service.Compound().DeleteCompoundDetail(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.NoContent(http.StatusNoContent)
}

// RestoreCompoundDetail restores a deleted compound detail
// @Summary Restore compound detail
// @Description Restore a deleted compound detail
// @Tags Compound Details
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Detail ID"
// @Success 200 {object} model.CompoundDetailResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/compound-details/{id}/restore [post]
func (h *Handler) RestoreCompoundDetail(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "id is required"})
	}

	resp, err := h.service.Compound().RestoreCompoundDetail(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, resp)
}
