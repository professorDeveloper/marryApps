package handler

import (
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// CreateDeductionActGroup creates a new deduction act group
// @Summary Create deduction act group
// @Description Create a new deduction act group
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateDeductionActGroupRequest true "Deduction act group data"
// @Success 201 {object} model.DeductionActGroupResponse "Deduction act group created"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/group [post]
func (h *Handler) CreateDeductionActGroup(c echo.Context) error {
	var req model.CreateDeductionActGroupRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create deduction act group request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	group, err := h.service.Deduction().CreateDeductionActGroup(c.Request().Context(), &req)
	if err != nil {
		log.Printf("CreateDeductionActGroup failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create deduction act group", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Deduction act group created successfully", group, http.StatusCreated))
}

// GetAllDeductionActGroups retrieves all deduction act groups
// @Summary Get deduction act groups
// @Description Retrieve deduction act groups with pagination
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.DeductionActGroupResponse "Deduction act groups"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/group [get]
func (h *Handler) GetAllDeductionActGroups(c echo.Context) error {
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

	groups, err := h.service.Deduction().GetAllDeductionActGroups(c.Request().Context(), limit, offset)
	if err != nil {
		log.Printf("GetAllDeductionActGroups failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch deduction act groups", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", groups, http.StatusOK))
}

// GetDeductionActGroupByID retrieves a deduction act group by ID
// @Summary Get deduction act group by ID
// @Description Retrieve a specific deduction act group by its ID
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction Act Group ID"
// @Success 200 {object} model.DeductionActGroupResponse "Deduction act group details"
// @Failure 400 {object} model.ErrorResponse "Invalid ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/group/{id} [get]
func (h *Handler) GetDeductionActGroupByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	group, err := h.service.Deduction().GetDeductionActGroupByID(c.Request().Context(), id)
	if err != nil {
		log.Printf("GetDeductionActGroupByID failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch deduction act group", "see logs for details", http.StatusInternalServerError))
	}
	if group == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("deduction act group not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction act group retrieved successfully", group, http.StatusOK))
}

// UpdateDeductionActGroup updates a deduction act group
// @Summary Update deduction act group
// @Description Update an existing deduction act group's information
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction Act Group ID"
// @Param input body model.UpdateDeductionActGroupRequest true "Deduction act group update data"
// @Success 200 {object} model.DeductionActGroupResponse "Updated"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/group/{id} [put]
func (h *Handler) UpdateDeductionActGroup(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateDeductionActGroupRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update deduction act group request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	group, err := h.service.Deduction().UpdateDeductionActGroup(c.Request().Context(), id, &req)
	if err != nil {
		log.Printf("UpdateDeductionActGroup failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update deduction act group", "see logs for details", http.StatusInternalServerError))
	}
	if group == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("deduction act group not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction act group updated successfully", group, http.StatusOK))
}

// DeleteDeductionActGroup deletes a deduction act group
// @Summary Delete deduction act group
// @Description Soft delete a deduction act group
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction Act Group ID"
// @Success 200 {object} model.SuccessResponse "Deleted"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/group/{id} [delete]
func (h *Handler) DeleteDeductionActGroup(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Deduction().DeleteDeductionActGroup(c.Request().Context(), id); err != nil {
		log.Printf("DeleteDeductionActGroup failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete deduction act group", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction act group deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreDeductionActGroup restores a deleted deduction act group
// @Summary Restore deduction act group
// @Description Restore a previously deleted deduction act group
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction Act Group ID"
// @Success 200 {object} model.DeductionActGroupResponse "Restored"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/group/{id}/restore [post]
func (h *Handler) RestoreDeductionActGroup(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	group, err := h.service.Deduction().RestoreDeductionActGroup(c.Request().Context(), id)
	if err != nil {
		log.Printf("RestoreDeductionActGroup failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore deduction act group", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction act group restored successfully", group, http.StatusOK))
}

// CreateDeduction creates a new deduction
// @Summary Create deduction
// @Description Create a new deduction with items, expand into ingredient usage, subtract from stock and compute balance
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateDeductionRequest true "Deduction create data"
// @Success 201 {object} model.DeductionResponse "Created"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions [post]
func (h *Handler) CreateDeduction(c echo.Context) error {
	var req model.CreateDeductionRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind create deduction request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().CreateDeduction(c.Request().Context(), &req)
	if err != nil {
		log.Printf("CreateDeduction failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to create deduction", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Deduction created successfully", resp, http.StatusCreated))
}

// GetAllDeductions retrieves deductions with filtering and pagination
// @Summary Get deductions
// @Description Retrieve deductions with filters and pagination
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Param date_from query string false "Filter from date (YYYY-MM-DD)"
// @Param date_to query string false "Filter to date (YYYY-MM-DD)"
// @Param status query string false "Filter by status (draft, active)"
// @Param storage_id query string false "Filter by storage UUID"
// @Param act_group_id query string false "Filter by act group UUID"
// @Param ingredient_id query string false "Filter by ingredient UUID (matches deduction items)"
// @Param expand query string false "Comma-separated relations to expand (e.g. storage_id)"
// @Success 200 {object} model.PaginatedDeductionsResponse "Deductions"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions [get]
func (h *Handler) GetAllDeductions(c echo.Context) error {
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

	strPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}
	filter := model.DeductionFilter{
		DateFrom:     strPtr(c.QueryParam("date_from")),
		DateTo:       strPtr(c.QueryParam("date_to")),
		Status:       strPtr(c.QueryParam("status")),
		StorageID:    strPtr(c.QueryParam("storage_id")),
		ActGroupID:   strPtr(c.QueryParam("act_group_id")),
		IngredientID: strPtr(c.QueryParam("ingredient_id")),
	}

	paginated, err := h.service.Deduction().GetAllDeductions(c.Request().Context(), filter, limit, offset)
	if err != nil {
		log.Printf("GetAllDeductions failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch deductions", "see logs for details", http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, paginated.Data, "deductions"); expanded {
		if err != nil {
			log.Printf("expandListResponse failed: %v", err)
		} else {
			return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", map[string]interface{}{
				"data":       maps,
				"pagination": paginated.Pagination,
			}, http.StatusOK))
		}
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Data retrieved successfully", paginated, http.StatusOK))
}

// GetDeductionByID retrieves a deduction by ID
// @Summary Get deduction by ID
// @Description Retrieve a deduction with items and ingredient breakdown
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Param expand query string false "Comma-separated relations to expand (e.g. storage_id)"
// @Success 200 {object} model.DeductionResponse "Deduction"
// @Failure 400 {object} model.ErrorResponse "Invalid ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id} [get]
func (h *Handler) GetDeductionByID(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().GetDeductionByID(c.Request().Context(), id)
	if err != nil {
		log.Printf("GetDeductionByID failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to fetch deduction", "see logs for details", http.StatusInternalServerError))
	}
	if resp == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("deduction not found", "see logs for details", http.StatusNotFound))
	}

	if maps, expanded, err := h.expandListResponse(c, []*model.DeductionResponse{resp}, "deductions"); expanded {
		if err != nil {
			log.Printf("expandListResponse failed: %v", err)
		} else if len(maps) > 0 {
			return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction retrieved successfully", maps[0], http.StatusOK))
		}
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction retrieved successfully", resp, http.StatusOK))
}

// UpdateDeduction updates a deduction (metadata only)
// @Summary Update deduction
// @Description Update deduction fields (date, group, storage, descriptions, status). Items are not changed.
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Param input body model.UpdateDeductionRequest true "Deduction update data"
// @Success 200 {object} model.DeductionResponse "Updated"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id} [put]
func (h *Handler) UpdateDeduction(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	var req model.UpdateDeductionRequest
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind update deduction request: %v", err)
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().UpdateDeduction(c.Request().Context(), id, &req)
	if err != nil {
		log.Printf("UpdateDeduction failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update deduction", "see logs for details", http.StatusInternalServerError))
	}
	if resp == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("deduction not found", "see logs for details", http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction updated successfully", resp, http.StatusOK))
}

// DeleteDeduction deletes a deduction
// @Summary Delete deduction
// @Description Soft delete a deduction
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Success 200 {object} model.SuccessResponse "Deleted"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id} [delete]
func (h *Handler) DeleteDeduction(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	if err := h.service.Deduction().DeleteDeduction(c.Request().Context(), id); err != nil {
		log.Printf("DeleteDeduction failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete deduction", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// RestoreDeduction restores a deleted deduction
// @Summary Restore deduction
// @Description Restore a previously deleted deduction
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Success 200 {object} model.DeductionResponse "Restored"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id}/restore [post]
func (h *Handler) RestoreDeduction(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("id is required", "see logs for details", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid id format", "see logs for details", http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().RestoreDeduction(c.Request().Context(), id)
	if err != nil {
		log.Printf("RestoreDeduction failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to restore deduction", "see logs for details", http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction restored successfully", resp, http.StatusOK))
}

// UpsertDeductionItems replaces all items and optionally updates deduction fields in one call.
// Optionally pass date, act_group_id, storage_id, status, description to update the deduction itself.
// Status transitions (draft↔active) trigger stock apply/reverse automatically.
// @Summary Batch update deduction items
// @Description Full replace of deduction items. Optionally update deduction fields (date, status, storage_id, etc.) in the same call. Stock adjusted on status transition.
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Param input body model.UpsertDeductionItemsRequest true "Deduction items (required) + optional deduction fields"
// @Success 200 {object} model.DeductionResponse "Updated deduction with new items"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Deduction not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id}/items/batch [put]
func (h *Handler) UpsertDeductionItems(c echo.Context) error {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid deduction id", err.Error(), http.StatusBadRequest))
	}

	var req model.UpsertDeductionItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().UpsertDeductionItems(c.Request().Context(), id, &req)
	if err != nil {
		log.Printf("UpsertDeductionItems failed for id %s: %v", id, err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to update deduction items", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction items updated successfully", resp, http.StatusOK))
}

// DeleteDeductionItem removes a single deduction item and reverses its stock impact
// @Summary Delete deduction item
// @Description Removes a single item from a deduction and adds its deducted quantities back to stock
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Param itemId path string true "Deduction Item ID"
// @Success 200 {object} model.DeductionResponse "Updated deduction"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 404 {object} model.ErrorResponse "Not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id}/items/{itemId} [delete]
func (h *Handler) DeleteDeductionItem(c echo.Context) error {
	id := c.Param("id")
	itemId := c.Param("itemId")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid deduction id", err.Error(), http.StatusBadRequest))
	}
	if _, err := uuid.Parse(itemId); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid item id", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().DeleteDeductionItem(c.Request().Context(), id, itemId)
	if err != nil {
		log.Printf("DeleteDeductionItem failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete deduction item", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction item deleted successfully", resp, http.StatusOK))
}

// DeleteDeductionsBatch deletes multiple deductions at once
// @Summary Batch delete deductions
// @Description Soft-delete multiple deductions; if active, stock is reversed for each
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.DeleteDeductionsBatchRequest true "IDs to delete"
// @Success 200 {object} model.SuccessResponse "Deleted"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/batch [delete]
func (h *Handler) DeleteDeductionsBatch(c echo.Context) error {
	var req model.DeleteDeductionsBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	if err := h.service.Deduction().DeleteDeductionsBatch(c.Request().Context(), &req); err != nil {
		log.Printf("DeleteDeductionsBatch failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete deductions", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deductions deleted successfully", map[string]interface{}{}, http.StatusOK))
}

// DeleteDeductionItemsBatch deletes multiple items from a deduction at once
// @Summary Batch delete deduction items
// @Description Remove multiple items from a deduction; if active, stock is reversed for each
// @Tags deductions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Deduction ID"
// @Param input body model.DeleteDeductionItemsBatchRequest true "Item IDs to delete"
// @Success 200 {object} model.DeductionResponse "Updated deduction"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/deductions/{id}/items/batch [delete]
func (h *Handler) DeleteDeductionItemsBatch(c echo.Context) error {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid deduction id", err.Error(), http.StatusBadRequest))
	}

	var req model.DeleteDeductionItemsBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request format", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Deduction().DeleteDeductionItemsBatch(c.Request().Context(), id, &req)
	if err != nil {
		log.Printf("DeleteDeductionItemsBatch failed: %v", err)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete deduction items", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Deduction items deleted successfully", resp, http.StatusOK))
}
