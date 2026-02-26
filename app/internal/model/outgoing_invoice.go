package model

import "time"

type OutgoingInvoiceStatus string

const (
	OutgoingInvoiceStatusActive    OutgoingInvoiceStatus = "active"
	OutgoingInvoiceStatusCancelled OutgoingInvoiceStatus = "cancelled"
)

type OutgoingInvoiceResponse struct {
	ID          string                `json:"id"`
	Number      int32                 `json:"number"`
	Date        *time.Time            `json:"date,omitempty"`
	StorageID   *string               `json:"storage_id,omitempty"`
	GroupID     *string               `json:"group_id,omitempty"`
	BranchID    *string               `json:"branch_id,omitempty"`
	Description *string               `json:"description,omitempty"`
	Status      OutgoingInvoiceStatus `json:"status"`
	TotalAmount string                `json:"total_amount"`
	CreatedAt   *time.Time            `json:"created_at,omitempty"`
	UpdatedAt   *time.Time            `json:"updated_at,omitempty"`
}

type OutgoingInvoiceItemResponse struct {
	ID                string     `json:"id"`
	OutgoingInvoiceID string     `json:"outgoing_invoice_id"`
	IngredientID      string     `json:"ingredient_id"`
	Quantity          string     `json:"quantity"`
	PricePerUnit      string     `json:"price_per_unit"`
	TotalAmount       string     `json:"total_amount"`
	StockBefore       string     `json:"stock_before"`
	StockAfter        string     `json:"stock_after"`
	CreatedAt         *time.Time `json:"created_at,omitempty"`
	UpdatedAt         *time.Time `json:"updated_at,omitempty"`
}

type OutgoingInvoiceWithItemsResponse struct {
	Invoice OutgoingInvoiceResponse       `json:"invoice"`
	Items   []OutgoingInvoiceItemResponse `json:"items"`
}

type OutgoingInvoiceListResponse struct {
	Data     []*OutgoingInvoiceResponse `json:"data"`
	Total    int64                      `json:"total"`
	TotalSum string                     `json:"total_sum"`
	Limit    int32                      `json:"limit"`
	Offset   int32                      `json:"offset"`
}

// CreateOutgoingInvoiceRequest creates an outgoing invoice header
type CreateOutgoingInvoiceRequest struct {
	Date        *string `json:"date,omitempty"        example:"2026-02-26T00:00:00Z"`
	StorageID   *string `json:"storage_id,omitempty"  example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	GroupID     *string `json:"group_id,omitempty"    example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description *string `json:"description,omitempty" example:"Monthly write-off"`
}

// UpdateOutgoingInvoiceRequest updates an active invoice header
type UpdateOutgoingInvoiceRequest struct {
	Date        *string `json:"date,omitempty"        example:"2026-02-26T00:00:00Z"`
	StorageID   *string `json:"storage_id,omitempty"  example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	GroupID     *string `json:"group_id,omitempty"    example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description *string `json:"description,omitempty" example:"Monthly write-off"`
}

// UpsertOutgoingInvoiceItemRequest adds or updates an ingredient item
type UpsertOutgoingInvoiceItemRequest struct {
	IngredientID string `json:"ingredient_id" validate:"required" example:"b2c3d4e5-f6a7-8901-bcde-f01234567890"`
	Quantity     string `json:"quantity"      validate:"required" example:"5.5"`
}

// UpsertOutgoingInvoiceItemsRequest adds/updates multiple items in one call
type UpsertOutgoingInvoiceItemsRequest struct {
	Items []UpsertOutgoingInvoiceItemRequest `json:"items" validate:"required,min=1"`
}

// CreateOutgoingInvoiceBatchRequest creates an invoice with items in one call
type CreateOutgoingInvoiceBatchRequest struct {
	Date        *string                             `json:"date,omitempty"`
	StorageID   *string                             `json:"storage_id,omitempty"`
	GroupID     *string                             `json:"group_id,omitempty"`
	Description *string                             `json:"description,omitempty"`
	Items       []UpsertOutgoingInvoiceItemRequest  `json:"items" validate:"required,min=1"`
}
