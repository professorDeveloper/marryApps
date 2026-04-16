package model

import "time"

type Supplier struct {
	ID          string     `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Name        string     `json:"name" example:"ABC Supplier"`
	PhoneNumber *string    `json:"phone_number,omitempty" example:"998901234567"`
	Location    *string    `json:"location,omitempty" example:"Tashkent, Uzbekistan"`
	CreatedAt   *time.Time `json:"created_at,omitempty"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
}

type CreateSupplierRequest struct {
	Name        string  `json:"name" validate:"required" example:"ABC Supplier"`
	PhoneNumber *string `json:"phone_number,omitempty" example:"998901234567"`
	Location    *string `json:"location,omitempty" example:"Tashkent, Uzbekistan"`
}

type UpdateSupplierRequest struct {
	Name        *string `json:"name,omitempty" example:"ABC Supplier"`
	PhoneNumber *string `json:"phone_number,omitempty" example:"998901234567"`
	Location    *string `json:"location,omitempty" example:"Tashkent, Uzbekistan"`
}

type SupplierResponse struct {
	ID          string     `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Name        string     `json:"name" example:"ABC Supplier"`
	PhoneNumber *string    `json:"phone_number,omitempty" example:"998901234567"`
	Location    *string    `json:"location,omitempty" example:"Tashkent, Uzbekistan"`
	CreatedAt   *time.Time `json:"created_at,omitempty"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
}

type SupplierWithInvoicesResponse struct {
	ID          string            `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	Name        string            `json:"name" example:"ABC Supplier"`
	PhoneNumber *string           `json:"phone_number,omitempty" example:"998901234567"`
	Location    *string           `json:"location,omitempty" example:"Tashkent, Uzbekistan"`
	Invoices    []InvoiceResponse `json:"invoices,omitempty"`
	CreatedAt   *time.Time        `json:"created_at,omitempty"`
	UpdatedAt   *time.Time        `json:"updated_at,omitempty"`
}

type SupplierListFilter struct {
	Search    string `json:"search,omitempty"`
	SortBy    string `json:"sort_by,omitempty"`
	SortOrder string `json:"sort_order,omitempty"`
}

type PaginatedSuppliersResponse struct {
	Status     string             `json:"status" example:"success"`
	Message    string             `json:"message" example:"Suppliers retrieved successfully"`
	Data       []SupplierResponse `json:"data"`
	Pagination PaginationMeta     `json:"pagination"`
	Code       int                `json:"code" example:"200"`
}
