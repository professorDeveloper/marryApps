package model

import "time"

// TransactionType represents the type of transaction
type TransactionType string

const (
	TransactionTypeIncome         TransactionType = "income"
	TransactionTypeExpense        TransactionType = "expense"
	TransactionTypeTransferIncome  TransactionType = "transfer_income"
	TransactionTypeTransferExpense TransactionType = "transfer_expense"
	TransactionTypeBillPayment    TransactionType = "bill_payment"
)

// CreateIncomeExpenseRequest is used for income and expense transactions
type CreateIncomeExpenseRequest struct {
	Type              TransactionType `json:"type" validate:"required,oneof=income expense" example:"income"`
	CashRegisterID    string          `json:"cash_register_id" validate:"required" example:"uuid"`
	GroupTransactionID *string        `json:"group_transaction_id,omitempty" example:"uuid"`
	Amount            string          `json:"amount" validate:"required" example:"150000"`
	Description       *string         `json:"description,omitempty" example:"Salary payment"`
	PayType           *string         `json:"pay_type,omitempty" example:"cash"`
	Date              *time.Time      `json:"date,omitempty" example:"2026-02-20T09:00:00Z"`
}

// CreateCashTransferRequest is used for transfer between cash registers
type CreateCashTransferRequest struct {
	FromCashRegisterID string  `json:"from_cash_register_id" validate:"required" example:"uuid"`
	ToCashRegisterID   string  `json:"to_cash_register_id" validate:"required" example:"uuid"`
	// Optional: cross-branch transfer. If omitted, uses current branch for both.
	FromBranchID       *string `json:"from_branch_id,omitempty" example:"uuid"`
	ToBranchID         *string `json:"to_branch_id,omitempty" example:"uuid"`
	GroupTransactionID *string `json:"group_transaction_id,omitempty" example:"uuid"`
	Amount             string  `json:"amount" validate:"required" example:"50000"`
	Description        *string `json:"description,omitempty" example:"Branch cash transfer"`
	PayType            *string `json:"pay_type,omitempty" example:"cash"`
	Date               *time.Time `json:"date,omitempty" example:"2026-02-20T09:00:00Z"`
}

// UpdateTransactionRequest for updating amount/description/pay_type/date
type UpdateTransactionRequest struct {
	Amount      *string    `json:"amount,omitempty" example:"200000"`
	Description *string    `json:"description,omitempty" example:"Updated description"`
	PayType     *string    `json:"pay_type,omitempty" example:"card"`
	Date        *time.Time `json:"date,omitempty"`
}

// ==================== CASH REPORT MODELS ====================

// CashReportRequest are the query params for the cash report endpoint.
type CashReportRequest struct {
	From           string  `query:"from"             validate:"required" example:"2026-02-01T00:00:00Z"`
	To             string  `query:"to"               validate:"required" example:"2026-02-20T23:59:59Z"`
	CashRegisterID *string `query:"cash_register_id"                   example:"uuid"`
}

// CashReportSummaryRow is one row of the top summary table (per transaction type).
type CashReportSummaryRow struct {
	Type      string `json:"type"`
	CashTotal string `json:"cash_total"`
	CardTotal string `json:"card_total"`
	Total     string `json:"total"`
}

// CashReportGroupRow is one row in the income or expense detail panel (per group).
type CashReportGroupRow struct {
	GroupID   *string `json:"group_id,omitempty"`
	GroupName *string `json:"group_name,omitempty"`
	Type      string  `json:"type"`
	CashTotal string  `json:"cash_total"`
	CardTotal string  `json:"card_total"`
	Total     string  `json:"total"`
}

// CashReportResponse is the full cash report response.
type CashReportResponse struct {
	// Summary table: one row per transaction type
	Summary []CashReportSummaryRow `json:"summary"`
	// Balance row: (income types) − (expense types)
	Balance CashReportSummaryRow `json:"balance"`
	// Income detail panel: grouped by category
	IncomeGroups []CashReportGroupRow `json:"income_groups"`
	// Expense detail panel: grouped by category
	ExpenseGroups []CashReportGroupRow `json:"expense_groups"`
	// Day summary
	OpeningBalance string `json:"opening_balance"`
	TotalIncome    string `json:"total_income"`
	TotalExpense   string `json:"total_expense"`
	DayBalance     string `json:"day_balance"`
	ClosingBalance string `json:"closing_balance"`
}

// TransactionResponse is the API response for a transaction
type TransactionResponse struct {
	ID                 string          `json:"id"`
	Type               TransactionType `json:"type"`
	// income/expense
	CashRegisterID     *string         `json:"cash_register_id,omitempty"`
	// transfer
	FromCashRegisterID *string         `json:"from_cash_register_id,omitempty"`
	ToCashRegisterID   *string         `json:"to_cash_register_id,omitempty"`
	FromBranchID       *string         `json:"from_branch_id,omitempty"`
	ToBranchID         *string         `json:"to_branch_id,omitempty"`
	// common
	GroupTransactionID *string         `json:"group_transaction_id,omitempty"`
	Amount             string          `json:"amount"`
	Description        *string         `json:"description,omitempty"`
	PayType            *string         `json:"pay_type,omitempty"`
	Date               time.Time       `json:"date"`
	UserID             *string         `json:"user_id,omitempty"`
	BranchID           *string         `json:"branch_id,omitempty"`
	CreatedAt          *time.Time      `json:"created_at,omitempty"`
	UpdatedAt          *time.Time      `json:"updated_at,omitempty"`
	CustomerPaidAmount *string         `json:"customer_paid_amount,omitempty"`
	ChangeAmount       *string         `json:"change_amount,omitempty"`
}
