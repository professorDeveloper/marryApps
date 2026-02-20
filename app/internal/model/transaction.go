package model

import "time"

// TransactionType represents the type of transaction
type TransactionType string

const (
	TransactionTypeIncome      TransactionType = "income"
	TransactionTypeExpense     TransactionType = "expense"
	TransactionTypeTransfer    TransactionType = "transfer"
	TransactionTypeBillPayment TransactionType = "bill_payment"
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
}
