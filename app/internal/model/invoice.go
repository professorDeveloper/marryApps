package model

import "time"

type InvoiceFilter struct {
	DateFrom     *string // "2024-01-01" or RFC3339
	DateTo       *string
	StorageID    string
	SupplierID   string
	IngredientID string
	Status       string
}

type InvoiceStatus string

const (
	InvoiceStatusPending  InvoiceStatus = "pending"
	InvoiceStatusArrived  InvoiceStatus = "arrived"
	InvoiceStatusReceived InvoiceStatus = "received"
)

type Invoice struct {
	ID          string        `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	SupplierID  string        `json:"supplier_id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	StorageID   *string       `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	TotalAmount string        `json:"total_amount" example:"1000000"`
	Status      InvoiceStatus `json:"status" example:"pending"`
	Date        *time.Time    `json:"date,omitempty"`
	CreatedAt   *time.Time    `json:"created_at,omitempty"`
	UpdatedAt   *time.Time    `json:"updated_at,omitempty"`
}

type CreateInvoiceRequest struct {
	SupplierID  string  `json:"supplier_id" validate:"required" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	StorageID   *string `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	TotalAmount string  `json:"total_amount" validate:"required" example:"1000000"`
	Status      string  `json:"status" example:"pending"`
	Date        *string `json:"date,omitempty" example:"2024-01-01T00:00:00Z"`
}

type UpdateInvoiceRequest struct {
	SupplierID  *string `json:"supplier_id,omitempty" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	StorageID   *string `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	TotalAmount *string `json:"total_amount,omitempty" example:"1000000"`
	Status      *string `json:"status,omitempty" example:"pending"`
	Date        *string `json:"date,omitempty" example:"2024-01-01T00:00:00Z"`
}

type UpdateInvoiceStatusRequest struct {
	Status string `json:"status" validate:"required" example:"arrived"`
}

// CreateInvoiceWithDetailsRequest creates an invoice with all its detail items in one atomic transaction
// First creates the invoice, then creates all invoice_detailed records using the invoice ID
// If any detail fails, the entire transaction is rolled back
type CreateInvoiceWithDetailsRequest struct {
	// Invoice - the invoice header to create
	Invoice CreateInvoiceRequest `json:"invoice" validate:"required"`

	// Details - array of invoice detail items to create
	Details []CreateInvoiceDetailRequest `json:"details" validate:"required,min=1,dive"`
}

// CreateInvoiceWithDetailsResponse - response containing created invoice and all its details
type CreateInvoiceWithDetailsResponse struct {
	Invoice InvoiceResponse            `json:"invoice"`
	Details []InvoiceDetailResponse    `json:"details"`
	Summary InvoiceDetailsBatchSummary `json:"summary"`
}

// InvoiceDetailsBatchSummary - summary of batch operation
type InvoiceDetailsBatchSummary struct {
	TotalDetails int    `json:"total_details" example:"5"`
	CreatedCount int    `json:"created_count" example:"5"`
	TotalAmount  string `json:"total_amount" example:"500000"`
}

type InvoiceResponse struct {
	ID          string        `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	SupplierID  string        `json:"supplier_id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	StorageID   *string       `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	TotalAmount string        `json:"total_amount" example:"1000000"`
	Status      InvoiceStatus `json:"status" example:"pending"`
	Date        *time.Time    `json:"date,omitempty"`
	CreatedAt   *time.Time    `json:"created_at,omitempty"`
	UpdatedAt   *time.Time    `json:"updated_at,omitempty"`
}

type InvoiceGetWithDetailsResponse struct {
	ID            string        `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	SupplierID    string        `json:"supplier_id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	StorageID     *string       `json:"storage_id,omitempty" example:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
	TotalAmount   string        `json:"total_amount" example:"1000000"`
	Status        InvoiceStatus `json:"status" example:"pending"`
	Date          *time.Time    `json:"date,omitempty"`
	CreatedAt     *time.Time    `json:"created_at,omitempty"`
	UpdatedAt     *time.Time    `json:"updated_at,omitempty"`
	ItemCount     int64         `json:"item_count" example:"5"`
	TotalQuantity string        `json:"total_quantity" example:"100"`
}

type InvoiceDetail struct {
	ID           string     `json:"id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	InvoiceID    string     `json:"invoice_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID string     `json:"ingredient_id" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     string     `json:"quantity" example:"50"`
	Price        string     `json:"price" example:"500000"`
	PricePerUnit string     `json:"price_per_unit" example:"10000"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

type CreateInvoiceDetailRequest struct {
	InvoiceID    string `json:"invoice_id" validate:"required" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID string `json:"ingredient_id" validate:"required" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     string `json:"quantity" validate:"required" example:"50"`
	Price        string `json:"price" validate:"required" example:"500000"`
	PricePerUnit string `json:"price_per_unit" validate:"required" example:"10000"`
}

type CreateInvoiceDetailBatchRequest struct {
	Details []CreateInvoiceDetailRequest `json:"details" validate:"required,min=1,dive" example:"[{\"invoice_id\":\"c0f18a64-7f5c-4425-9414-1b01cddee9d9\",\"ingredient_id\":\"e2g30c86-9h7e-6647-1636-3d23effg1f1\",\"quantity\":50,\"price\":\"500000\",\"price_per_unit\":\"10000\"}]"`
}

type InvoiceDetailBatchResponse struct {
	Success int                     `json:"success" example:"2"`
	Failed  int                     `json:"failed" example:"0"`
	Details []InvoiceDetailResponse `json:"details"`
	Errors  []string                `json:"errors,omitempty"`
}

type UpdateInvoiceDetailRequest struct {
	IngredientID *string `json:"ingredient_id,omitempty" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     *string `json:"quantity,omitempty" example:"50"`
	Price        *string `json:"price,omitempty" example:"500000"`
	PricePerUnit *string `json:"price_per_unit,omitempty" example:"10000"`
}

type UpdateInvoiceDetailQuantityRequest struct {
	Quantity string `json:"quantity" validate:"required" example:"50"`
}

type InvoiceDetailResponse struct {
	ID           string     `json:"id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	InvoiceID    string     `json:"invoice_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID string     `json:"ingredient_id" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     string     `json:"quantity" example:"50"`
	Price        string     `json:"price" example:"500000"`
	PricePerUnit string     `json:"price_per_unit" example:"10000"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

type InvoiceDetailWithIngredientResponse struct {
	ID                string     `json:"id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	InvoiceID         string     `json:"invoice_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID      string     `json:"ingredient_id" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity          string     `json:"quantity" example:"50"`
	Price             string     `json:"price" example:"500000"`
	PricePerUnit      string     `json:"price_per_unit" example:"10000"`
	CreatedAt         *time.Time `json:"created_at,omitempty"`
	UpdatedAt         *time.Time `json:"updated_at,omitempty"`
	IngredientName    *string    `json:"ingredient_name,omitempty" example:"Tomato"`
	IngredientMeasure *string    `json:"ingredient_measurement,omitempty" example:"kg"`
	IngredientPicture *string    `json:"ingredient_picture,omitempty" example:"http://example.com/tomato.jpg"`
}

type UpsertInvoiceDetailEntry struct {
	IngredientID string `json:"ingredient_id" validate:"required" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     string `json:"quantity" validate:"required" example:"50"`
	Price        string `json:"price" validate:"required" example:"500000"`
	PricePerUnit string `json:"price_per_unit" validate:"required" example:"10000"`
}

type UpsertInvoiceDetailsRequest struct {
	Details []UpsertInvoiceDetailEntry `json:"details" validate:"required,min=1,dive"`
}

type UpsertInvoiceDetailsResponse struct {
	Success int                     `json:"success" example:"2"`
	Details []InvoiceDetailResponse `json:"details"`
}

type InvoiceStatsBySupplierResponse struct {
	SupplierName     string     `json:"supplier_name" example:"ABC Supplier"`
	InvoiceCount     int64      `json:"invoice_count" example:"10"`
	TotalSpent       string     `json:"total_spent" example:"10000000"`
	AvgInvoiceAmount string     `json:"avg_invoice_amount" example:"1000000"`
	LastOrderDate    *time.Time `json:"last_order_date,omitempty"`
}

type InvoiceStatsByDateRangeResponse struct {
	InvoiceCount     int64  `json:"invoice_count" example:"50"`
	TotalSpent       string `json:"total_spent" example:"50000000"`
	AvgInvoiceAmount string `json:"avg_invoice_amount" example:"1000000"`
	PendingCount     int64  `json:"pending_count" example:"10"`
	ArrivedCount     int64  `json:"arrived_count" example:"15"`
	ReceivedCount    int64  `json:"received_count" example:"20"`
	CancelledCount   int64  `json:"cancelled_count" example:"5"`
}
