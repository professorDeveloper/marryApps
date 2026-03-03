package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

// OpenCashRegisterShift opens a new cash register shift.
// @Summary Open cash register shift
// @Description Opens a new shift for a cash register. Only one active shift per cash register is allowed.
// @Tags CashRegisterShifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body model.OpenCashRegisterShiftRequest true "Open shift request"
// @Success 201 {object} model.CashRegisterShiftResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/cash-register-shifts [post]
func (h *Handler) OpenCashRegisterShift(c echo.Context) error {
	var req model.OpenCashRegisterShiftRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.CashRegisterShift().OpenShift(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to open shift", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Shift opened", resp, http.StatusCreated))
}

// CloseCashRegisterShift closes an open cash register shift.
// @Summary Close cash register shift
// @Description Closes an open shift by recording closing cash and card amounts.
// @Tags CashRegisterShifts
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shift ID"
// @Param request body model.CloseCashRegisterShiftRequest true "Close shift request"
// @Success 200 {object} model.CashRegisterShiftResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/cash-register-shifts/{id}/close [post]
func (h *Handler) CloseCashRegisterShift(c echo.Context) error {
	id := c.Param("id")
	var req model.CloseCashRegisterShiftRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("invalid request", err.Error(), http.StatusBadRequest))
	}
	resp, err := h.service.CashRegisterShift().CloseShift(c.Request().Context(), id, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to close shift", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shift closed", resp, http.StatusOK))
}

// GetCashRegisterShift retrieves a cash register shift by ID.
// @Summary Get cash register shift
// @Description Returns a single cash register shift by its ID.
// @Tags CashRegisterShifts
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shift ID"
// @Success 200 {object} model.CashRegisterShiftResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/cash-register-shifts/{id} [get]
func (h *Handler) GetCashRegisterShift(c echo.Context) error {
	id := c.Param("id")
	resp, err := h.service.CashRegisterShift().GetShift(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("shift not found", err.Error(), http.StatusNotFound))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shift retrieved", resp, http.StatusOK))
}

// GetActiveCashRegisterShift retrieves the currently open shift for a cash register.
// @Summary Get active shift
// @Description Returns the currently open shift for the given cash register.
// @Tags CashRegisterShifts
// @Produce json
// @Security BearerAuth
// @Param cash_register_id query string true "Cash Register ID"
// @Success 200 {object} model.CashRegisterShiftResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/cash-register-shifts/active [get]
func (h *Handler) GetActiveCashRegisterShift(c echo.Context) error {
	cashRegisterID := c.QueryParam("cash_register_id")
	if cashRegisterID == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("cash_register_id is required", "", http.StatusBadRequest))
	}
	resp, err := h.service.CashRegisterShift().GetActiveShift(c.Request().Context(), cashRegisterID)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("no active shift found", err.Error(), http.StatusNotFound))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Active shift retrieved", resp, http.StatusOK))
}

// ListCashRegisterShifts lists cash register shifts with optional filters.
// @Summary List cash register shifts
// @Description Returns a paginated list of cash register shifts. Filter by cash_register_id, cashier_id, or status (open/closed).
// @Tags CashRegisterShifts
// @Produce json
// @Security BearerAuth
// @Param cash_register_id query string false "Filter by cash register ID"
// @Param cashier_id query string false "Filter by cashier ID"
// @Param status query string false "Filter by status: open or closed"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/cash-register-shifts [get]
func (h *Handler) ListCashRegisterShifts(c echo.Context) error {
	var cashRegisterID, cashierID, status *string
	if v := c.QueryParam("cash_register_id"); v != "" {
		cashRegisterID = &v
	}
	if v := c.QueryParam("cashier_id"); v != "" {
		cashierID = &v
	}
	if v := c.QueryParam("status"); v != "" {
		status = &v
	}

	limit := int32(20)
	offset := int32(0)
	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = int32(n)
		}
	}
	if v := c.QueryParam("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			offset = int32(n)
		}
	}

	shifts, total, err := h.service.CashRegisterShift().ListShifts(c.Request().Context(), cashRegisterID, cashierID, status, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to list shifts", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":   shifts,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// DeleteCashRegisterShift soft-deletes a cash register shift.
// @Summary Delete cash register shift
// @Description Soft-deletes a cash register shift by ID.
// @Tags CashRegisterShifts
// @Produce json
// @Security BearerAuth
// @Param id path string true "Shift ID"
// @Success 200 {object} model.SuccessResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/cash-register-shifts/{id} [delete]
func (h *Handler) DeleteCashRegisterShift(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.CashRegisterShift().DeleteShift(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("failed to delete shift", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("Shift deleted", (*model.CashRegisterShiftResponse)(nil), http.StatusOK))
}
