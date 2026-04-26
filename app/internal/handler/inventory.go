package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/service"
)

// CreateInventory creates a new inventory
// @Summary Create a new inventory
// @Description Create a new inventory with date, storage_id, optional description fields and status
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateInventoryRequest true "Inventory creation data"
// @Success 201 {object} model.InventoryResponse "Inventory created successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories [post]
func (h *Handler) CreateInventory(c echo.Context) error {
	var req model.CreateInventoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Inventory().CreateInventory(c.Request().Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "invalid counted_at") || strings.Contains(err.Error(), "invalid date") {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request data", err.Error(), http.StatusBadRequest))
		}
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Inventory created successfully",
		resp,
		http.StatusCreated,
	))
}

// CreateInventoryBatch creates an inventory with items in one request
// @Summary Create inventory with items
// @Description Creates an inventory and upserts its items in a single request
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateInventoryBatchRequest true "Inventory batch creation data"
// @Success 201 {object} model.CreateInventoryBatchResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/inventories/batch [post]
func (h *Handler) CreateInventoryBatch(c echo.Context) error {
	var req model.CreateInventoryBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.Inventory().CreateInventoryBatch(c.Request().Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "invalid counted_at") || strings.Contains(err.Error(), "invalid date") {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request data", err.Error(), http.StatusBadRequest))
		}
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Inventory created successfully", resp, http.StatusCreated))
}

// GetAllInventories retrieves inventories with pagination
// @Summary Get inventories
// @Description Retrieve inventories with pagination, filters, search and sorting
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param date_from query string false "Start date (YYYY-MM-DD)"
// @Param date_to query string false "End date (YYYY-MM-DD)"
// @Param storage_id query string false "Storage ID"
// @Param ingredient_id query string false "Ingredient ID"
// @Param status query string false "Inventory status (draft, active, deleted)"
// @Param search query string false "Search by description or number"
// @Param sort_by query string false "Sort by field" Enums(date,number,created_at) default(date)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Param expand query string false "Comma-separated relations to expand (e.g. storage_id)"
// @Success 200 {object} model.PaginatedInventoriesResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/inventories [get]
func (h *Handler) GetAllInventories(c echo.Context) error {
	limit := int32(20)
	if l := c.QueryParam("limit"); l != "" {
		val, err := strconv.Atoi(l)
		if err != nil || val <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid request",
				"limit must be a positive integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(val)
	}

	offset := int32(0)
	if o := c.QueryParam("offset"); o != "" {
		val, err := strconv.Atoi(o)
		if err != nil || val < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid request",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(val)
	}

	dateFrom, err := parseDateParam(c.QueryParam("date_from"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	dateTo, err := parseDateParam(c.QueryParam("date_to"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}

	var storageID *string
	if v := strings.TrimSpace(c.QueryParam("storage_id")); v != "" {
		storageID = &v
	}
	var ingredientID *string
	if v := strings.TrimSpace(c.QueryParam("ingredient_id")); v != "" {
		ingredientID = &v
	}
	var status *string
	if v := strings.TrimSpace(c.QueryParam("status")); v != "" {
		status = &v
	}

	search := strings.TrimSpace(c.QueryParam("search"))
	sortBy := strings.TrimSpace(c.QueryParam("sort_by"))
	sortOrder := strings.TrimSpace(c.QueryParam("sort_order"))

	if sortBy == "" {
		sortBy = "date"
	}
	if sortOrder == "" {
		sortOrder = "desc"
	}

	allowedSortBy := map[string]bool{
		"date":       true,
		"number":     true,
		"created_at": true,
	}
	if !allowedSortBy[sortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			"sort_by must be one of: date, number, created_at",
			http.StatusBadRequest,
		))
	}

	allowedSortOrder := map[string]bool{
		"asc":  true,
		"desc": true,
	}
	if !allowedSortOrder[sortOrder] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			"sort_order must be one of: asc, desc",
			http.StatusBadRequest,
		))
	}

	paginated, err := h.service.Inventory().GetInventoriesFiltered(
		c.Request().Context(),
		dateFrom,
		dateTo,
		storageID,
		ingredientID,
		status,
		search,
		sortBy,
		sortOrder,
		limit,
		offset,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, paginated.Data, "inventories"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, map[string]any{
			"status":     "success",
			"message":    "Inventories retrieved successfully",
			"data":       maps,
			"pagination": paginated.Pagination,
			"code":       http.StatusOK,
		})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"status":     "success",
		"message":    "Inventories retrieved successfully",
		"data":       paginated.Data,
		"pagination": paginated.Pagination,
		"code":       http.StatusOK,
	})
}

func parseDateParam(v string) (*time.Time, error) {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil, nil
	}
	if len(v) == len("2006-01-02") {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return nil, err
		}
		return &t, nil
	}
	t, err := time.Parse(time.RFC3339, v)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetAllInventoryItems retrieves inventory items with pagination and optional inventory filter
// @Summary Get inventory items
// @Description Retrieve inventory items with pagination (limit/offset). Optionally filter by inventory_id.
// @Tags inventory_items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param inventory_id query string false "Inventory ID to filter items"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.InventoryItemResponse "Inventory items retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventory-items [get]
func (h *Handler) GetAllInventoryItems(c echo.Context) error {
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

	var inventoryID *string
	if invID := c.QueryParam("inventory_id"); invID != "" {
		inventoryID = &invID
	}

	resp, err := h.service.Inventory().GetAllInventoryItems(c.Request().Context(), inventoryID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory items retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateInventoryItem updates an inventory item counted quantity
// @Summary Update inventory item
// @Description Update inventory item counted_quantity by inventory item ID
// @Tags inventory_items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory Item ID"
// @Param input body model.UpdateInventoryItemRequest true "Inventory item update data"
// @Success 200 {object} model.InventoryItemResponse "Inventory item updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventory-items/{id} [put]
func (h *Handler) UpdateInventoryItem(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "invalid id", http.StatusBadRequest))
	}

	var req model.UpdateInventoryItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Inventory().UpdateInventoryItem(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory item updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteInventoryItem deletes an inventory item
// @Summary Delete inventory item
// @Description Soft delete an inventory item by inventory item ID
// @Tags inventory_items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory Item ID"
// @Success 204 {object} model.SuccessResponse "Inventory item deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventory-items/{id} [delete]
func (h *Handler) DeleteInventoryItem(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}
	if _, err := uuid.Parse(id); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "invalid id", http.StatusBadRequest))
	}

	if err := h.service.Inventory().DeleteInventoryItem(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusNoContent, nil)
}

// UpsertInventoryItems upserts counted quantities for inventory items and returns computed rows
// @Summary Upsert inventory items
// @Description Upsert (create/update) counted quantities for ingredients in an inventory and return computed rows
// @Tags inventory_items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Param input body model.UpsertInventoryItemsRequest true "Inventory items upsert data"
// @Success 200 {object} model.SuccessResponse{data=model.InventoryResponse} "Inventory items updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/items [post]
func (h *Handler) UpsertInventoryItems(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}

	var req model.UpsertInventoryItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Inventory().UpsertInventoryItems(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory items updated successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateInventoryItemsBatch fully replaces inventory items and optionally updates inventory fields in one call.
// Items present in the request are upserted; items absent from the request are deleted.
// Optionally pass date, storage_id, status, description to update the inventory itself.
// Status transitions (draft↔active) trigger stock apply/reverse automatically.
// @Summary Replace inventory items batch
// @Description Full replace of inventory items. Optionally update inventory fields (date, storage_id, status, description) in the same call. Stock adjusted on status transition.
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Param input body model.UpsertInventoryItemsRequest true "Inventory items batch data (items required; inventory fields optional)"
// @Success 200 {object} model.SuccessResponse{data=model.InventoryResponse} "Inventory items updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request or inventory is deleted"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/items/batch [put]
func (h *Handler) UpdateInventoryItemsBatch(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}

	var req model.UpsertInventoryItemsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Inventory().ReplaceInventoryItems(c.Request().Context(), id, &req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Inventory items updated successfully", resp, http.StatusOK))
}

// DeleteInventoryItemsBatch removes specific items from an inventory by item IDs.
// Reverses stock changes for items that belong to an active inventory.
// @Summary Batch delete inventory items
// @Description Remove specific inventory items by ID. Reverses stock if the inventory is active.
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Param input body model.DeleteInventoryItemsBatchRequest true "List of inventory item IDs to delete"
// @Success 200 {object} model.SuccessResponse "Inventory items deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/items/batch [delete]
func (h *Handler) DeleteInventoryItemsBatch(c echo.Context) error {
	var req model.DeleteInventoryItemsBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	if len(req.IDs) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "ids is required", http.StatusBadRequest))
	}

	if err := h.service.Inventory().DeleteInventoryItemsBatch(c.Request().Context(), req.IDs); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Inventory items deleted successfully", struct{}{}, http.StatusOK))
}

// DeleteInventoriesBatch deletes multiple inventories. Reverses stock for active ones.
// @Summary Batch delete inventories
// @Description Soft delete multiple inventories. Reverses stock changes for any that are active.
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.DeleteInventoriesBatchRequest true "List of inventory IDs to delete"
// @Success 200 {object} model.SuccessResponse "Inventories deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Inventory not found"
// @Failure 409 {object} model.ErrorResponse "Inventory already deleted or not the latest"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/batch [delete]
func (h *Handler) DeleteInventoriesBatch(c echo.Context) error {
	var req model.DeleteInventoriesBatchRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	if len(req.IDs) == 0 {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "ids is required", http.StatusBadRequest))
	}

	err := h.service.Inventory().DeleteInventoriesBatch(c.Request().Context(), req.IDs)
	if err != nil {
		// Map service sentinel errors to HTTP status codes
		if errors.Is(err, service.ErrInventoryNotFound) {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse(
				"inventory not found",
				err.Error(),
				http.StatusNotFound,
			))
		}
		if errors.Is(err, service.ErrInventoryAlreadyDeleted) {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"inventory is already deleted",
				err.Error(),
				http.StatusConflict,
			))
		}
		if errors.Is(err, service.ErrInventoryDeleteOnlyLatest) {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"only the latest inventory can be deleted",
				err.Error(),
				http.StatusConflict,
			))
		}
		// Internal failures
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete inventories",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Inventories deleted successfully", struct{}{}, http.StatusOK))
}

// GetInventoryItems retrieves computed inventory items for an inventory
// @Summary Get inventory items
// @Description Retrieve computed inventory items for an inventory (system qty from stock, counted qty, difference, amounts)
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Param expand query string false "Comma-separated relations to expand (e.g. ingredient_id)"
// @Success 200 {array} model.InventoryItemComputedResponse "Inventory items retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid inventory ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/items [get]
func (h *Handler) GetInventoryItems(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}

	resp, err := h.service.Inventory().GetInventoryItems(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, resp, "inventory_items"); expanded {
		if err != nil {
			return err
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Inventory items retrieved successfully", maps, http.StatusOK))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory items retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// CalculateInventory calculates and persists inventory totals
// @Summary Calculate inventory totals
// @Description Calculate and persist inventory totals (surplus_amount, shortage_amount, remaining_amount) into the inventory
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Success 200 {object} model.InventoryResponse "Inventory calculated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid inventory ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/calculate [post]
func (h *Handler) CalculateInventory(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}

	resp, err := h.service.Inventory().CalculateInventory(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory calculated successfully",
		resp,
		http.StatusOK,
	))
}

// GetInventory retrieves an inventory by ID
// @Summary Get inventory by ID
// @Description Retrieve a specific inventory by its ID
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Param expand query string false "Comma-separated relations to expand (e.g. storage_id)"
// @Success 200 {object} model.InventoryResponse "Inventory retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid inventory ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Inventory not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id} [get]
func (h *Handler) GetInventory(c echo.Context) error {
	id := c.Param("id")

	resp, err := h.service.Inventory().GetInventoryByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	if maps, expanded, err := h.expandListResponse(c, []*model.InventoryResponse{resp}, "inventories"); expanded {
		if err != nil {
			return err
		}
		if len(maps) > 0 {
			return c.JSON(http.StatusOK, model.NewSuccessResponse("Inventory retrieved successfully", maps[0], http.StatusOK))
		}
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// UpdateInventory updates an inventory
// @Summary Update inventory
// @Description Update an inventory fields (date, storage_id, descriptions, status)
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Param input body model.UpdateInventoryRequest true "Inventory update data"
// @Success 200 {object} model.InventoryResponse "Inventory updated successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request data"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id} [put]
func (h *Handler) UpdateInventory(c echo.Context) error {
	id := c.Param("id")

	var req model.UpdateInventoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid request",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	resp, err := h.service.Inventory().UpdateInventory(c.Request().Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "invalid counted_at") || strings.Contains(err.Error(), "invalid date") || strings.Contains(err.Error(), "cannot change counted_at") {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request data", err.Error(), http.StatusBadRequest))
		}
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory updated successfully",
		resp,
		http.StatusOK,
	))
}

// DeleteInventory deletes an inventory
// @Summary Delete inventory
// @Description Soft delete an inventory
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Success 204 {object} model.SuccessResponse "Inventory deleted successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid inventory ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Inventory not found"
// @Failure 409 {object} model.ErrorResponse "Inventory already deleted or not the latest"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id} [delete]
func (h *Handler) DeleteInventory(c echo.Context) error {
	id := c.Param("id")

	err := h.service.Inventory().DeleteInventory(c.Request().Context(), id)
	if err != nil {
		// Map service sentinel errors to HTTP status codes
		if errors.Is(err, service.ErrInventoryNotFound) {
			return c.JSON(http.StatusNotFound, model.NewErrorResponse(
				"inventory not found",
				err.Error(),
				http.StatusNotFound,
			))
		}
		if errors.Is(err, service.ErrInventoryAlreadyDeleted) {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"inventory is already deleted",
				err.Error(),
				http.StatusConflict,
			))
		}
		if errors.Is(err, service.ErrInventoryDeleteOnlyLatest) {
			return c.JSON(http.StatusConflict, model.NewErrorResponse(
				"only the latest inventory can be deleted",
				err.Error(),
				http.StatusConflict,
			))
		}
		// Internal failures (latest check, delete operation, etc.)
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to delete inventory",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusNoContent, nil)
}

// RestoreInventory restores a deleted inventory
// @Summary Restore inventory
// @Description Restore a previously deleted inventory
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Success 200 {object} model.InventoryResponse "Inventory restored successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid inventory ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/restore [post]
func (h *Handler) RestoreInventory(c echo.Context) error {
	id := c.Param("id")

	resp, err := h.service.Inventory().RestoreInventory(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory restored successfully",
		resp,
		http.StatusOK,
	))
}
