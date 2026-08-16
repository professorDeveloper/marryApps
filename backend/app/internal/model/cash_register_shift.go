package model

import "time"

// OpenCashRegisterShiftRequest represents the request to open a new cash register shift.
type OpenCashRegisterShiftRequest struct {
	CashRegisterID string  `json:"cash_register_id" validate:"required" example:"uuid"`
	CashierID      string  `json:"cashier_id"       validate:"required" example:"uuid"`
	OpeningCash    string  `json:"opening_cash"     validate:"required" example:"0.00"`
	OpeningCard    *string `json:"opening_card"     example:"0.00"`
}

// CloseCashRegisterShiftRequest represents the request to close a cash register shift.
type CloseCashRegisterShiftRequest struct {
	ClosingCash string  `json:"closing_cash" validate:"required" example:"5000.00"`
	ClosingCard *string `json:"closing_card" example:"3000.00"`
	Notes       *string `json:"notes"        example:"End of day shift"`
}

// CashRegisterShiftResponse represents a cash register shift in API responses.
type CashRegisterShiftResponse struct {
	ID             string     `json:"id"`
	CashRegisterID string     `json:"cash_register_id"`
	CashierID      string     `json:"cashier_id"`
	BranchID       string     `json:"branch_id"`
	OpenedAt       time.Time  `json:"opened_at"`
	ClosedAt       *time.Time `json:"closed_at,omitempty"`
	OpeningCash    string     `json:"opening_cash"`
	OpeningCard    *string    `json:"opening_card,omitempty"`
	ClosingCash    *string    `json:"closing_cash,omitempty"`
	ClosingCard    *string    `json:"closing_card,omitempty"`
	Notes          *string    `json:"notes,omitempty"`
	Status         string     `json:"status"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
}
