package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/middleware"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/pkg/validate"
)

// CreateIncomeExpense creates an income or expense transaction
// @Summary Create income or expense transaction
// @Description Create a new income or expense transaction. Type must be "income" or "expense".
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateIncomeExpenseRequest true "Transaction data"
// @Success 201 {object} model.TransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions/income-expense [post]
func (h *Handler) CreateIncomeExpense(c echo.Context) error {
	req, err := validate.BindAndValidate[model.CreateIncomeExpenseRequest](c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request", err.Error(), http.StatusBadRequest))
	}

	userID, _ := c.Get("user_id").(string)

	resp, err := h.service.Transaction().CreateIncomeExpense(c.Request().Context(), userID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to create transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Transaction created successfully", resp, http.StatusCreated))
}

// CreateCashTransfer creates a transfer transaction between cash registers
// @Summary Transfer between cash registers
// @Description Transfer an amount between two cash registers (optionally across branches)
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body model.CreateCashTransferRequest true "Transfer data"
// @Success 201 {object} model.TransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions/transfer [post]
func (h *Handler) CreateCashTransfer(c echo.Context) error {
	req, err := validate.BindAndValidate[model.CreateCashTransferRequest](c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request", err.Error(), http.StatusBadRequest))
	}

	userID, _ := c.Get("user_id").(string)

	resp, err := h.service.Transaction().CreateTransfer(c.Request().Context(), userID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to create transfer", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusCreated, model.NewSuccessResponse("Transfer created successfully", resp, http.StatusCreated))
}

// GetTransactionByID retrieves a transaction by ID
// @Summary Get transaction by ID
// @Tags transactions
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Success 200 {object} model.TransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Router /api/v1/transactions/{id} [get]
func (h *Handler) GetTransactionByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Transaction().GetTransactionByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, model.NewErrorResponse("Transaction not found", err.Error(), http.StatusNotFound))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("OK", resp, http.StatusOK))
}

// GetAllTransactions returns paginated transactions with optional filters
// @Summary Get all transactions
// @Description Supports filters: type (income|expense|transfer), cash_register_id, group_id, date_from, date_to
// @Tags transactions
// @Security BearerAuth
// @Param type query string false "Filter by type: income, expense, transfer"
// @Param cash_register_id query string false "Filter by cash register"
// @Param group_id query string false "Filter by group transaction"
// @Param date_from query string false "Start date (RFC3339)"
// @Param date_to query string false "End date (RFC3339)"
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset (default 0)"
// @Success 200 {array} model.TransactionResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions [get]
func (h *Handler) GetAllTransactions(c echo.Context) error {
	_ = middleware.GetBranchIDFromContext(c) // branch already set via middleware

	limit := int32(20)
	offset := int32(0)
	if l, err := strconv.Atoi(c.QueryParam("limit")); err == nil && l > 0 {
		limit = int32(l)
	}
	if o, err := strconv.Atoi(c.QueryParam("offset")); err == nil && o >= 0 {
		offset = int32(o)
	}

	svc := h.service.Transaction()
	ctx := c.Request().Context()

	// Filter by type
	if txType := c.QueryParam("type"); txType != "" {
		rows, err := svc.GetTransactionsByType(ctx, txType, limit, offset)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get transactions", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("OK", rows, http.StatusOK))
	}

	// Filter by cash register
	if crID := c.QueryParam("cash_register_id"); crID != "" {
		rows, err := svc.GetTransactionsByCashRegister(ctx, crID, limit, offset)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get transactions", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("OK", rows, http.StatusOK))
	}

	// Filter by date range
	dateFrom := c.QueryParam("date_from")
	dateTo := c.QueryParam("date_to")
	if dateFrom != "" && dateTo != "" {
		from, err1 := time.Parse(time.RFC3339, dateFrom)
		to, err2 := time.Parse(time.RFC3339, dateTo)
		if err1 == nil && err2 == nil {
			rows, err := svc.GetTransactionsByDateRange(ctx, from, to, limit, offset)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get transactions", err.Error(), http.StatusInternalServerError))
			}
			return c.JSON(http.StatusOK, model.NewSuccessResponse("OK", rows, http.StatusOK))
		}
	}

	// Filter by group
	if groupID := c.QueryParam("group_id"); groupID != "" {
		rows, err := svc.GetTransactionsByGroup(ctx, groupID, limit, offset)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get transactions", err.Error(), http.StatusInternalServerError))
		}
		return c.JSON(http.StatusOK, model.NewSuccessResponse("OK", rows, http.StatusOK))
	}

	// Default: all
	rows, err := svc.GetAllTransactions(ctx, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to get transactions", err.Error(), http.StatusInternalServerError))
	}
	return c.JSON(http.StatusOK, model.NewSuccessResponse("OK", rows, http.StatusOK))
}

// UpdateTransaction updates a transaction
// @Summary Update transaction
// @Tags transactions
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Param input body model.UpdateTransactionRequest true "Update data"
// @Success 200 {object} model.TransactionResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions/{id} [put]
func (h *Handler) UpdateTransaction(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID", err.Error(), http.StatusBadRequest))
	}

	var req model.UpdateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request", err.Error(), http.StatusBadRequest))
	}

	resp, err := h.service.Transaction().UpdateTransaction(c.Request().Context(), id, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to update transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewSuccessResponse("Transaction updated successfully", resp, http.StatusOK))
}

// DeleteTransaction soft-deletes a transaction
// @Summary Delete transaction
// @Tags transactions
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Success 204
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions/{id} [delete]
func (h *Handler) DeleteTransaction(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid ID", err.Error(), http.StatusBadRequest))
	}

	if err := h.service.Transaction().DeleteTransaction(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to delete transaction", err.Error(), http.StatusInternalServerError))
	}

	return c.NoContent(http.StatusNoContent)
}

// GetCashReport returns the full cash register report for a date range.
// @Summary Cash register report
// @Description Returns summary by transaction type, income/expense grouped by category, and day balance totals.
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param from             query string false "Start datetime (RFC3339)" example("2026-02-01T00:00:00Z")
// @Param to               query string false "End datetime (RFC3339)"   example("2026-02-20T23:59:59Z")
// @Param cash_register_id query string false "Filter by cash register UUID"
// @Success 200 {object} model.CashReportResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions/report [get]
func (h *Handler) GetCashReport(c echo.Context) error {
	var req model.CashReportRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid request", err.Error(), http.StatusBadRequest))
	}
	if req.From == "" || req.To == "" {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse("from and to are required", "", http.StatusBadRequest))
	}

	report, err := h.service.Transaction().GetCashReport(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Failed to build report", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, report)
}
