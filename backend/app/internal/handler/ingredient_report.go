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

func parseReportTimeParam(v string) (*time.Time, error) {
	if v == "" {
		return nil, nil
	}
	if t, err := time.Parse(time.RFC3339, v); err == nil {
		return &t, nil
	}
	if t, err := time.ParseInLocation("2006-01-02", v, time.Local); err == nil {
		return &t, nil
	}
	return nil, strconv.ErrSyntax
}

// parseReportEndTimeParam parses an end date parameter.
// For date-only inputs (YYYY-MM-DD), it advances to the start of the next day so that
// the entire end day is included in the report period (SQL uses < end_ts).
func parseReportEndTimeParam(v string) (*time.Time, error) {
	if v == "" {
		return nil, nil
	}
	if t, err := time.Parse(time.RFC3339, v); err == nil {
		return &t, nil
	}
	if t, err := time.ParseInLocation("2006-01-02", v, time.Local); err == nil {
		nextDay := t.AddDate(0, 0, 1)
		return &nextDay, nil
	}
	return nil, strconv.ErrSyntax
}

// GetIngredientReport retrieves aggregated ingredient stock movements report
// @Summary Get ingredient report
// @Description Retrieve ingredient report for a storage within a date range. Supports sorting by numeric fields and filtering by measurement and ingredient IDs.
// @Tags reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param storage_id query string true "Storage ID"
// @Param start query string false "Start datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param end query string false "End datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param ingredient_id query string false "Ingredient ID (optional filter)"
// @Param measurement query string false "Filter by exact measurement/unit"
// @Param ingredient_ids query string false "Comma-separated ingredient UUIDs to filter"
// @Param sort_by query string false "Sort by field" Enums(begin_quantity,end_quantity,in,out,shortage,surplus,ingredient_name)
// @Param sort_order query string false "Sort order" Enums(asc,desc)
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.IngredientReportItem "Ingredient report retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-reports [get]
func (h *Handler) GetIngredientReport(c echo.Context) error {
	storageID := c.QueryParam("storage_id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"storage_id is required",
			"missing query parameter: storage_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid storage_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	start, err := parseReportTimeParam(c.QueryParam("start"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	end, err := parseReportEndTimeParam(c.QueryParam("end"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var ingredientID *string
	if v := c.QueryParam("ingredient_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid ingredient_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		ingredientID = &v
	}

	// Extract and validate sort_by parameter
	sortBy := strings.TrimSpace(c.QueryParam("sort_by"))
	allowedSortBy := map[string]bool{
		"begin_quantity":  true,
		"end_quantity":    true,
		"in":              true,
		"out":             true,
		"shortage":        true,
		"surplus":         true,
		"ingredient_name": true,
	}
	if sortBy != "" && !allowedSortBy[sortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid sort_by",
			"allowed values: begin_quantity, end_quantity, in, out, shortage, surplus, ingredient_name",
			http.StatusBadRequest,
		))
	}

	// Extract and validate sort_order parameter
	sortOrder := strings.TrimSpace(c.QueryParam("sort_order"))
	if sortOrder != "" && sortOrder != "asc" && sortOrder != "desc" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	limit := int32(20)
	offset := int32(0)
	if l, err2 := strconv.Atoi(c.QueryParam("limit")); err2 == nil && l > 0 {
		limit = int32(l)
	}
	if o, err2 := strconv.Atoi(c.QueryParam("offset")); err2 == nil && o >= 0 {
		offset = int32(o)
	}

	optStr := func(key string) *string {
		if v := c.QueryParam(key); v != "" {
			return &v
		}
		return nil
	}

	resp, err := h.service.Ingredient().GetIngredientReport(c.Request().Context(), model.GetIngredientReportRequest{
		StorageID:     storageID,
		Start:         start,
		End:           end,
		IngredientID:  ingredientID,
		Measurement:   optStr("measurement"),
		IngredientIDs: optStr("ingredient_ids"),
		SortBy:        optStr("sort_by"),
		SortOrder:     optStr("sort_order"),
		Limit:         limit,
		Offset:        offset,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get ingredient report",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	total := int32(resp.Totals.TotalCount)
	if maps, expanded, err := h.expandListResponse(c, resp.Items, "ingredients"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse("Ingredient report retrieved successfully", maps, resp.Totals, total, limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse("Ingredient report retrieved successfully", resp.Items, resp.Totals, total, limit, offset, http.StatusOK))
}

// GetIngredientReportItem retrieves aggregated ingredient report for a single ingredient
// @Summary Get ingredient report item
// @Description Retrieve ingredient report for a specific ingredient within a storage and date range
// @Tags reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param ingredientId path string true "Ingredient ID"
// @Param storage_id query string true "Storage ID"
// @Param start query string false "Start datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param end query string false "End datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param expand query string false "Expand related fields"
// @Success 200 {object} model.IngredientReportItem "Ingredient report item retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 404 {object} model.ErrorResponse "Not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-reports/{ingredientId} [get]
func (h *Handler) GetIngredientReportItem(c echo.Context) error {
	ingredientID := c.Param("ingredientId")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"ingredientId is required",
			"missing path parameter: ingredientId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid ingredientId format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	storageID := c.QueryParam("storage_id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"storage_id is required",
			"missing query parameter: storage_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid storage_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	start, err := parseReportTimeParam(c.QueryParam("start"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	end, err := parseReportEndTimeParam(c.QueryParam("end"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	item, err := h.service.Ingredient().GetIngredientReportItem(c.Request().Context(), model.GetIngredientReportRequest{
		StorageID:    storageID,
		Start:        start,
		End:          end,
		IngredientID: &ingredientID,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get ingredient report item",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	if item == nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse(
			"not found",
			"ingredient report item not found",
			http.StatusNotFound,
		))
	}

	if m, expanded, err := h.expandSingleResponse(c, item, "ingredients"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient report item retrieved successfully", m, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient report item retrieved successfully", item, http.StatusOK))
}

// GetIngredientReportMovements retrieves ingredient stock movement ledger rows for a single ingredient
// @Summary Get ingredient report movements
// @Description Retrieve ingredient stock movements for a specific ingredient within a storage and date range
// @Tags reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param ingredientId path string true "Ingredient ID"
// @Param storage_id query string true "Storage ID"
// @Param start query string false "Start datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param end query string false "End datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param limit query int false "Limit (default: 50)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.IngredientStockMovementResponse "Ingredient report movements retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-reports/{ingredientId}/movements [get]
func (h *Handler) GetIngredientReportMovements(c echo.Context) error {
	ingredientID := c.Param("ingredientId")
	if ingredientID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"ingredientId is required",
			"missing path parameter: ingredientId",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(ingredientID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid ingredientId format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	storageID := c.QueryParam("storage_id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"storage_id is required",
			"missing query parameter: storage_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid storage_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	start, err := parseReportTimeParam(c.QueryParam("start"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	end, err := parseReportEndTimeParam(c.QueryParam("end"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	limit := int32(50)
	if v := c.QueryParam("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit",
				"limit must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(n)
	}

	offset := int32(0)
	if v := c.QueryParam("offset"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(n)
	}

	rows, err := h.service.Ingredient().GetIngredientReportMovements(c.Request().Context(), model.GetIngredientReportMovementsRequest{
		StorageID:    storageID,
		IngredientID: ingredientID,
		Start:        start,
		End:          end,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get ingredient report movements",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	if maps, expanded, err := h.expandListResponse(c, rows, "ingredient_stock_movements"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient report movements retrieved successfully", maps, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Ingredient report movements retrieved successfully", rows, http.StatusOK))
}

// GetIngredientInventoryStatusReport retrieves per-ingredient report anchored at most recent inventory count
// @Summary Get ingredient inventory status report
// @Description Retrieve ingredient report where begin_qty is anchored at the most recent inventory count event. For each ingredient, the report finds the latest inventory_surplus_in or inventory_shortage_out event and uses its stock_after as begin_qty. Subsequent movements are summed normally. If an ingredient has no inventory event, begin_qty defaults to 0 and all movements are included.
// @Tags reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param storage_id query string true "Storage ID (UUID)" example:"550e8400-e29b-41d4-a716-446655440000"
// @Param end query string false "End datetime (RFC3339 or YYYY-MM-DD format). Defaults to current time" example:"2026-04-20"
// @Param ingredient_id query string false "Optional filter: return only this ingredient (UUID)" example:"550e8400-e29b-41d4-a716-446655440001"
// @Param limit query int false "Pagination: items per page (default: 20)" default(20) example:"20"
// @Param offset query int false "Pagination: offset from start (default: 0)" default(0) example:"0"
// @Param expand query string false "Expand related fields (comma-separated)"
// @Success 200 {object} model.IngredientReportPaginatedResponse "Inventory status report retrieved successfully"
// @Failure 400 {object} model.ErrorResponse "Invalid request parameters"
// @Failure 401 {object} model.ErrorResponse "Unauthorized"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/ingredient-reports/inventory-status [get]
func (h *Handler) GetIngredientInventoryStatusReport(c echo.Context) error {
	storageID := c.QueryParam("storage_id")
	if storageID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"storage_id is required",
			"missing query parameter: storage_id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(storageID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid storage_id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	end, err := parseReportEndTimeParam(c.QueryParam("end"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	var ingredientID *string
	if v := c.QueryParam("ingredient_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid ingredient_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		ingredientID = &v
	}

	limit := int32(20)
	if v := c.QueryParam("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit",
				"limit must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(n)
	}

	offset := int32(0)
	if v := c.QueryParam("offset"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid offset",
				"offset must be a non-negative integer",
				http.StatusBadRequest,
			))
		}
		offset = int32(n)
	}

	resp, err := h.service.Ingredient().GetIngredientInventoryStatusReport(c.Request().Context(), model.GetIngredientInventoryStatusReportRequest{
		StorageID:    storageID,
		End:          end,
		IngredientID: ingredientID,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get inventory status report",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	total := int32(resp.Totals.TotalCount)
	if maps, expanded, err := h.expandListResponse(c, resp.Items, "ingredients"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse(
			"Inventory status report retrieved successfully",
			maps, resp.Totals, total, limit, offset, http.StatusOK,
		))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse(
		"Inventory status report retrieved successfully",
		resp.Items, resp.Totals, total, limit, offset, http.StatusOK,
	))
}
