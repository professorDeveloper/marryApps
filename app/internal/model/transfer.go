package model

import "time"

// ==================== TRANSFER ====================

type TransferResponse struct {
	ID            string                 `json:"id"`
	Number        *int64                 `json:"number"`
	FromBranchID  string                 `json:"from_branch_id"`
	ToBranchID    string                 `json:"to_branch_id"`
	FromStorageID string                 `json:"from_storage_id"`
	ToStorageID   string                 `json:"to_storage_id"`
	ActGroupID    *string                `json:"act_group_id,omitempty"`
	Description   *string                `json:"description,omitempty"`
	Status        string                 `json:"status"`
	Date          *time.Time             `json:"date,omitempty"`
	TotalAmount   string                 `json:"total_amount"`
	Items         []TransferItemResponse `json:"items,omitempty"`
	CreatedAt     *time.Time             `json:"created_at,omitempty"`
	UpdatedAt     *time.Time             `json:"updated_at,omitempty"`
}

type CreateTransferRequest struct {
	FromBranchID  string  `json:"from_branch_id" validate:"required" example:"uuid"`
	ToBranchID    string  `json:"to_branch_id" validate:"required" example:"uuid"`
	FromStorageID string  `json:"from_storage_id" validate:"required" example:"uuid"`
	ToStorageID   string  `json:"to_storage_id" validate:"required" example:"uuid"`
	ActGroupID    *string `json:"act_group_id,omitempty" example:"uuid"`
	Description   *string `json:"description,omitempty"`
	Status        *string `json:"status,omitempty" example:"draft"`
}

type UpdateTransferRequest struct {
	FromBranchID  *string `json:"from_branch_id,omitempty"`
	ToBranchID    *string `json:"to_branch_id,omitempty"`
	FromStorageID *string `json:"from_storage_id,omitempty"`
	ToStorageID   *string `json:"to_storage_id,omitempty"`
	ActGroupID    *string `json:"act_group_id,omitempty"`
	Description   *string `json:"description,omitempty"`
}

// ==================== TRANSFER ITEMS ====================

type TransferItemResponse struct {
	ID             string     `json:"id"`
	TransferID     string     `json:"transfer_id"`
	IngredientID   string     `json:"ingredient_id"`
	Quantity       string     `json:"quantity"`
	StockQtyBefore string     `json:"stock_qty_before"`
	StockQtyAfter  string     `json:"stock_qty_after"`
	Price          string     `json:"price"`
	TotalAmount    string     `json:"total_amount"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
}

type CreateTransferItemEntry struct {
	IngredientID string `json:"ingredient_id" validate:"required" example:"uuid"`
	Quantity     string `json:"quantity" validate:"required" example:"5"`
}

type CreateTransferItemsRequest struct {
	TransferID string                    `json:"transfer_id" validate:"required" example:"uuid"`
	Items      []CreateTransferItemEntry `json:"items" validate:"required,min=1"`
}

type UpsertTransferItemsRequest struct {
	// Optional transfer-level fields (update header + items in one call)
	Date          *string `json:"date,omitempty" example:"2024-01-01"`
	FromStorageID *string `json:"from_storage_id,omitempty" example:"uuid"`
	ToStorageID   *string `json:"to_storage_id,omitempty" example:"uuid"`
	ActGroupID    *string `json:"act_group_id,omitempty" example:"uuid"`
	Description   *string `json:"description,omitempty"`
	Status        *string `json:"status,omitempty" example:"active"`
	Items         []CreateTransferItemEntry `json:"items" validate:"required,min=1"`
}

// ==================== BATCH ====================

type CreateTransferBatchRequest struct {
	FromBranchID  string                    `json:"from_branch_id" validate:"required" example:"uuid"`
	ToBranchID    string                    `json:"to_branch_id" validate:"required" example:"uuid"`
	FromStorageID string                    `json:"from_storage_id" validate:"required" example:"uuid"`
	ToStorageID   string                    `json:"to_storage_id" validate:"required" example:"uuid"`
	ActGroupID    *string                   `json:"act_group_id,omitempty"`
	Description   *string                   `json:"description,omitempty"`
	Status        *string                   `json:"status,omitempty" example:"draft"`
	Items         []CreateTransferItemEntry `json:"items" validate:"required,min=1"`
}

type DeleteTransfersBatchRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

// ==================== FILTERS / PAGINATION ====================

type TransferFilter struct {
	DateFrom      *string
	DateTo        *string
	Status        *string
	FromStorageID *string
	ToStorageID   *string
	ActGroupID    *string
	IngredientID  *string
}

type PaginatedTransfersResponse struct {
	Data        []*TransferResponse `json:"data"`
	Pagination  PaginationMeta      `json:"pagination"`
	TotalAmount string              `json:"total_amount"`
}
