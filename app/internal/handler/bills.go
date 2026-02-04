package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

func parseBillTimeParam(v string) (*time.Time, error) {
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

// GetBills retrieves bills list with filters
// @Summary Get bills
// @Description List bills (orders) with bill snapshots and filters
// @Tags Bills
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param start query string false "Start date/time (RFC3339 or YYYY-MM-DD)"
// @Param end query string false "End date/time (RFC3339 or YYYY-MM-DD)"
// @Param bill_status query string false "Bill status (opened, closed, paid)"
// @Param payment_type query string false "Payment type (cash, card)"
// @Param waiter_id query string false "Waiter ID (UUID)"
// @Param hall_id query string false "Hall ID (UUID)"
// @Param table_id query string false "Table ID (UUID)"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/bills [get]
func (h *Handler) GetBills(c echo.Context) error {
	start, err := parseBillTimeParam(c.QueryParam("start"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid start format",
			err.Error(),
			http.StatusBadRequest,
		))
	}
	end, err := parseBillTimeParam(c.QueryParam("end"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid end format",
			err.Error(),
			http.StatusBadRequest,
		))
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

	req := model.GetBillsRequest{
		Start:  start,
		End:    end,
		Limit:  limit,
		Offset: offset,
	}

	if v := c.QueryParam("bill_status"); v != "" {
		req.BillStatus = &v
	}
	if v := c.QueryParam("payment_type"); v != "" {
		req.PaymentType = &v
	}
	if v := c.QueryParam("waiter_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid waiter_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.WaiterID = &v
	}
	if v := c.QueryParam("hall_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid hall_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.HallID = &v
	}
	if v := c.QueryParam("table_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid table_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.TableID = &v
	}

	rows, err := h.service.Order().GetBills(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get bills",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Bills retrieved successfully",
		rows,
		http.StatusOK,
	))
}

// GetBillDetails retrieves a single bill details by id
// @Summary Get bill details
// @Description Get full bill details including items
// @Tags Bills
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Bill ID (UUID)"
// @Success 200 {object} model.SuccessResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/bills/{id} [get]
func (h *Handler) GetBillDetails(c echo.Context) error {
	billID := c.Param("id")
	if billID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"bill id is required",
			"missing path parameter: id",
			http.StatusBadRequest,
		))
	}
	if _, err := uuid.Parse(billID); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"invalid bill id format",
			err.Error(),
			http.StatusBadRequest,
		))
	}

	bill, err := h.service.Order().GetBillDetails(c.Request().Context(), billID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get bill details",
			err.Error(),
			http.StatusInternalServerError,
		))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Bill details retrieved successfully",
		bill,
		http.StatusOK,
	))
}
