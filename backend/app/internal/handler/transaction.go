package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
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

// GetAllTransactions retrieves all transactions
// @Summary Get all transactions
// @Description Retrieve all transactions with pagination, filters, search and sorting
// @Tags transactions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search by comment or description"
// @Param type query string false "Filter by transaction type"
// @Param pay_type query string false "Filter by pay type (cash, card)"
// @Param cash_register_id query string false "Filter by cash register ID"
// @Param group_transaction_id query string false "Filter by group transaction ID"
// @Param date_from query string false "Start date (YYYY-MM-DD)"
// @Param date_to query string false "End date (YYYY-MM-DD)"
// @Param sort_by query string false "Sort by field" Enums(created_at,amount) default(created_at)
// @Param sort_order query string false "Sort order" Enums(asc,desc) default(desc)
// @Param limit query int false "Limit (default: 20)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {object} model.PaginatedTransactionsResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 401 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /api/v1/transactions [get]
func (h *Handler) GetAllTransactions(c echo.Context) error {
	var limit int32 = 20
	var offset int32 = 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		l, err := strconv.ParseInt(limitStr, 10, 32)
		if err != nil || l <= 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid limit", "limit must be a positive integer", http.StatusBadRequest))
		}
		limit = int32(l)
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		o, err := strconv.ParseInt(offsetStr, 10, 32)
		if err != nil || o < 0 {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse("Invalid offset", "offset must be a non-negative integer", http.StatusBadRequest))
		}
		offset = int32(o)
	}

	filter := model.TransactionListFilter{
		Search:             strings.TrimSpace(c.QueryParam("search")),
		Type:               strings.TrimSpace(c.QueryParam("type")),
		PayType:            strings.TrimSpace(c.QueryParam("pay_type")),
		CashRegisterID:     strings.TrimSpace(c.QueryParam("cash_register_id")),
		GroupTransactionID: strings.TrimSpace(c.QueryParam("group_transaction_id")),
		DateFrom:           strings.TrimSpace(c.QueryParam("date_from")),
		DateTo:             strings.TrimSpace(c.QueryParam("date_to")),
		SortBy:             strings.TrimSpace(c.QueryParam("sort_by")),
		SortOrder:          strings.TrimSpace(c.QueryParam("sort_order")),
	}

	if filter.SortBy == "" {
		filter.SortBy = "date"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	allowedSortBy := map[string]bool{
		"date":       true,
		"created_at": true,
		"amount":     true,
	}
	if !allowedSortBy[filter.SortBy] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_by",
			"allowed values: date, created_at, amount",
			http.StatusBadRequest,
		))
	}

	allowedSortOrder := map[string]bool{"asc": true, "desc": true}
	if !allowedSortOrder[filter.SortOrder] {
		return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
			"Invalid sort_order",
			"allowed values: asc, desc",
			http.StatusBadRequest,
		))
	}

	for field, value := range map[string]string{
		"cash_register_id":     filter.CashRegisterID,
		"group_transaction_id": filter.GroupTransactionID,
	} {
		if value == "" {
			continue
		}
		if _, err := uuid.Parse(value); err != nil {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid request",
				field+" must be a valid UUID",
				http.StatusBadRequest,
			))
		}
	}
	if filter.PayType != "" {
		allowedPayTypes := map[string]bool{
			"cash": true,
			"card": true,
		}
		if !allowedPayTypes[filter.PayType] {
			return c.JSON(http.StatusBadRequest, model.NewErrorResponse(
				"Invalid pay_type",
				"allowed values: cash, card",
				http.StatusBadRequest,
			))
		}
	}

	resp, total, err := h.service.Transaction().GetAllTransactions(c.Request().Context(), filter, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, model.NewErrorResponse("Operation failed", err.Error(), http.StatusInternalServerError))
	}

	return c.JSON(http.StatusOK, model.NewPaginatedResponse(
		"Transactions retrieved successfully",
		resp,
		int32(total),
		limit,
		offset,
		http.StatusOK,
	))
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
