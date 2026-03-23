package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// GoodsReport returns dish sales report grouped by good
// @Summary Goods sales report
// @Description Paginated report: qty sold, selling price, cost price, markup per dish. Only paid orders. Filters by date range, department, category, dish, waiter, hall, table.
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param start_date    query string true  "Start date (YYYY-MM-DD)"
// @Param end_date      query string true  "End date (YYYY-MM-DD, inclusive)"
// @Param department_id query string false "Filter by department UUID"
// @Param category_id   query string false "Filter by category UUID"
// @Param good_id       query string false "Filter by specific good UUID"
// @Param waiter_id     query string false "Filter by waiter UUID"
// @Param hall_id       query string false "Filter by hall UUID"
// @Param table_id      query string false "Filter by table UUID"
// @Param limit         query int    false "Limit"  default(20)
// @Param offset        query int    false "Offset" default(0)
// @Param expand        query string false "Expand related fields"
// @Success 200 {object} model.GoodsReportResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/reports/goods [get]
func (h *Handler) GoodsReport(c echo.Context) error {
	startDate := c.QueryParam("start_date")
	endDate := c.QueryParam("end_date")
	if startDate == "" || endDate == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("start_date and end_date are required", "", http.StatusBadRequest))
	}

	limit := int32(20)
	offset := int32(0)
	if l, err := strconv.Atoi(c.QueryParam("limit")); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.Atoi(c.QueryParam("offset")); err == nil && o >= 0 {
		offset = int32(o)
	}

	optStr := func(key string) *string {
		if v := c.QueryParam(key); v != "" {
			return &v
		}
		return nil
	}

	resp, err := h.service.Report().GoodsReport(
		c.Request().Context(),
		startDate, endDate,
		optStr("department_id"),
		optStr("category_id"),
		optStr("good_id"),
		optStr("waiter_id"),
		optStr("hall_id"),
		optStr("table_id"),
		limit, offset,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get goods report", err.Error(), http.StatusInternalServerError))
	}

	total := int32(resp.Totals.TotalCount)
	if maps, expanded, err := h.expandListResponse(c, resp.Data, "goods"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse("ok", maps, resp.Totals, total, limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse("ok", resp.Data, resp.Totals, total, limit, offset, http.StatusOK))
}

// GoodOrdersReport returns per-order breakdown for a specific good
// @Summary Good orders report
// @Description Per-order breakdown for a specific good: qty, sell price, cost price, markup per order. Only paid orders.
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param id          path   string true  "Good UUID"
// @Param start_date  query  string true  "Start date (YYYY-MM-DD)"
// @Param end_date    query  string true  "End date (YYYY-MM-DD, inclusive)"
// @Param waiter_id   query  string false "Filter by waiter UUID"
// @Param hall_id     query  string false "Filter by hall UUID"
// @Param table_id    query  string false "Filter by table UUID"
// @Param limit       query  int    false "Limit"  default(20)
// @Param offset      query  int    false "Offset" default(0)
// @Param expand      query  string false "Expand related fields"
// @Success 200 {object} model.GoodOrdersReportResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/reports/goods/{id}/orders [get]
func (h *Handler) GoodOrdersReport(c echo.Context) error {
	goodID := c.Param("id")
	if goodID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("good id is required", "", http.StatusBadRequest))
	}
	startDate := c.QueryParam("start_date")
	endDate := c.QueryParam("end_date")
	if startDate == "" || endDate == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("start_date and end_date are required", "", http.StatusBadRequest))
	}

	limit := int32(20)
	offset := int32(0)
	if l, err := strconv.Atoi(c.QueryParam("limit")); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.Atoi(c.QueryParam("offset")); err == nil && o >= 0 {
		offset = int32(o)
	}

	optStr := func(key string) *string {
		if v := c.QueryParam(key); v != "" {
			return &v
		}
		return nil
	}

	resp, err := h.service.Report().GoodOrdersReport(
		c.Request().Context(),
		goodID, startDate, endDate,
		optStr("waiter_id"),
		optStr("hall_id"),
		optStr("table_id"),
		limit, offset,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to get good orders report", err.Error(), http.StatusInternalServerError))
	}

	total := int32(resp.Totals.TotalOrders)
	if maps, expanded, err := h.expandListResponse(c, resp.Data, "orders"); expanded {
		if err != nil {
			return nil
		}
		return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse("ok", maps, resp.Totals, total, limit, offset, http.StatusOK))
	}
	return c.JSON(http.StatusOK, model.NewPaginatedWithTotalsResponse("ok", resp.Data, resp.Totals, total, limit, offset, http.StatusOK))
}
