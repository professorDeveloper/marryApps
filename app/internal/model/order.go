package model

import "time"

type OrderStatus string
type OrderItemStatus string

const (
	OrderStatusOpen      OrderStatus = "open"
	OrderStatusCooking   OrderStatus = "cooking"
	OrderStatusReady     OrderStatus = "ready"
	OrderStatusServed    OrderStatus = "served"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusCancelled OrderStatus = "cancelled"
)

const (
	OrderItemStatusPending   OrderItemStatus = "pending"
	OrderItemStatusCooking   OrderItemStatus = "cooking"
	OrderItemStatusReady     OrderItemStatus = "ready"
	OrderItemStatusCancelled OrderItemStatus = "cancelled"
)

// Order represents a customer order
type Order struct {
	ID          string      `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	TableID     string      `json:"table_id" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID    *string     `json:"waiter_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID   *string     `json:"cashier_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status      OrderStatus `json:"status" example:"open"`
	GuestCount  *int32      `json:"guest_count,omitempty" example:"2"`
	TotalAmount string      `json:"total_amount" example:"100000"`
	Comment     *string     `json:"comment,omitempty"`
	CreatedAt   *time.Time  `json:"created_at,omitempty"`
	UpdatedAt   *time.Time  `json:"updated_at,omitempty"`
}

// CreateOrderRequest is the request to create an order
type CreateOrderRequest struct {
	TableID     string  `json:"table_id" validate:"required" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID    *string `json:"waiter_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID   *string `json:"cashier_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status      *string `json:"status,omitempty" example:"open"`
	GuestCount  *int32  `json:"guest_count,omitempty" example:"2"`
	TotalAmount *string `json:"total_amount,omitempty" example:"100000"`
	Comment     *string `json:"comment,omitempty"`
}

// UpdateOrderRequest is the request to update an order
type UpdateOrderRequest struct {
	TableID     *string `json:"table_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID    *string `json:"waiter_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID   *string `json:"cashier_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status      *string `json:"status,omitempty" example:"open"`
	GuestCount  *int32  `json:"guest_count,omitempty" example:"2"`
	TotalAmount *string `json:"total_amount,omitempty" example:"100000"`
	Comment     *string `json:"comment,omitempty"`
}

// UpdateOrderStatusRequest is the request to update order status
type UpdateOrderStatusRequest struct {
	Status string `json:"status" validate:"required" example:"cooking"`
}

// OrderResponse is the response model for order
type OrderResponse struct {
	ID          string      `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	TableID     string      `json:"table_id" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID    *string     `json:"waiter_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID   *string     `json:"cashier_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status      OrderStatus `json:"status" example:"open"`
	GuestCount  *int32      `json:"guest_count,omitempty" example:"2"`
	TotalAmount string      `json:"total_amount" example:"100000"`
	Comment     *string     `json:"comment,omitempty"`
	CreatedAt   *time.Time  `json:"created_at,omitempty"`
	UpdatedAt   *time.Time  `json:"updated_at,omitempty"`
}

// OrderItem represents a line item in an order
type OrderItem struct {
	ID        string          `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	OrderID   string          `json:"order_id" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	GoodID    string          `json:"good_id" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity  int32           `json:"quantity" example:"2"`
	Price     string          `json:"price" example:"50000"`
	Status    OrderItemStatus `json:"status" example:"pending"`
	Comment   *string         `json:"comment,omitempty"`
	CreatedAt *time.Time      `json:"created_at,omitempty"`
	UpdatedAt *time.Time      `json:"updated_at,omitempty"`
}

// CreateOrderItemRequest is the request to create an order item
type CreateOrderItemRequest struct {
	OrderID  string  `json:"order_id" validate:"required" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	GoodID   string  `json:"good_id" validate:"required" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity int32   `json:"quantity" validate:"required,min=1" example:"2"`
	Price    string  `json:"price" validate:"required" example:"50000"`
	Status   *string `json:"status,omitempty" example:"pending"`
	Comment  *string `json:"comment,omitempty"`
}

// UpdateOrderItemRequest is the request to update an order item
type UpdateOrderItemRequest struct {
	GoodID   *string `json:"good_id,omitempty" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	OrderID  *string `json:"order_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity *int32  `json:"quantity,omitempty" example:"2"`
	Price    *string `json:"price,omitempty" example:"50000"`
	Status   *string `json:"status,omitempty" example:"pending"`
	Comment  *string `json:"comment,omitempty"`
}

// UpdateOrderItemStatusRequest is the request to update order item status
type UpdateOrderItemStatusRequest struct {
	Status string `json:"status" validate:"required" example:"cooking"`
}

// OrderItemResponse is the response model for order item
type OrderItemResponse struct {
	ID        string          `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	OrderID   string          `json:"order_id" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	GoodID    string          `json:"good_id" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity  int32           `json:"quantity" example:"2"`
	Price     string          `json:"price" example:"50000"`
	Status    OrderItemStatus `json:"status" example:"pending"`
	Comment   *string         `json:"comment,omitempty"`
	CreatedAt *time.Time      `json:"created_at,omitempty"`
	UpdatedAt *time.Time      `json:"updated_at,omitempty"`
}

type MarkOrderPaidRequest struct {
	CashierID string `json:"cashier_id" validate:"required" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
}

type UpdateOrderItemQuantityRequest struct {
	Quantity int32 `json:"quantity" validate:"required" example:"2"`
}
