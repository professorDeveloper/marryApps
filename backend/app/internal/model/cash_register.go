package model

import "time"

type CashRegisterRequest struct {
	Name string `json:"name" validate:"required,min=1,max=255" example:"Register #1"`
}

type CashRegisterResponse struct {
	ID        string    `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name      string    `json:"name" example:"Register #1"`
	BranchID  string    `json:"branch_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt time.Time `json:"created_at" example:"2021-01-01T00:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2021-01-01T00:00:00Z"`
}
