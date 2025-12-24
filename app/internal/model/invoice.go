package model

import "time"

type InvoiceStatus string

const (
	InvoiceStatusPending  InvoiceStatus = "pending"
	InvoiceStatusArrived  InvoiceStatus = "arrived"
	InvoiceStatusReceived InvoiceStatus = "received"
)

// Invoice represents an invoice
type Invoice struct {
	ID            string        `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	SupplierName  string        `json:"supplier_name" example:"ABC Supplier"`
	SupplierPhone *string       `json:"supplier_phone,omitempty" example:"998901234567"`
	SupplierEmail *string       `json:"supplier_email,omitempty" example:"supplier@example.com"`
	TotalAmount   string        `json:"total_amount" example:"1000000"`
	Status        InvoiceStatus `json:"status" example:"pending"`
	Date          *time.Time    `json:"date,omitempty"`
	CreatedAt     *time.Time    `json:"created_at,omitempty"`
	UpdatedAt     *time.Time    `json:"updated_at,omitempty"`
}

// CreateInvoiceRequest is the request to create an invoice
type CreateInvoiceRequest struct {
	SupplierName  string  `json:"supplier_name" validate:"required" example:"ABC Supplier"`
	SupplierPhone *string `json:"supplier_phone,omitempty" example:"998901234567"`
	SupplierEmail *string `json:"supplier_email,omitempty" example:"supplier@example.com"`
	TotalAmount   string  `json:"total_amount" validate:"required" example:"1000000"`
	Status        string  `json:"status" example:"pending"`
	Date          *string `json:"date,omitempty" example:"2024-01-01T00:00:00Z"`
}

// UpdateInvoiceRequest is the request to update an invoice
type UpdateInvoiceRequest struct {
	SupplierName  *string `json:"supplier_name,omitempty" example:"ABC Supplier"`
	SupplierPhone *string `json:"supplier_phone,omitempty" example:"998901234567"`
	SupplierEmail *string `json:"supplier_email,omitempty" example:"supplier@example.com"`
	TotalAmount   *string `json:"total_amount,omitempty" example:"1000000"`
	Status        *string `json:"status,omitempty" example:"pending"`
	Date          *string `json:"date,omitempty" example:"2024-01-01T00:00:00Z"`
}

// UpdateInvoiceStatusRequest is the request to update invoice status
type UpdateInvoiceStatusRequest struct {
	Status string `json:"status" validate:"required" example:"arrived"`
}

// InvoiceResponse is the response model for invoice
type InvoiceResponse struct {
	ID            string        `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	SupplierName  string        `json:"supplier_name" example:"ABC Supplier"`
	SupplierPhone *string       `json:"supplier_phone,omitempty" example:"998901234567"`
	SupplierEmail *string       `json:"supplier_email,omitempty" example:"supplier@example.com"`
	TotalAmount   string        `json:"total_amount" example:"1000000"`
	Status        InvoiceStatus `json:"status" example:"pending"`
	Date          *time.Time    `json:"date,omitempty"`
	CreatedAt     *time.Time    `json:"created_at,omitempty"`
	UpdatedAt     *time.Time    `json:"updated_at,omitempty"`
}

// InvoiceWithDetailsResponse includes invoice and details count
type InvoiceWithDetailsResponse struct {
	ID            string        `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	SupplierName  string        `json:"supplier_name" example:"ABC Supplier"`
	SupplierPhone *string       `json:"supplier_phone,omitempty" example:"998901234567"`
	SupplierEmail *string       `json:"supplier_email,omitempty" example:"supplier@example.com"`
	TotalAmount   string        `json:"total_amount" example:"1000000"`
	Status        InvoiceStatus `json:"status" example:"pending"`
	Date          *time.Time    `json:"date,omitempty"`
	CreatedAt     *time.Time    `json:"created_at,omitempty"`
	UpdatedAt     *time.Time    `json:"updated_at,omitempty"`
	ItemCount     int64         `json:"item_count" example:"5"`
	TotalQuantity int64         `json:"total_quantity" example:"100"`
}

// InvoiceDetail represents a line item in an invoice
type InvoiceDetail struct {
	ID           string     `json:"id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	InvoiceID    string     `json:"invoice_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID string     `json:"ingredient_id" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     int64      `json:"quantity" example:"50"`
	Price        string     `json:"price" example:"500000"`
	PricePerUnit string     `json:"price_per_unit" example:"10000"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

// CreateInvoiceDetailRequest is the request to create an invoice detail
type CreateInvoiceDetailRequest struct {
	InvoiceID    string `json:"invoice_id" validate:"required" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID string `json:"ingredient_id" validate:"required" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     int64  `json:"quantity" validate:"required" example:"50"`
	Price        string `json:"price" validate:"required" example:"500000"`
	PricePerUnit string `json:"price_per_unit" validate:"required" example:"10000"`
}

// UpdateInvoiceDetailRequest is the request to update an invoice detail
type UpdateInvoiceDetailRequest struct {
	IngredientID *string `json:"ingredient_id,omitempty" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     *int64  `json:"quantity,omitempty" example:"50"`
	Price        *string `json:"price,omitempty" example:"500000"`
	PricePerUnit *string `json:"price_per_unit,omitempty" example:"10000"`
}

// UpdateInvoiceDetailQuantityRequest is the request to update invoice detail quantity
type UpdateInvoiceDetailQuantityRequest struct {
	Quantity int64 `json:"quantity" validate:"required" example:"50"`
}

// InvoiceDetailResponse is the response model for invoice detail
type InvoiceDetailResponse struct {
	ID           string     `json:"id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	InvoiceID    string     `json:"invoice_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID string     `json:"ingredient_id" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity     int64      `json:"quantity" example:"50"`
	Price        string     `json:"price" example:"500000"`
	PricePerUnit string     `json:"price_per_unit" example:"10000"`
	CreatedAt    *time.Time `json:"created_at,omitempty"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

// InvoiceDetailWithIngredientResponse includes ingredient information
type InvoiceDetailWithIngredientResponse struct {
	ID                string     `json:"id" example:"d1f29b75-8g6d-5536-0525-2c12deeef0e0"`
	InvoiceID         string     `json:"invoice_id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	IngredientID      string     `json:"ingredient_id" example:"e2g30c86-9h7e-6647-1636-3d23effg1f1"`
	Quantity          int64      `json:"quantity" example:"50"`
	Price             string     `json:"price" example:"500000"`
	PricePerUnit      string     `json:"price_per_unit" example:"10000"`
	CreatedAt         *time.Time `json:"created_at,omitempty"`
	UpdatedAt         *time.Time `json:"updated_at,omitempty"`
	IngredientName    *string    `json:"ingredient_name,omitempty" example:"Tomato"`
	IngredientMeasure *string    `json:"ingredient_measurement,omitempty" example:"kg"`
	IngredientPicture *string    `json:"ingredient_picture,omitempty" example:"http://example.com/tomato.jpg"`
}

// InvoiceStatsBySupplierResponse represents supplier statistics
type InvoiceStatsBySupplierResponse struct {
	SupplierName     string     `json:"supplier_name" example:"ABC Supplier"`
	InvoiceCount     int64      `json:"invoice_count" example:"10"`
	TotalSpent       string     `json:"total_spent" example:"10000000"`
	AvgInvoiceAmount string     `json:"avg_invoice_amount" example:"1000000"`
	LastOrderDate    *time.Time `json:"last_order_date,omitempty"`
}

// InvoiceStatsByDateRangeResponse represents invoice statistics for a date range
type InvoiceStatsByDateRangeResponse struct {
	InvoiceCount     int64  `json:"invoice_count" example:"50"`
	TotalSpent       string `json:"total_spent" example:"50000000"`
	AvgInvoiceAmount string `json:"avg_invoice_amount" example:"1000000"`
	PendingCount     int64  `json:"pending_count" example:"10"`
	ArrivedCount     int64  `json:"arrived_count" example:"15"`
	ReceivedCount    int64  `json:"received_count" example:"20"`
	CancelledCount   int64  `json:"cancelled_count" example:"5"`
}
