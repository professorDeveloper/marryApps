package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// GetDashboardOverview returns dashboard overview data
// @Summary Get dashboard overview
// @Description Returns aggregated dashboard data including KPIs, sales dynamics, revenue by payment types, revenue by categories, and dish sales
// @Tags Dashboard
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param start query string true "Start date (RFC3339 format)" example("2026-01-01T00:00:00Z")
// @Param end query string true "End date (RFC3339 format)" example("2026-12-31T23:59:59Z")
// @Param group_by query string false "Group by (day, week, month)" Enums(day, week, month) default(day)
// @Param dish_metric query string false "Dish metric (revenue, quantity)" Enums(revenue, quantity) default(revenue)
// @Param dish_sort query string false "Dish sort (asc, desc)" Enums(asc, desc) default(desc)
// @Param limit query int false "Limit for dish sales" default(10) minimum(1) maximum(100)
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Success 200 {object} model.SuccessResponse{data=model.DashboardOverviewResponse}
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/dashboard/overview [get]
func (h *Handler) GetDashboardOverview(c echo.Context) error {
	// Parse query parameters
	startStr := c.QueryParam("start")
	endStr := c.QueryParam("end")
	groupBy := c.QueryParam("group_by")
	dishMetric := c.QueryParam("dish_metric")
	dishSort := c.QueryParam("dish_sort")
	limitStr := c.QueryParam("limit")
	lang := c.QueryParam("lang")

	// Validate group_by
	if groupBy != "" && groupBy != "day" && groupBy != "week" && groupBy != "month" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid group_by parameter",
			"group_by must be one of: day, week, month",
			http.StatusBadRequest,
		))
	}

	// Validate dish_metric
	if dishMetric != "" && dishMetric != "revenue" && dishMetric != "quantity" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid dish_metric parameter",
			"dish_metric must be one of: revenue, quantity",
			http.StatusBadRequest,
		))
	}

	// Validate dish_sort
	if dishSort != "" && dishSort != "asc" && dishSort != "desc" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid dish_sort parameter",
			"dish_sort must be one of: asc, desc",
			http.StatusBadRequest,
		))
	}

	// Validate lang
	if lang != "" && lang != "uz" && lang != "ru" && lang != "en" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid lang parameter",
			"lang must be one of: uz, ru, en",
			http.StatusBadRequest,
		))
	}

	// Parse dates
	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start date format",
			"start must be in RFC3339 format",
			http.StatusBadRequest,
		))
	}

	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end date format",
			"end must be in RFC3339 format",
			http.StatusBadRequest,
		))
	}

	// Validate date range
	if start.After(end) || start.Equal(end) {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid date range",
			"start date must be before end date",
			http.StatusBadRequest,
		))
	}

	// Parse limit
	var limit int32 = 10
	if limitStr != "" {
		limitInt, err := strconv.ParseInt(limitStr, 10, 32)
		if err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit format",
				"limit must be a valid integer",
				http.StatusBadRequest,
			))
		}
		limit = int32(limitInt)
		if limit < 1 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit value",
				"limit must be at least 1",
				http.StatusBadRequest,
			))
		}
		if limit > 100 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid limit value",
				"limit must not exceed 100",
				http.StatusBadRequest,
			))
		}
	}

	// Build request
	req := model.DashboardOverviewRequest{
		Start:      start,
		End:        end,
		GroupBy:    model.DashboardGroupBy(groupBy),
		DishMetric: model.DashboardDishMetric(dishMetric),
		DishSort:   model.DashboardSort(dishSort),
		Limit:      limit,
		Lang:       lang,
	}

	// Get dashboard overview
	response, err := h.service.Dashboard().GetDashboardOverview(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get dashboard overview",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Dashboard overview retrieved successfully",
		response,
		http.StatusOK,
	))
}
