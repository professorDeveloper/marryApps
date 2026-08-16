package model

import "time"

type ShipmentStatus string

const (
	ShipmentStatusDraft     ShipmentStatus = "draft"
	ShipmentStatusActive    ShipmentStatus = "active"
	ShipmentStatusCancelled ShipmentStatus = "cancelled"
)

// ShipmentResponse represents a shipment (outgoing stock removal)
type ShipmentResponse struct {
	ID          string         `json:"id"`
	Number      int32          `json:"number"`
	Date        *time.Time     `json:"date,omitempty"`
	StorageID   *string        `json:"storage_id,omitempty"`
	SupplierID  *string        `json:"supplier_id,omitempty"`
	BranchID    *string        `json:"branch_id,omitempty"`
	Description *string        `json:"description,omitempty"`
	Status      ShipmentStatus `json:"status"`
	TotalAmount string         `json:"total_amount"`
	PaidAmount  string         `json:"paid_amount"`
	CreatedAt   *time.Time     `json:"created_at,omitempty"`
	UpdatedAt   *time.Time     `json:"updated_at,omitempty"`
}

type ShipmentItemResponse struct {
	ID           string     `json:"id"`
	ShipmentID   string     `json:"shipment_id"`
	IngredientID string     `json:"ingredient_id"`
	Quantity     string     `json:"quantity"`
	PricePerUnit string     `json:"price_per_unit"`
	TotalAmount  string     `json:"total_amount"`
	StockBefore  string     `json:"stock_before"`
	StockAfter   string     `json:"stock_after"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

// CreateShipmentRequest creates a shipment header
type CreateShipmentRequest struct {
	Date        *string `json:"date,omitempty" example:"2026-01-24T00:00:00Z"`
	StorageID   *string `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	SupplierID  *string `json:"supplier_id,omitempty" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description *string `json:"description,omitempty" example:"Expired goods return"`
	Status      *string `json:"status,omitempty" example:"draft"`
}

// UpdateShipmentRequest updates a shipment header and/or status
type UpdateShipmentRequest struct {
	Date        *string `json:"date,omitempty" example:"2026-01-24T00:00:00Z"`
	StorageID   *string `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	SupplierID  *string `json:"supplier_id,omitempty" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	Description *string `json:"description,omitempty" example:"Expired goods return"`
	Status      *string `json:"status,omitempty" example:"active"`
}

// UpsertShipmentItemRequest adds or updates an ingredient item in a shipment
type UpsertShipmentItemRequest struct {
	IngredientID string `json:"ingredient_id" validate:"required" example:"b2c3d4e5-f6a7-8901-bcde-f01234567890"`
	Quantity     string `json:"quantity" validate:"required" example:"5.5"`
}

// UpsertShipmentItemsRequest adds/updates multiple items in one call
type UpsertShipmentItemsRequest struct {
	Items []UpsertShipmentItemRequest `json:"items" validate:"required,min=1"`
}

// ShipmentWithItemsResponse full shipment with its items and stock snapshots
type ShipmentWithItemsResponse struct {
	Shipment ShipmentResponse       `json:"shipment"`
	Items    []ShipmentItemResponse `json:"items"`
}

// CreateShipmentBatchRequest creates a shipment with items in one call
type CreateShipmentBatchRequest struct {
	Date        *string                     `json:"date,omitempty" example:"2026-01-24T00:00:00Z"`
	StorageID   *string                     `json:"storage_id,omitempty"`
	SupplierID  *string                     `json:"supplier_id,omitempty"`
	Description *string                     `json:"description,omitempty"`
	Status      *string                     `json:"status,omitempty" example:"draft"`
	Items       []UpsertShipmentItemRequest `json:"items" validate:"required,min=1"`
}

// UpdateShipmentBatchRequest updates a shipment header and replaces its items in one call
type UpdateShipmentBatchRequest struct {
	Date        *string                     `json:"date,omitempty" example:"2026-01-24T00:00:00Z"`
	StorageID   *string                     `json:"storage_id,omitempty"`
	SupplierID  *string                     `json:"supplier_id,omitempty"`
	Description *string                     `json:"description,omitempty"`
	Items       []UpsertShipmentItemRequest `json:"items" validate:"required,min=1"`
}
