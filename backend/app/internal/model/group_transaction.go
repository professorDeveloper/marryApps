package model

import "time"

type CreateGroupTransactionRequest struct {
	Name string `json:"name" validate:"required" example:"Group A"`
}

type UpdateGroupTransactionRequest struct {
	Name *string `json:"name,omitempty" example:"Group A"`
}

type GroupTransactionResponse struct {
	ID        string     `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Name      string     `json:"name" example:"Group A"`
	BranchID  *string    `json:"branch_id,omitempty" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
	IsDeleted bool       `json:"is_deleted"`
}

type GroupTransactionListFilter struct {
	Search    string `json:"search,omitempty"`
	SortBy    string `json:"sort_by,omitempty"`
	SortOrder string `json:"sort_order,omitempty"`
}

type PaginatedGroupTransactionsResponse struct {
	Status     string                     `json:"status" example:"success"`
	Message    string                     `json:"message" example:"Group transactions retrieved successfully"`
	Data       []GroupTransactionResponse `json:"data"`
	Pagination PaginationMeta             `json:"pagination"`
	Code       int                        `json:"code" example:"200"`
}
