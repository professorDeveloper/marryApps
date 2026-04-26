package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
	"gitlab.yurtal.tech/company/maryai/back/internal/repository"
	pg "gitlab.yurtal.tech/company/maryai/back/internal/repository/pg/tenantsdb"
)

type TransactionS struct {
	repo *repository.Repository
}

func NewTransactionS(repo *repository.Repository) *TransactionS {
	return &TransactionS{repo: repo}
}

func (s *TransactionS) getTenantMutationQueries(ctx context.Context) (*pg.Queries, context.Context, pgx.Tx, bool, error) {
	if existingTx, ok := repository.TenantTxFromContext(ctx); ok && existingTx != nil {
		if q, ok := repository.TenantQueriesFromContext(ctx); ok && q != nil {
			return q, ctx, existingTx, false, nil
		}
		q := pg.New(existingTx)
		txCtx := repository.WithTenantQueries(ctx, q)
		return q, txCtx, existingTx, false, nil
	}

	tx, err := s.repo.PgRepo.TenantPool.Begin(ctx)
	if err != nil {
		return nil, nil, nil, false, fmt.Errorf("failed to begin transaction: %w", err)
	}

	brandID, _ := ctx.Value("brand_id").(string)
	brandID = strings.TrimSpace(brandID)
	if brandID == "" {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("brand_id is missing in context")
	}

	schemaName := fmt.Sprintf("tenant_%s", brandID)
	if _, err := tx.Exec(ctx, fmt.Sprintf(`SET LOCAL search_path TO "%s", public`, schemaName)); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set tenant search_path: %w", err)
	}

	if _, err := tx.Exec(ctx, "SET LOCAL app.brand_id = $1", brandID); err != nil {
		tx.Rollback(ctx)
		return nil, nil, nil, false, fmt.Errorf("failed to set app.brand_id: %w", err)
	}

	if branchID, _ := ctx.Value("branch_id").(string); strings.TrimSpace(branchID) != "" {
		if _, err := tx.Exec(ctx, "SET LOCAL app.branch_id = $1", strings.TrimSpace(branchID)); err != nil {
			tx.Rollback(ctx)
			return nil, nil, nil, false, fmt.Errorf("failed to set app.branch_id: %w", err)
		}
	}

	q := pg.New(tx)
	txCtx := repository.WithTenantQueries(ctx, q)

	return q, txCtx, tx, true, nil
}

// CreateIncomeExpense creates an income or expense transaction
func (s *TransactionS) CreateIncomeExpense(ctx context.Context, userID string, req model.CreateIncomeExpenseRequest) (*model.TransactionResponse, error) {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	cashRegUUID, err := uuid.Parse(req.CashRegisterID)
	if err != nil {
		return nil, fmt.Errorf("invalid cash_register_id: %w", err)
	}

	amount := pgtype.Numeric{}
	if err := amount.Scan(req.Amount); err != nil {
		return nil, fmt.Errorf("invalid amount: %w", err)
	}

	date := time.Now()
	if req.Date != nil {
		date = *req.Date
	}

	params := pg.CreateTransactionParams{
		ID:             uuid.New(),
		Type:           pg.TransactionType(req.Type),
		CashRegisterID: pgtype.UUID{Bytes: cashRegUUID, Valid: true},
		Amount:         amount,
		Description:    req.Description,
		Date:           date,
	}

	if req.GroupTransactionID != nil {
		gid, err := uuid.Parse(*req.GroupTransactionID)
		if err != nil {
			return nil, fmt.Errorf("invalid group_transaction_id: %w", err)
		}
		params.GroupTransactionID = pgtype.UUID{Bytes: gid, Valid: true}
	}

	if req.PayType != nil {
		params.PayType = pg.NullPaymentType{
			PaymentType: pg.PaymentType(*req.PayType),
			Valid:       true,
		}
	}

	if userID != "" {
		uid, err := uuid.Parse(userID)
		if err == nil {
			params.UserID = pgtype.UUID{Bytes: uid, Valid: true}
		}
	}

	createdTx, err := q.CreateTransaction(txCtx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toTransactionResponse(createdTx), nil
}

// CreateTransfer creates two transaction records for a transfer:
//   - transfer_expense in the sender's branch/cash register (money OUT)
//   - transfer_income in the receiver's branch/cash register (money IN)
func (s *TransactionS) CreateTransfer(ctx context.Context, userID string, req model.CreateCashTransferRequest) (*model.TransactionResponse, error) {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	fromCR, err := uuid.Parse(req.FromCashRegisterID)
	if err != nil {
		return nil, fmt.Errorf("invalid from_cash_register_id: %w", err)
	}
	toCR, err := uuid.Parse(req.ToCashRegisterID)
	if err != nil {
		return nil, fmt.Errorf("invalid to_cash_register_id: %w", err)
	}

	amount := pgtype.Numeric{}
	if err := amount.Scan(req.Amount); err != nil {
		return nil, fmt.Errorf("invalid amount: %w", err)
	}

	date := time.Now()
	if req.Date != nil {
		date = *req.Date
	}

	// Parse optional branch IDs
	var fromBranchPg, toBranchPg pgtype.UUID
	if req.FromBranchID != nil {
		bid, err := uuid.Parse(*req.FromBranchID)
		if err != nil {
			return nil, fmt.Errorf("invalid from_branch_id: %w", err)
		}
		fromBranchPg = pgtype.UUID{Bytes: bid, Valid: true}
	}
	if req.ToBranchID != nil {
		bid, err := uuid.Parse(*req.ToBranchID)
		if err != nil {
			return nil, fmt.Errorf("invalid to_branch_id: %w", err)
		}
		toBranchPg = pgtype.UUID{Bytes: bid, Valid: true}
	}

	var groupPg pgtype.UUID
	if req.GroupTransactionID != nil {
		gid, err := uuid.Parse(*req.GroupTransactionID)
		if err != nil {
			return nil, fmt.Errorf("invalid group_transaction_id: %w", err)
		}
		groupPg = pgtype.UUID{Bytes: gid, Valid: true}
	}

	var payType pg.NullPaymentType
	if req.PayType != nil {
		payType = pg.NullPaymentType{PaymentType: pg.PaymentType(*req.PayType), Valid: true}
	}

	var userPg pgtype.UUID
	if userID != "" {
		if uid, err := uuid.Parse(userID); err == nil {
			userPg = pgtype.UUID{Bytes: uid, Valid: true}
		}
	}

	// Row 1: transfer_expense — money OUT from sender's cash register
	expenseParams := pg.CreateTransactionParams{
		ID:                 uuid.New(),
		Type:               pg.TransactionTypeTransferExpense,
		CashRegisterID:     pgtype.UUID{Bytes: fromCR, Valid: true},
		ToCashRegisterID:   pgtype.UUID{Bytes: toCR, Valid: true}, // reference to receiver
		GroupTransactionID: groupPg,
		Amount:             amount,
		Description:        req.Description,
		PayType:            payType,
		Date:               date,
		UserID:             userPg,
		BranchID:           fromBranchPg, // sender's branch (null = current branch from middleware)
	}
	expenseTx, err := q.CreateTransaction(txCtx, expenseParams)
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer_expense: %w", err)
	}

	// Row 2: transfer_income — money IN to receiver's cash register
	incomeParams := pg.CreateTransactionParams{
		ID:                 uuid.New(),
		Type:               pg.TransactionTypeTransferIncome,
		CashRegisterID:     pgtype.UUID{Bytes: toCR, Valid: true},
		FromCashRegisterID: pgtype.UUID{Bytes: fromCR, Valid: true}, // reference to sender
		GroupTransactionID: groupPg,
		Amount:             amount,
		Description:        req.Description,
		PayType:            payType,
		Date:               date,
		UserID:             userPg,
		BranchID:           toBranchPg, // receiver's branch (null = current branch from middleware)
	}
	if _, err := q.CreateTransaction(txCtx, incomeParams); err != nil {
		return nil, fmt.Errorf("failed to create transfer_income: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	// Return the expense (sender) side as the primary response
	return toTransactionResponse(expenseTx), nil
}

// GetTransactionByID retrieves a transaction by ID
func (s *TransactionS) GetTransactionByID(ctx context.Context, id uuid.UUID) (*model.TransactionResponse, error) {
	var tx pg.Transaction
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		tx, err = q.GetTransactionByID(ctx, id)
		if err != nil {
			return fmt.Errorf("transaction not found: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toTransactionResponse(tx), nil
}

func (s *TransactionS) GetAllTransactions(ctx context.Context, filter model.TransactionListFilter, limit, offset int32) ([]*model.TransactionResponse, int64, error) {
	if filter.SortBy == "" {
		filter.SortBy = "date"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	var cashRegisterUUID pgtype.UUID
	if filter.CashRegisterID != "" {
		id, err := uuid.Parse(filter.CashRegisterID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid cash_register_id: %w", err)
		}
		cashRegisterUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var groupTransactionUUID pgtype.UUID
	if filter.GroupTransactionID != "" {
		id, err := uuid.Parse(filter.GroupTransactionID)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid group_transaction_id: %w", err)
		}
		groupTransactionUUID = pgtype.UUID{Bytes: id, Valid: true}
	}

	var dateFrom pgtype.Timestamptz
	if filter.DateFrom != "" {
		t, err := time.Parse("2006-01-02", filter.DateFrom)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid date_from: %w", err)
		}
		dateFrom = pgtype.Timestamptz{Time: t, Valid: true}
	}

	var dateTo pgtype.Timestamptz
	if filter.DateTo != "" {
		t, err := time.Parse("2006-01-02", filter.DateTo)
		if err != nil {
			return nil, 0, fmt.Errorf("invalid date_to: %w", err)
		}
		t = t.Add(24*time.Hour - time.Second)
		dateTo = pgtype.Timestamptz{Time: t, Valid: true}
	}

	var total int64
	var rows []pg.Transaction
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		total, err = q.CountTransactions(ctx, pg.CountTransactionsParams{
			Search:             filter.Search,
			Type:               filter.Type,
			PayType:            filter.PayType,
			CashRegisterID:     cashRegisterUUID,
			GroupTransactionID: groupTransactionUUID,
			DateFrom:           dateFrom,
			DateTo:             dateTo,
		})
		if err != nil {
			return fmt.Errorf("failed to count transactions: %w", err)
		}

		rows, err = q.GetAllTransactions(ctx, pg.GetAllTransactionsParams{
			Search:             filter.Search,
			Type:               filter.Type,
			PayType:            filter.PayType,
			CashRegisterID:     cashRegisterUUID,
			GroupTransactionID: groupTransactionUUID,
			DateFrom:           dateFrom,
			DateTo:             dateTo,
			SortBy:             filter.SortBy,
			SortOrder:          filter.SortOrder,
			Limit:              limit,
			Offset:             offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get transactions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}

	resp := make([]*model.TransactionResponse, 0, len(rows))
	for _, row := range rows {
		resp = append(resp, toTransactionResponse(row))
	}

	return resp, total, nil
}

// GetTransactionsByType returns transactions filtered by type
func (s *TransactionS) GetTransactionsByType(ctx context.Context, txType string, limit, offset int32) ([]model.TransactionResponse, error) {
	var rows []pg.Transaction
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		rows, err = q.GetTransactionsByType(ctx, pg.GetTransactionsByTypeParams{
			Type:   pg.TransactionType(txType),
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get transactions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toTransactionResponses(rows), nil
}

// GetTransactionsByCashRegister returns transactions for a cash register
func (s *TransactionS) GetTransactionsByCashRegister(ctx context.Context, cashRegisterID string, limit, offset int32) ([]model.TransactionResponse, error) {
	crID, err := uuid.Parse(cashRegisterID)
	if err != nil {
		return nil, fmt.Errorf("invalid cash_register_id: %w", err)
	}

	var rows []pg.Transaction
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		rows, err = q.GetTransactionsByCashRegister(ctx, pg.GetTransactionsByCashRegisterParams{
			CashRegisterID: pgtype.UUID{Bytes: crID, Valid: true},
			Limit:          limit,
			Offset:         offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get transactions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toTransactionResponses(rows), nil
}

// GetTransactionsByDateRange returns transactions within a date range
func (s *TransactionS) GetTransactionsByDateRange(ctx context.Context, from, to time.Time, limit, offset int32) ([]model.TransactionResponse, error) {
	var rows []pg.Transaction
	err := withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		rows, err = q.GetTransactionsByDateRange(ctx, pg.GetTransactionsByDateRangeParams{
			Date:   from,
			Date_2: to,
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get transactions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toTransactionResponses(rows), nil
}

// GetTransactionsByGroup returns transactions for a group
func (s *TransactionS) GetTransactionsByGroup(ctx context.Context, groupID string, limit, offset int32) ([]model.TransactionResponse, error) {
	gid, err := uuid.Parse(groupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group_transaction_id: %w", err)
	}

	var rows []pg.Transaction
	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		rows, err = q.GetTransactionsByGroup(ctx, pg.GetTransactionsByGroupParams{
			GroupTransactionID: pgtype.UUID{Bytes: gid, Valid: true},
			Limit:              limit,
			Offset:             offset,
		})
		if err != nil {
			return fmt.Errorf("failed to get transactions: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return toTransactionResponses(rows), nil
}

// UpdateTransaction updates amount, description, pay_type, date
func (s *TransactionS) UpdateTransaction(ctx context.Context, id uuid.UUID, req model.UpdateTransactionRequest) (*model.TransactionResponse, error) {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return nil, err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	existing, err := q.GetTransactionByID(txCtx, id)
	if err != nil {
		return nil, fmt.Errorf("transaction not found: %w", err)
	}

	finalAmount := existing.Amount
	if req.Amount != nil {
		if err := finalAmount.Scan(*req.Amount); err != nil {
			return nil, fmt.Errorf("invalid amount: %w", err)
		}
	}

	finalDesc := existing.Description
	if req.Description != nil {
		finalDesc = req.Description
	}

	finalPayType := existing.PayType
	if req.PayType != nil {
		finalPayType = pg.NullPaymentType{PaymentType: pg.PaymentType(*req.PayType), Valid: true}
	}

	finalDate := existing.Date
	if req.Date != nil {
		finalDate = *req.Date
	}

	updatedTx, err := q.UpdateTransaction(txCtx, pg.UpdateTransactionParams{
		ID:          id,
		Amount:      finalAmount,
		Description: finalDesc,
		PayType:     finalPayType,
		Date:        finalDate,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return nil, fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return toTransactionResponse(updatedTx), nil
}

// DeleteTransaction soft-deletes a transaction
func (s *TransactionS) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	q, txCtx, tx, ownsTx, err := s.getTenantMutationQueries(ctx)
	if err != nil {
		return err
	}
	if ownsTx {
		defer tx.Rollback(ctx)
	}

	if err := q.DeleteTransaction(txCtx, id); err != nil {
		return fmt.Errorf("failed to delete transaction: %w", err)
	}

	if ownsTx {
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}
	}

	return nil
}

// ==================== HELPERS ====================

func toTransactionResponse(tx pg.Transaction) *model.TransactionResponse {
	resp := &model.TransactionResponse{
		ID:          tx.ID.String(),
		Type:        model.TransactionType(tx.Type),
		Amount:      numericToString(tx.Amount),
		Description: tx.Description,
		Date:        tx.Date,
	}

	if tx.CashRegisterID.Valid {
		s := uuid.UUID(tx.CashRegisterID.Bytes).String()
		resp.CashRegisterID = &s
	}
	if tx.FromCashRegisterID.Valid {
		s := uuid.UUID(tx.FromCashRegisterID.Bytes).String()
		resp.FromCashRegisterID = &s
	}
	if tx.ToCashRegisterID.Valid {
		s := uuid.UUID(tx.ToCashRegisterID.Bytes).String()
		resp.ToCashRegisterID = &s
	}
	if tx.FromBranchID.Valid {
		s := uuid.UUID(tx.FromBranchID.Bytes).String()
		resp.FromBranchID = &s
	}
	if tx.ToBranchID.Valid {
		s := uuid.UUID(tx.ToBranchID.Bytes).String()
		resp.ToBranchID = &s
	}
	if tx.GroupTransactionID.Valid {
		s := uuid.UUID(tx.GroupTransactionID.Bytes).String()
		resp.GroupTransactionID = &s
	}
	if tx.PayType.Valid {
		s := string(tx.PayType.PaymentType)
		resp.PayType = &s
	}
	if tx.UserID.Valid {
		s := uuid.UUID(tx.UserID.Bytes).String()
		resp.UserID = &s
	}
	if tx.BranchID.Valid {
		s := uuid.UUID(tx.BranchID.Bytes).String()
		resp.BranchID = &s
	}
	resp.CreatedAt = timestampToTime(tx.CreatedAt)
	resp.UpdatedAt = timestampToTime(tx.UpdatedAt)
	if tx.CustomerPaidAmount.Valid {
		s := numericToString(tx.CustomerPaidAmount)
		resp.CustomerPaidAmount = &s
	}
	if tx.ChangeAmount.Valid {
		s := numericToString(tx.ChangeAmount)
		resp.ChangeAmount = &s
	}

	return resp
}

func toTransactionResponses(rows []pg.Transaction) []model.TransactionResponse {
	out := make([]model.TransactionResponse, len(rows))
	for i, r := range rows {
		out[i] = *toTransactionResponse(r)
	}
	return out
}

// GetCashReport builds the full cash register report for the given date range.
func (s *TransactionS) GetCashReport(ctx context.Context, req model.CashReportRequest) (*model.CashReportResponse, error) {
	from, err := time.Parse(time.RFC3339, req.From)
	if err != nil {
		return nil, fmt.Errorf("invalid from date: %w", err)
	}
	to, err := time.Parse(time.RFC3339, req.To)
	if err != nil {
		return nil, fmt.Errorf("invalid to date: %w", err)
	}

	var crPg pgtype.UUID
	if req.CashRegisterID != nil && *req.CashRegisterID != "" {
		id, err := uuid.Parse(*req.CashRegisterID)
		if err != nil {
			return nil, fmt.Errorf("invalid cash_register_id: %w", err)
		}
		crPg = pgtype.UUID{Bytes: id, Valid: true}
	}

	var summaryRows []pg.GetTransactionReportSummaryRow
	var groupRows []pg.GetTransactionGroupReportRow
	var ob pg.GetTransactionOpeningBalanceRow

	err = withTenantRead(ctx, s.repo, func(ctx context.Context, q *pg.Queries) error {
		var err error
		// 1. Summary by type
		summaryRows, err = q.GetTransactionReportSummary(ctx, pg.GetTransactionReportSummaryParams{
			FromDate:       from,
			ToDate:         to,
			CashRegisterID: crPg,
		})
		if err != nil {
			return fmt.Errorf("failed to get report summary: %w", err)
		}

		// 2. Group detail (income + expense panels)
		groupRows, err = q.GetTransactionGroupReport(ctx, pg.GetTransactionGroupReportParams{
			FromDate:       from,
			ToDate:         to,
			CashRegisterID: crPg,
		})
		if err != nil {
			return fmt.Errorf("failed to get group report: %w", err)
		}

		// 3. Opening balance (all transactions before from date)
		ob, err = q.GetTransactionOpeningBalance(ctx, pg.GetTransactionOpeningBalanceParams{
			FromDate:       from,
			CashRegisterID: crPg,
		})
		if err != nil {
			return fmt.Errorf("failed to get opening balance: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	// --- Build response ---
	resp := &model.CashReportResponse{}

	// Income types and expense types for balance calculation
	incomeTypes := map[string]bool{
		"income": true, "bill_payment": true, "transfer_income": true,
	}
	expenseTypes := map[string]bool{
		"expense": true, "transfer_expense": true,
	}

	var balCash, balCard, balTotal float64

	for _, r := range summaryRows {
		cash := ifaceToFloat(r.CashTotal)
		card := ifaceToFloat(r.CardTotal)
		total := ifaceToFloat(r.Total)
		row := model.CashReportSummaryRow{
			Type:      string(r.Type),
			CashTotal: floatToStr(cash),
			CardTotal: floatToStr(card),
			Total:     floatToStr(total),
		}
		resp.Summary = append(resp.Summary, row)

		if incomeTypes[string(r.Type)] {
			balCash += cash
			balCard += card
			balTotal += total
		} else if expenseTypes[string(r.Type)] {
			balCash -= cash
			balCard -= card
			balTotal -= total
		}
	}

	resp.Balance = model.CashReportSummaryRow{
		Type:      "balance",
		CashTotal: floatToStr(balCash),
		CardTotal: floatToStr(balCard),
		Total:     floatToStr(balTotal),
	}

	// Build income/expense group panels
	for _, r := range groupRows {
		cash := ifaceToFloat(r.CashTotal)
		card := ifaceToFloat(r.CardTotal)
		total := ifaceToFloat(r.Total)
		row := model.CashReportGroupRow{
			Type:      string(r.Type),
			CashTotal: floatToStr(cash),
			CardTotal: floatToStr(card),
			Total:     floatToStr(total),
		}
		if r.GroupID.Valid {
			s := uuid.UUID(r.GroupID.Bytes).String()
			row.GroupID = &s
		}
		if r.GroupName != nil {
			row.GroupName = r.GroupName
		}

		if incomeTypes[string(r.Type)] {
			resp.IncomeGroups = append(resp.IncomeGroups, row)
		} else if expenseTypes[string(r.Type)] {
			resp.ExpenseGroups = append(resp.ExpenseGroups, row)
		}
	}

	// Day summary
	openingIncome := ifaceToFloat(ob.IncomeTotal)
	openingExpense := ifaceToFloat(ob.ExpenseTotal)
	openingBalance := openingIncome - openingExpense

	totalIncome := balCash + balCard // already split by pay_type; use total
	// Re-compute from summary for accuracy
	var totalIncomeAll, totalExpenseAll float64
	for _, r := range summaryRows {
		t := ifaceToFloat(r.Total)
		if incomeTypes[string(r.Type)] {
			totalIncomeAll += t
		} else if expenseTypes[string(r.Type)] {
			totalExpenseAll += t
		}
	}
	_ = totalIncome

	dayBalance := totalIncomeAll - totalExpenseAll
	closingBalance := openingBalance + dayBalance

	resp.OpeningBalance = floatToStr(openingBalance)
	resp.TotalIncome = floatToStr(totalIncomeAll)
	resp.TotalExpense = floatToStr(totalExpenseAll)
	resp.DayBalance = floatToStr(dayBalance)
	resp.ClosingBalance = floatToStr(closingBalance)

	return resp, nil
}

// ifaceToFloat converts the interface{} returned by sqlc for computed numeric columns.
func ifaceToFloat(v interface{}) float64 {
	if v == nil {
		return 0
	}
	switch val := v.(type) {
	case pgtype.Numeric:
		f, _ := val.Float64Value()
		return f.Float64
	case *pgtype.Numeric:
		if val == nil {
			return 0
		}
		f, _ := val.Float64Value()
		return f.Float64
	case float64:
		return val
	case float32:
		return float64(val)
	case int64:
		return float64(val)
	case int32:
		return float64(val)
	default:
		return 0
	}
}

// floatToStr formats a float64 as a decimal string with 2 decimal places,
// stripping trailing zeros (e.g. 6987434.47, not 6987434.470000).
func floatToStr(f float64) string {
	s := fmt.Sprintf("%.2f", f)
	// trim trailing zeros after decimal point
	for len(s) > 1 && s[len(s)-1] == '0' && s[len(s)-2] != '.' {
		s = s[:len(s)-1]
	}
	return s
}
