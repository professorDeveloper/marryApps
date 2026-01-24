package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateIngredientGroup creates a new ingredient group
// @Summary Create a new ingredient group
// @Description Create a new ingredient group with name and optional translation
// @Tags ingredient-groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateIngredientGroupRequest true "Ingredient group creation data"
// @Success 201 {object} model.IngredientGroupResponse "Ingredient group created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups [post]
func (h *Handler) CreateIngredientGroup(c echo.Context) error {
	var req model.CreateIngredientGroupRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create ingredient group request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("name is required", "see logs for details", http.StatusBadRequest))
	}

	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid name_i18n UUID format", "see logs for details", http.StatusBadRequest))
		}
		nameI18nUUID = &id
	}

	group, err := h.service.Ingredient().CreateIngredientGroup(c.Request().Context(), *req.Name, nameI18nUUID, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("CreateIngredientGroup failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create ingredient group", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Ingredient group created successfully", group, http.StatusCreated))
}

// GetIngredientGroupByID retrieves an ingredient group by ID
// @Summary Get ingredient group by ID
// @Description Retrieve a specific ingredient group by its ID
// @Tags ingredient-groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Group ID"
// @Success 200 {object} model.IngredientGroupResponse "Ingredient group details"
// @Failure 400 {object} model.ErrorResponse "Invalid group ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient group not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups/{id} [get]
func (h *Handler) GetIngredientGroupByID(c echo.Context) error {
	groupID := c.Param("id")
	if groupID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("group id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(groupID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid group id format", "see logs for details", http.StatusBadRequest))
	}

	group, err := h.service.Ingredient().GetIngredientGroupByID(c.Request().Context(), groupID)
	if err != nil {
		log.Printf("GetIngredientGroupByID failed for id %s: %v", groupID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient group", "see logs for details", http.StatusInternalServerError))
	}
	if group == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient group not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient group retrieved successfully", group, http.StatusOK))
}

// GetAllIngredientGroups retrieves all ingredient groups
// @Summary Get all ingredient groups
// @Description Retrieve all ingredient groups with pagination
// @Tags ingredient-groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.IngredientGroupResponse "List of all ingredient groups"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups [get]
func (h *Handler) GetAllIngredientGroups(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	groups, err := h.service.Ingredient().GetAllIngredientGroups(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllIngredientGroups failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient groups", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", groups, http.StatusOK))
}

// UpdateIngredientGroup updates an existing ingredient group
// @Summary Update ingredient group
// @Description Update an existing ingredient group's information
// @Tags ingredient-groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Group ID"
// @Param input body model.UpdateIngredientGroupRequest true "Ingredient group update data"
// @Success 200 {object} model.IngredientGroupResponse "Ingredient group updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient group not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups/{id} [put]
func (h *Handler) UpdateIngredientGroup(c echo.Context) error {
	groupID := c.Param("id")
	if groupID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("group id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(groupID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid group id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateIngredientGroupRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update ingredient group request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	group, err := h.service.Ingredient().UpdateIngredientGroup(c.Request().Context(), groupID, req.Name, req.NameI18n, req.PictureUrl, req.ColorCode)
	if err != nil {
		log.Printf("UpdateIngredientGroup failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update ingredient group", "see logs for details", http.StatusInternalServerError))
	}
	if group == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient group not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient group updated successfully", group, http.StatusOK))
}

// DeleteIngredientGroup deletes an ingredient group
// @Summary Delete ingredient group
// @Description Soft delete an ingredient group (mark as deleted without removing from database)
// @Tags ingredient-groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Group ID"
// @Success 200 {object} model.SuccessResponse "Ingredient group deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid group ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups/{id} [delete]
func (h *Handler) DeleteIngredientGroup(c echo.Context) error {
	groupID := c.Param("id")
	if groupID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("group id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(groupID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid group id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Ingredient().DeleteIngredientGroup(c.Request().Context(), groupID); err != nil {
		log.Printf("DeleteIngredientGroup failed for id %s: %v", groupID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete ingredient group", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient group deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreIngredientGroup restores a deleted ingredient group
// @Summary Restore ingredient group
// @Description Restore a previously deleted ingredient group
// @Tags ingredient-groups
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Group ID"
// @Success 200 {object} model.SuccessResponse "Ingredient group restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid group ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups/{id}/restore [post]
func (h *Handler) RestoreIngredientGroup(c echo.Context) error {
	groupID := c.Param("id")
	if groupID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("group id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(groupID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid group id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Ingredient().RestoreIngredientGroup(c.Request().Context(), groupID); err != nil {
		log.Printf("RestoreIngredientGroup failed for id %s: %v", groupID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore ingredient group", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient group restored successfully", map[string]interface{}{}, http.StatusOK))
}

// ==================== INGREDIENTS ====================

// CreateIngredient creates a new ingredient
// @Summary Create a new ingredient
// @Description Create a new ingredient with name, group, measurement, and optional fields
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateIngredientRequest true "Ingredient creation data"
// @Success 201 {object} model.IngredientResponse "Ingredient created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients [post]
func (h *Handler) CreateIngredient(c echo.Context) error {
	var req model.CreateIngredientRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create ingredient request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	if req.Name == nil || *req.Name == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("name is required", "see logs for details", http.StatusBadRequest))
	}

	var nameI18nUUID *uuid.UUID
	if req.NameI18n != nil && *req.NameI18n != "" {
		id, err := uuid.Parse(*req.NameI18n)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid name_i18n UUID format", "see logs for details", http.StatusBadRequest))
		}
		nameI18nUUID = &id
	}

	ingredient, err := h.service.Ingredient().CreateIngredient(c.Request().Context(), *req.Name, nameI18nUUID, req.GroupID, req.Measurement, req.PictureUrl, req.BrandID, req.ColorCode)
	if err != nil {
		log.Printf("CreateIngredient failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create ingredient", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Ingredient created successfully", ingredient, http.StatusCreated))
}

// GetIngredientByID retrieves an ingredient by ID
// @Summary Get ingredient by ID
// @Description Retrieve a specific ingredient by its ID
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient ID"
// @Success 200 {object} model.IngredientResponse "Ingredient details"
// @Failure 400 {object} model.ErrorResponse "Invalid ingredient ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients/{id} [get]
func (h *Handler) GetIngredientByID(c echo.Context) error {
	ingredientID := c.Param("id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid ingredient id format", "see logs for details", http.StatusBadRequest))
	}

	ingredient, err := h.service.Ingredient().GetIngredientByID(c.Request().Context(), ingredientID)
	if err != nil {
		log.Printf("GetIngredientByID failed for id %s: %v", ingredientID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient", "see logs for details", http.StatusInternalServerError))
	}
	if ingredient == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient retrieved successfully", ingredient, http.StatusOK))
}

// GetAllIngredients retrieves all ingredients
// @Summary Get all ingredients
// @Description Retrieve all ingredients with pagination
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.IngredientResponse "List of all ingredients"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients [get]
func (h *Handler) GetAllIngredients(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	ingredients, err := h.service.Ingredient().GetAllIngredients(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllIngredients failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredients", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", ingredients, http.StatusOK))
}

// GetIngredientsByGroupID retrieves ingredients by group ID
// @Summary Get ingredients by group ID
// @Description Retrieve all ingredients belonging to a specific group
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param groupId path string true "Ingredient Group ID"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.IngredientResponse "List of ingredients in the group"
// @Failure 400 {object} model.ErrorResponse "Invalid group ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-groups/{groupId}/ingredients [get]
func (h *Handler) GetIngredientsByGroupID(c echo.Context) error {
	groupID := c.Param("groupId")
	if groupID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("group_id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(groupID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid group_id format", "see logs for details", http.StatusBadRequest))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	ingredients, err := h.service.Ingredient().GetIngredientsByGroupID(c.Request().Context(), groupID, limit, offset)
	if err != nil {
		log.Printf("GetIngredientsByGroupID failed for group_id %s: %v", groupID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredients", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", ingredients, http.StatusOK))
}

// UpdateIngredient updates an existing ingredient
// @Summary Update ingredient
// @Description Update an existing ingredient's information
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient ID"
// @Param input body model.UpdateIngredientRequest true "Ingredient update data"
// @Success 200 {object} model.IngredientResponse "Ingredient updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients/{id} [put]
func (h *Handler) UpdateIngredient(c echo.Context) error {
	ingredientID := c.Param("id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid ingredient id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateIngredientRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update ingredient request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	ingredient, err := h.service.Ingredient().UpdateIngredient(c.Request().Context(), ingredientID, req.Name, req.NameI18n, req.GroupID, req.Measurement, req.PictureUrl, req.BrandID, req.ColorCode, req.PricePerUnit, req.Quantity)
	if err != nil {
		log.Printf("UpdateIngredient failed for id %s: %v", ingredientID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update ingredient", "see logs for details", http.StatusInternalServerError))
	}
	if ingredient == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient updated successfully", ingredient, http.StatusOK))
}

// DeleteIngredient deletes an ingredient
// @Summary Delete ingredient
// @Description Soft delete an ingredient (mark as deleted without removing from database)
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient ID"
// @Success 200 {object} model.SuccessResponse "Ingredient deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ingredient ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients/{id} [delete]
func (h *Handler) DeleteIngredient(c echo.Context) error {
	ingredientID := c.Param("id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid ingredient id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Ingredient().DeleteIngredient(c.Request().Context(), ingredientID); err != nil {
		log.Printf("DeleteIngredient failed for id %s: %v", ingredientID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete ingredient", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreIngredient restores a deleted ingredient
// @Summary Restore ingredient
// @Description Restore a previously deleted ingredient
// @Tags ingredients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient ID"
// @Success 200 {object} model.SuccessResponse "Ingredient restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid ingredient ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients/{id}/restore [post]
func (h *Handler) RestoreIngredient(c echo.Context) error {
	ingredientID := c.Param("id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid ingredient id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Ingredient().RestoreIngredient(c.Request().Context(), ingredientID); err != nil {
		log.Printf("RestoreIngredient failed for id %s: %v", ingredientID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore ingredient", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient restored successfully", map[string]interface{}{}, http.StatusOK))
}

// ==================== INGREDIENT STOCK ====================

// CreateIngredientStock creates a new ingredient stock record
// @Summary Create ingredient stock
// @Description Create a new stock record for an ingredient at a specific branch
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateIngredientStockRequest true "Ingredient stock creation data"
// @Success 201 {object} model.IngredientStockResponse "Ingredient stock created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock [post]
func (h *Handler) CreateIngredientStock(c echo.Context) error {
	var req model.CreateIngredientStockRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create ingredient stock request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	if req.IngredientID == nil || *req.IngredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient_id is required", "see logs for details", http.StatusBadRequest))
	}
	if req.BranchID == nil || *req.BranchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch_id is required", "see logs for details", http.StatusBadRequest))
	}
	if req.Quantity == nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("quantity is required", "see logs for details", http.StatusBadRequest))
	}

	stock, err := h.service.Ingredient().CreateIngredientStock(c.Request().Context(), *req.IngredientID, *req.Quantity, *req.BranchID)
	if err != nil {
		log.Printf("CreateIngredientStock failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Ingredient stock created successfully", stock, http.StatusCreated))
}

// GetIngredientStockByID retrieves ingredient stock by ID
// @Summary Get ingredient stock by ID
// @Description Retrieve a specific ingredient stock record by its ID
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Stock ID"
// @Success 200 {object} model.IngredientStockResponse "Ingredient stock details"
// @Failure 400 {object} model.ErrorResponse "Invalid stock ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient stock not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/{id} [get]
func (h *Handler) GetIngredientStockByID(c echo.Context) error {
	stockID := c.Param("id")
	if stockID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("stock id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(stockID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid stock id format", "see logs for details", http.StatusBadRequest))
	}

	stock, err := h.service.Ingredient().GetIngredientStockByID(c.Request().Context(), stockID)
	if err != nil {
		log.Printf("GetIngredientStockByID failed for id %s: %v", stockID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient stock", "see logs for details", http.StatusInternalServerError))
	}
	if stock == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient stock not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient stock retrieved successfully", stock, http.StatusOK))
}

// GetStockByIngredientAndBranch retrieves stock by ingredient and branch
// @Summary Get stock by ingredient and branch
// @Description Retrieve stock information for a specific ingredient at a specific branch
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param ingredient_id query string true "Ingredient ID"
// @Param branch_id query string true "Branch ID"
// @Success 200 {object} model.IngredientStockResponse "Ingredient stock details"
// @Failure 400 {object} model.ErrorResponse "Invalid parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient stock not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/search [get]
func (h *Handler) GetStockByIngredientAndBranch(c echo.Context) error {
	ingredientID := c.QueryParam("ingredient_id")
	branchID := c.QueryParam("branch_id")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient_id is required", "see logs for details", http.StatusBadRequest))
	}
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch_id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid ingredient_id format", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch_id format", "see logs for details", http.StatusBadRequest))
	}

	stock, err := h.service.Ingredient().GetStockByIngredientAndBranch(c.Request().Context(), ingredientID, branchID)
	if err != nil {
		log.Printf("GetStockByIngredientAndBranch failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient stock", "see logs for details", http.StatusInternalServerError))
	}
	if stock == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient stock not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient stock retrieved successfully", stock, http.StatusOK))
}

// GetAllIngredientStock retrieves all ingredient stock
// @Summary Get all ingredient stock
// @Description Retrieve all ingredient stock records with pagination
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.IngredientStockResponse "List of all ingredient stock"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock [get]
func (h *Handler) GetAllIngredientStock(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	stocks, err := h.service.Ingredient().GetAllIngredientStock(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllIngredientStock failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", stocks, http.StatusOK))
}

// GetStockByBranchID retrieves stock by branch ID
// @Summary Get stock by branch ID
// @Description Retrieve all ingredient stock for a specific branch
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param branchId path string true "Branch ID"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.IngredientStockResponse "List of ingredient stock for the branch"
// @Failure 400 {object} model.ErrorResponse "Invalid branch ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/branches/{branchId}/ingredient-stock [get]
func (h *Handler) GetStockByBranchID(c echo.Context) error {
	branchID := c.Param("branchId")
	if branchID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("branch_id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(branchID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid branch_id format", "see logs for details", http.StatusBadRequest))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	stocks, err := h.service.Ingredient().GetStockByBranchID(c.Request().Context(), branchID, limit, offset)
	if err != nil {
		log.Printf("GetStockByBranchID failed for branch_id %s: %v", branchID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", stocks, http.StatusOK))
}

// GetStockByIngredientID retrieves stock by ingredient ID
// @Summary Get stock by ingredient ID
// @Description Retrieve stock for a specific ingredient across all branches
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param ingredientId path string true "Ingredient ID"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.IngredientStockResponse "List of stock for the ingredient"
// @Failure 400 {object} model.ErrorResponse "Invalid ingredient ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredients/{ingredientId}/stock [get]
func (h *Handler) GetStockByIngredientID(c echo.Context) error {
	ingredientID := c.Param("ingredientId")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("ingredient_id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid ingredient_id format", "see logs for details", http.StatusBadRequest))
	}

	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := int32(20)
	offset := int32(0)

	if limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 32); err == nil && l > 0 {
			limit = int32(l)
		}
	}
	if offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 32); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	stocks, err := h.service.Ingredient().GetStockByIngredientID(c.Request().Context(), ingredientID, limit, offset)
	if err != nil {
		log.Printf("GetStockByIngredientID failed for ingredient_id %s: %v", ingredientID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", stocks, http.StatusOK))
}

// UpdateIngredientStock updates ingredient stock quantity
// @Summary Update ingredient stock
// @Description Update the quantity of an ingredient stock record
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Stock ID"
// @Param input body model.UpdateIngredientStockRequest true "Stock update data"
// @Success 200 {object} model.IngredientStockResponse "Ingredient stock updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Ingredient stock not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/{id} [put]
func (h *Handler) UpdateIngredientStock(c echo.Context) error {
	stockID := c.Param("id")
	if stockID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("stock id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(stockID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid stock id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateIngredientStockRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update ingredient stock request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}
	if req.Quantity == nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("quantity is required", "see logs for details", http.StatusBadRequest))
	}

	stock, err := h.service.Ingredient().UpdateIngredientStock(c.Request().Context(), stockID, *req.Quantity)
	if err != nil {
		log.Printf("UpdateIngredientStock failed for id %s: %v", stockID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update ingredient stock", "see logs for details", http.StatusInternalServerError))
	}
	if stock == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("ingredient stock not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient stock updated successfully", stock, http.StatusOK))
}

type stockAdjustRequest struct {
	Quantity *int64 `json:"quantity"`
}

// AddToIngredientStock adds quantity to ingredient stock
// @Summary Add to ingredient stock
// @Description Add a specified quantity to an existing ingredient stock
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Stock ID"
// @Param input body stockAdjustRequest true "Quantity to add"
// @Success 200 {object} model.IngredientStockResponse "Quantity added successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/{id}/add [post]
func (h *Handler) AddToIngredientStock(c echo.Context) error {
	stockID := c.Param("id")
	if stockID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("stock id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(stockID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid stock id format", "see logs for details", http.StatusBadRequest))
	}

	var req stockAdjustRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind add-to-stock request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}
	if req.Quantity == nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("quantity is required", "see logs for details", http.StatusBadRequest))
	}

	stock, err := h.service.Ingredient().AddToIngredientStock(c.Request().Context(), stockID, *req.Quantity)
	if err != nil {
		log.Printf("AddToIngredientStock failed for id %s: %v", stockID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to add to ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Quantity added to ingredient stock successfully", stock, http.StatusOK))
}

// RemoveFromIngredientStock removes quantity from ingredient stock
// @Summary Remove from ingredient stock
// @Description Remove a specified quantity from an existing ingredient stock
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Stock ID"
// @Param input body stockAdjustRequest true "Quantity to remove"
// @Success 200 {object} model.IngredientStockResponse "Quantity removed successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/{id}/remove [post]
func (h *Handler) RemoveFromIngredientStock(c echo.Context) error {
	stockID := c.Param("id")
	if stockID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("stock id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(stockID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid stock id format", "see logs for details", http.StatusBadRequest))
	}

	var req stockAdjustRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind remove-from-stock request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}
	if req.Quantity == nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("quantity is required", "see logs for details", http.StatusBadRequest))
	}

	stock, err := h.service.Ingredient().RemoveFromIngredientStock(c.Request().Context(), stockID, *req.Quantity)
	if err != nil {
		log.Printf("RemoveFromIngredientStock failed for id %s: %v", stockID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to remove from ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Quantity removed from ingredient stock successfully", stock, http.StatusOK))
}

// DeleteIngredientStock deletes ingredient stock
// @Summary Delete ingredient stock
// @Description Soft delete an ingredient stock record (mark as deleted without removing from database)
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Stock ID"
// @Success 200 {object} model.SuccessResponse "Ingredient stock deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid stock ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/{id} [delete]
func (h *Handler) DeleteIngredientStock(c echo.Context) error {
	stockID := c.Param("id")
	if stockID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("stock id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(stockID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid stock id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Ingredient().DeleteIngredientStock(c.Request().Context(), stockID); err != nil {
		log.Printf("DeleteIngredientStock failed for id %s: %v", stockID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient stock deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreIngredientStock restores a deleted ingredient stock
// @Summary Restore ingredient stock
// @Description Restore a previously deleted ingredient stock record
// @Tags ingredient-stock
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Ingredient Stock ID"
// @Success 200 {object} model.SuccessResponse "Ingredient stock restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid stock ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-stock/{id}/restore [post]
func (h *Handler) RestoreIngredientStock(c echo.Context) error {
	stockID := c.Param("id")
	if stockID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("stock id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(stockID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid stock id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Ingredient().RestoreIngredientStock(c.Request().Context(), stockID); err != nil {
		log.Printf("RestoreIngredientStock failed for id %s: %v", stockID, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore ingredient stock", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient stock restored successfully", map[string]interface{}{}, http.StatusOK))
}
