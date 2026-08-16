package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg"
)

// parseLimitOffset parses limit and offset query params with defaults of 20 and 0.
func parseLimitOffset(c echo.Context) (limit, offset int32) {
	limit = 20
	offset = 0
	if l, err := strconv.ParseInt(c.QueryParam("limit"), 10, 32); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.ParseInt(c.QueryParam("offset"), 10, 32); err == nil && o >= 0 {
		offset = int32(o)
	}
	return
}

// expandListResponse converts a slice-typed value to []map[string]any and applies expand.
// Returns (maps, true, nil) when expand was applied; (nil, false, nil) when no expand param.
// On error writes a JSON error response and returns (nil, true, err).
func (h *Handler) expandListResponse(c echo.Context, data any, table string) ([]map[string]any, bool, error) {
	expandFields := pg.ParseExpandFields(c.QueryParam("expand"))
	if len(expandFields) == 0 {
		return nil, false, nil
	}
	maps, err := structToMapSlice(data)
	if err != nil {
		_ = c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to process data", err.Error(), http.StatusInternalServerError))
		return nil, true, err
	}
	ctx := c.Request().Context()
	if err := h.repo.TenantExpand(ctx).ExpandRows(ctx, table, maps, expandFields); err != nil {
		if errors.Is(err, pg.ErrInvalidExpandField) {
			_ = c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid expand field", err.Error(), http.StatusBadRequest))
		} else {
			_ = c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to expand relations", err.Error(), http.StatusInternalServerError))
		}
		return nil, true, err
	}
	return maps, true, nil
}

// expandSingleResponse converts a single struct to map[string]any and applies expand.
// Returns (m, true, nil) when expand was applied; (nil, false, nil) when no expand param.
// On error writes a JSON error response and returns (nil, true, err).
func (h *Handler) expandSingleResponse(c echo.Context, data any, table string) (map[string]any, bool, error) {
	expandFields := pg.ParseExpandFields(c.QueryParam("expand"))
	if len(expandFields) == 0 {
		return nil, false, nil
	}
	m, err := structToMap(data)
	if err != nil {
		_ = c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to process data", err.Error(), http.StatusInternalServerError))
		return nil, true, err
	}
	rows := []map[string]any{m}
	ctx := c.Request().Context()
	if err := h.repo.TenantExpand(ctx).ExpandRows(ctx, table, rows, expandFields); err != nil {
		if errors.Is(err, pg.ErrInvalidExpandField) {
			_ = c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid expand field", err.Error(), http.StatusBadRequest))
		} else {
			_ = c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to expand relations", err.Error(), http.StatusInternalServerError))
		}
		return nil, true, err
	}
	return rows[0], true, nil
}

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

// ============================================
// HELPER FUNCTION: Convert struct to map
// ============================================
// This helper converts your bill struct to map[string]any for expand processing
func structToMapSlice(s any) ([]map[string]any, error) {
	data, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}

	var m []map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}

	return m, nil
}

func structToMap(s any) (map[string]any, error) {
	data, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}

	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}

	return m, nil
}

// ============================================
// GetBills WITH EXPAND SUPPORT
// ============================================
// @Summary Get bills
// @Description List bills (orders) with bill snapshots and filters, supports expand
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param start query string false "Start date/time (RFC3339 or YYYY-MM-DD)"
// @Param end query string false "End date/time (RFC3339 or YYYY-MM-DD)"
// @Param bill_no query int false "Bill number to search within the date range"
// @Param bill_status query string false "Bill status (opened, closed, paid)"
// @Param payment_type query string false "Payment type (cash, card)"
// @Param waiter_id query string false "Waiter ID (UUID)"
// @Param hall_id query string false "Hall ID (UUID)"
// @Param table_id query string false "Table ID (UUID)"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param expand query string false "Expand relations (comma-separated: user_id, hall_id, table_id, etc)"
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

	if v := c.QueryParam("bill_no"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid bill_no",
				"bill_no must be a positive integer",
				http.StatusBadRequest,
			))
		}
		n32 := int32(n)
		req.BillNo = &n32
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
	if v := c.QueryParam("cash_register_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid cash_register_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.CashRegisterID = &v
	}
	if v := c.QueryParam("cashier_id"); v != "" {
		if _, err := uuid.Parse(v); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"invalid cashier_id format",
				err.Error(),
				http.StatusBadRequest,
			))
		}
		req.CashierID = &v
	}

	// ============================================
	// STEP 1: Fetch data from service
	// ============================================
	resp, err := h.service.Order().GetBills(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get bills",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// ============================================
	// STEP 2: Parse expand query parameter
	// ============================================
	expandParam := c.QueryParam("expand")
	expandFields := pg.ParseExpandFields(expandParam)

	// ============================================
	// STEP 3: Apply expand if requested (on items only)
	// ============================================
	if len(expandFields) > 0 {
		itemMaps, err := structToMapSlice(resp.Items)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"failed to process bills",
				err.Error(),
				http.StatusInternalServerError,
			))
		}

		ctx := c.Request().Context()
		expandMgr := h.repo.TenantExpand(ctx)

		if err := expandMgr.ExpandRows(ctx, "orders", itemMaps, expandFields); err != nil {
			if errors.Is(err, pg.ErrInvalidExpandField) {
				return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
					"invalid expand field",
					err.Error(),
					http.StatusBadRequest,
				))
			}
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"failed to expand relations",
				err.Error(),
				http.StatusInternalServerError,
			))
		}

		return c.JSON(http.StatusOK, model.NewSuccessResponse(
			"Bills retrieved successfully",
			map[string]any{
				"total":  resp.Total,
				"limit":  resp.Limit,
				"offset": resp.Offset,
				"items":  itemMaps,
			},
			http.StatusOK,
		))
	}

	// ============================================
	// STEP 4: Return normal response (no expand)
	// ============================================
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Bills retrieved successfully",
		resp,
		http.StatusOK,
	))
}

// ============================================
// GetBillDetails WITH EXPAND SUPPORT
// ============================================
// @Summary Get bill details
// @Description Get full bill details including items, supports expand
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param lang query string false "Language (uz, ru, en)" default(uz)
// @Param id path string true "Bill ID (UUID)"
// @Param expand query string false "Expand relations (comma-separated: user_id, hall_id, etc)"
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

	// ============================================
	// STEP 1: Fetch single bill
	// ============================================
	bill, err := h.service.Order().GetBillDetails(c.Request().Context(), billID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to get bill details",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// ============================================
	// STEP 2: Convert to map
	// ============================================
	billMap, err := structToMap(bill)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
			"failed to process bill",
			err.Error(),
			http.StatusInternalServerError,
		))
	}

	// ============================================
	// STEP 3: Wrap in slice (required by ExpandRows)
	// ============================================
	rows := []map[string]any{billMap}

	// ============================================
	// STEP 4: Parse expand query parameter
	// ============================================
	expandParam := c.QueryParam("expand")
	expandFields := pg.ParseExpandFields(expandParam)

	// ============================================
	// STEP 5: Apply expand if requested
	// ============================================
	if len(expandFields) > 0 {
		ctx := c.Request().Context()
		expandMgr := h.repo.TenantExpand(ctx)

		if err := expandMgr.ExpandRows(ctx, "orders", rows, expandFields); err != nil {
			if errors.Is(err, pg.ErrInvalidExpandField) {
				return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
					"invalid expand field",
					err.Error(),
					http.StatusBadRequest,
				))
			}
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse(
				"failed to expand relations",
				err.Error(),
				http.StatusInternalServerError,
			))
		}
	}

	// ============================================
	// STEP 6: Unwrap from slice and return
	// ============================================
	return c.JSON(http.StatusOK, model.NewSuccessResponse(
		"Bill details retrieved successfully",
		rows[0],  // ← Unwrap from slice
		http.StatusOK,
	))
}

// ============================================
// API USAGE EXAMPLES
// ============================================
/*
WITHOUT EXPAND:
GET /api/v1/bills
GET /api/v1/bills/uuid-123

WITH EXPAND:
GET /api/v1/bills?expand=user_id
GET /api/v1/bills?expand=user_id,hall_id
GET /api/v1/bills?expand=user_id,table_id
GET /api/v1/bills/uuid-123?expand=user_id

RESPONSE FORMAT:
{
  "code": 200,
  "message": "Bills retrieved successfully",
  "data": [
    {
      "id": "uuid-123",
      "bill_no": 1,
      "user_id": 5,
      "hall_id": 10,
      "status": "paid",
      "_expand": {
        "user_id": {
          "id": 5,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "hall_id": {
          "id": 10,
          "name": "Main Hall"
        }
      }
    }
  ]
}
*/
