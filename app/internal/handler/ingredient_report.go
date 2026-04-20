package handler

import (
	"net/http"
	"strconv"
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
// @Description Retrieve ingredient report for a storage within a date range
// @Tags reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param storage_id query string true "Storage ID"
// @Param start query string false "Start datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param end query string false "End datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param ingredient_id query string false "Ingredient ID (optional filter)"
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

	limit := int32(20)
	offset := int32(0)
	if l, err2 := strconv.Atoi(c.QueryParam("limit")); err2 == nil && l > 0 {
		limit = int32(l)
	}
	if o, err2 := strconv.Atoi(c.QueryParam("offset")); err2 == nil && o >= 0 {
		offset = int32(o)
	}

	resp, err := h.service.Ingredient().GetIngredientReport(c.Request().Context(), model.GetIngredientReportRequest{
		StorageID:    storageID,
		Start:        start,
		End:          end,
		IngredientID: ingredientID,
		Limit:        limit,
		Offset:       offset,
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
// @Description Retrieve ingredient report where begin_qty is anchored at the most recent inventory count
// @Tags reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param storage_id query string true "Storage ID"
// @Param end query string false "End datetime (RFC3339) or date (YYYY-MM-DD)"
// @Param ingredient_id query string false "Ingredient ID (optional filter)"
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Param expand query string false "Expand related fields"
// @Success 200 {array} model.IngredientReportItem "Inventory status report retrieved successfully"
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
