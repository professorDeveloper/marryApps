package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
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
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse(
		"Inventory created successfully",
		resp,
		http.StatusCreated,
	))
}

// GetAllInventories retrieves inventories with pagination
// @Summary Get inventories
// @Description Retrieve inventories with pagination (limit/offset)
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param date_from query string false "Start date (YYYY-MM-DD)"
// @Param date_to query string false "End date (YYYY-MM-DD)"
// @Param storage_id query string false "Storage ID"
// @Param ingredient_id query string false "Ingredient ID"
// @Param status query string false "Inventory status"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.InventoryResponse "Inventories retrieved successfully"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories [get]
func (h *Handler) GetAllInventories(c echo.Context) error {
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

	resp, err := h.service.Inventory().GetInventoriesFiltered(c.Request().Context(), dateFrom, dateTo, storageID, ingredientID, status, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventories retrieved successfully",
		resp,
		http.StatusOK,
	))
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
// @Success 200 {array} model.InventoryItemComputedResponse "Inventory items updated successfully"
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

// GetInventoryItems retrieves computed inventory items for an inventory
// @Summary Get inventory items
// @Description Retrieve computed inventory items for an inventory (system qty from stock, counted qty, difference, amounts)
// @Tags inventory_items
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
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

// ApplyInventory applies inventory count to ingredient stock and records stock movements
// @Summary Apply inventory
// @Description Apply inventory count to ingredient_stock for the inventory storage and record surplus/shortage movements
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Inventory ID"
// @Success 200 {object} model.InventoryResponse "Inventory applied successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid inventory ID"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id}/apply [post]
func (h *Handler) ApplyInventory(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "id is required", http.StatusBadRequest))
	}

	resp, err := h.service.Inventory().ApplyInventory(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventory applied successfully",
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
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/{id} [delete]
func (h *Handler) DeleteInventory(c echo.Context) error {
	id := c.Param("id")

	if err := h.service.Inventory().DeleteInventory(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
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

// SearchInventories searches inventories
// @Summary Search inventories
// @Description Search inventories by description or number
// @Tags inventories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param q query string true "Search query"
// @Param limit query int false "Limit results (default: 20)" default(20)
// @Param offset query int false "Offset for pagination (default: 0)" default(0)
// @Success 200 {array} model.InventoryResponse "Inventories retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/inventories/search [get]
func (h *Handler) SearchInventories(c echo.Context) error {
	q := c.QueryParam("q")
	if q == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", "q is required", http.StatusBadRequest))
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

	resp, err := h.service.Inventory().SearchInventories(c.Request().Context(), q, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Inventories retrieved successfully",
		resp,
		http.StatusOK,
	))
}
