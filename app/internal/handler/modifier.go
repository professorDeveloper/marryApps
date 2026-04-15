package handler

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// GetModifierByID retrieves a modifier by ID
// @Summary Get modifier by ID
// @Description Retrieve a modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Success 200 {object} model.ModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id} [get]
func (h *Handler) GetModifierByID(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Modifier().GetModifierByID(c.Request().Context(), modifierID)
	if err != nil {
		log.Printf("GetModifierByID failed for ID %s: %v", modifierID, err)
		return respondDomainError(c, "Failed to retrieve modifier", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// GetAllModifiers retrieves modifiers with optional search and pagination
// @Summary Get modifiers
// @Description Retrieve modifiers with optional search by name, description, or code
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string false "Search query"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.PaginatedModifiersResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers [get]
func (h *Handler) GetAllModifiers(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0
	query := strings.TrimSpace(c.QueryParam("q"))

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	resp, total64, err := h.service.Modifier().GetModifiers(c.Request().Context(), query, limit, offset)
	if err != nil {
		log.Printf("GetAllModifiers failed. query=%q: %v", query, err)
		return respondDomainError(c, "Failed to retrieve modifiers", err)
	}

	total := int32(total64)

	if maps, expanded, err := h.expandListResponse(c, resp, "modifiers"); expanded {
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"expand failed",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
		return c.JSON(http.StatusOK, model.NewPaginatedResponse(
			"Modifiers retrieved successfully",
			maps,
			total,
			limit,
			offset,
			http.StatusOK,
		))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Modifiers retrieved successfully",
		resp,
		total,
		limit,
		offset,
		http.StatusOK,
	))
}

// UpdateModifier updates a modifier by ID
// @Summary Update modifier
// @Description Update a modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Param request body model.UpdateModifierRequest true "Modifier update request"
// @Success 200 {object} model.ModifierResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id} [put]
func (h *Handler) UpdateModifier(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	var req model.UpdateModifierRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update modifier request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if req.Name != nil && strings.TrimSpace(*req.Name) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier name cannot be empty",
			"name field cannot be empty",
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Modifier().UpdateModifier(c.Request().Context(), modifierID, req)
	if err != nil {
		log.Printf("UpdateModifier failed for ID %s: %v", modifierID, err)
		return respondDomainError(c, "Failed to update modifier", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteModifier soft deletes a modifier by ID
// @Summary Delete modifier
// @Description Soft delete a modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id} [delete]
func (h *Handler) DeleteModifier(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Modifier().DeleteModifier(c.Request().Context(), modifierID); err != nil {
		log.Printf("DeleteModifier failed for ID %s: %v", modifierID, err)
		return respondDomainError(c, "Failed to delete modifier", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier deleted successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// RestoreModifier restores a soft deleted modifier by ID
// @Summary Restore modifier
// @Description Restore a soft deleted modifier by ID
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Modifier ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/{id}/restore [post]
func (h *Handler) RestoreModifier(c echo.Context) error {
	modifierID := c.Param("id")
	if strings.TrimSpace(modifierID) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier ID is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}

	if err := h.service.Modifier().RestoreModifier(c.Request().Context(), modifierID); err != nil {
		log.Printf("RestoreModifier failed for ID %s: %v", modifierID, err)
		return respondDomainError(c, "Failed to restore modifier", err)
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Modifier restored successfully",
		map[string]interface{}{},
		http.StatusOK,
	))
}

// CreateModifierWithCalculations creates a modifier with calculations in one save
// @Summary Create modifier with calculations
// @Description Create a new modifier and its ingredient/compound calculations in one atomic transaction.
// @Tags modifiers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.CreateModifierWithCalculationsRequest true "Modifier + calculations"
// @Success 201 {object} model.SuccessResponse{data=model.ModifierWithCalculationsResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/modifiers/with-calculations [post]
func (h *Handler) CreateModifierWithCalculations(c echo.Context) error {
	var req model.CreateModifierWithCalculationsRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create modifier with calculations request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid request format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	if strings.TrimSpace(req.Modifier.Name) == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Modifier name is required",
			"missing required field: modifier.name",
			http.StatusBadRequest,
		))
	}

	for i, calc := range req.IngredientCalculations {
		if strings.TrimSpace(calc.IngredientID) == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: ingredient_id is required",
				http.StatusBadRequest,
			))
		}
		if strings.TrimSpace(calc.Quantity) == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	for i, calc := range req.CompoundCalculations {
		if strings.TrimSpace(calc.CompoundID) == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: compound_id is required",
				http.StatusBadRequest,
			))
		}
		if strings.TrimSpace(calc.Quantity) == "" {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: quantity is required",
				http.StatusBadRequest,
			))
		}
	}

	ctx := c.Request().Context()

	modifierResp, err := h.service.Modifier().CreateModifier(ctx, req.Modifier)
	if err != nil {
		log.Printf("CreateModifierWithCalculations: failed to create modifier: %v", err)
		return respondDomainError(c, "Failed to create modifier", err)
	}

	calculations := make([]model.ModifierCalculationResponse, 0, len(req.IngredientCalculations)+len(req.CompoundCalculations))

	for i, calc := range req.IngredientCalculations {
		row, calcErr := h.service.Calculation().CreateModifierCalculationForIngredient(
			ctx,
			modifierResp.ID,
			calc.IngredientID,
			calc.Quantity,
		)
		if calcErr != nil {
			log.Printf("CreateModifierWithCalculations: failed to create ingredient calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create ingredient calculation",
				"ingredient_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if row != nil {
			calculations = append(calculations, *row)
		}
	}

	for i, calc := range req.CompoundCalculations {
		row, calcErr := h.service.Calculation().CreateModifierCalculationForCompound(
			ctx,
			modifierResp.ID,
			calc.CompoundID,
			calc.Quantity,
		)
		if calcErr != nil {
			log.Printf("CreateModifierWithCalculations: failed to create compound calculation[%d]: %v", i, calcErr)
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"Failed to create compound calculation",
				"compound_calculations["+strconv.Itoa(i)+"]: "+calcErr.Error(),
				http.StatusInternalServerError,
			))
		}
		if row != nil {
			calculations = append(calculations, *row)
		}
	}

	totalCost, err := h.service.Calculation().GetTotalCostByModifierID(ctx, modifierResp.ID)
	if err != nil {
		log.Printf("CreateModifierWithCalculations: failed to get total cost: %v", err)
		totalCost = "0"
	}

	response := model.ModifierWithCalculationsResponse{
		Modifier:     modifierResp,
		Calculations: calculations,
		TotalCost:    totalCost,
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Modifier created successfully",
		response,
		http.StatusCreated,
	))
}
