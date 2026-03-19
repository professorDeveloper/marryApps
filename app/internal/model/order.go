package model

import "time"

type OrderStatus string
type OrderItemStatus string

const (
	OrderStatusOpen        OrderStatus = "open"
	OrderStatusCooking     OrderStatus = "cooking"
	OrderStatusReady       OrderStatus = "ready"
	OrderStatusServed      OrderStatus = "served"
	OrderStatusPaid        OrderStatus = "paid"
	OrderStatusCancelled   OrderStatus = "cancelled"
	OrderStatusReserved    OrderStatus = "reserved"
	OrderStatusRescheduled OrderStatus = "rescheduled"
)

type OrderType string

const (
	OrderTypeDineIn   OrderType = "dine_in"
	OrderTypeTakeaway OrderType = "takeaway"
)

const (
	OrderItemStatusPending   OrderItemStatus = "pending"
	OrderItemStatusCooking   OrderItemStatus = "cooking"
	OrderItemStatusReady     OrderItemStatus = "ready"
	OrderItemStatusCancelled OrderItemStatus = "cancelled"
)

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

type CreateOrderRequest struct {
	TableID        string                  `json:"table_id,omitempty"        example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID       *string                 `json:"waiter_id,omitempty"       example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID      *string                 `json:"cashier_id,omitempty"      example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashRegisterID *string                 `json:"cash_register_id,omitempty" example:"uuid-of-cash-register"`
	Status      *string                 `json:"status,omitempty"     example:"open"`
	GuestCount  *int32                  `json:"guest_count,omitempty" example:"2"`
	Comment     *string                 `json:"comment,omitempty"`
	Items       []CreateOrderItemInline `json:"items,omitempty"`
	OrderType   *string                 `json:"order_type,omitempty"   example:"dine_in"`
	ScheduledAt *string                 `json:"scheduled_at,omitempty" example:"2024-01-01T15:00:00Z"`
}

type CreateOrderItemInline struct {
	GoodID   string  `json:"good_id" validate:"required" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity int32   `json:"quantity" validate:"required,min=1" example:"2"`
	Comment  *string `json:"comment,omitempty"`
}

type UpdateOrderRequest struct {
	TableID    *string `json:"table_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID   *string `json:"waiter_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID  *string `json:"cashier_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status     *string `json:"status,omitempty" example:"open"`
	GuestCount *int32  `json:"guest_count,omitempty" example:"2"`
	Comment    *string `json:"comment,omitempty"`
}

type AddOrderItemsRequest struct {
	Items []CreateOrderItemInline `json:"items" validate:"required"`
}

type AddOrderItemsResponse struct {
	Order *OrderResponse      `json:"order"`
	Items []OrderItemResponse `json:"items"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" validate:"required" example:"cooking"`
}

type OrderResponse struct {
	ID               string      `json:"id"                          example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	TableID          string      `json:"table_id"                    example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID         *string     `json:"waiter_id,omitempty"          example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID        *string     `json:"cashier_id,omitempty"         example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashRegisterID   *string     `json:"cash_register_id,omitempty"   example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status           OrderStatus `json:"status"                      example:"open"`
	GuestCount       *int32      `json:"guest_count,omitempty"       example:"2"`
	TotalAmount      string      `json:"total_amount"                example:"100000"`
	Comment          *string     `json:"comment,omitempty"`
	OrderType        string      `json:"order_type"                  example:"dine_in"`
	ScheduledAt      *time.Time  `json:"scheduled_at,omitempty"`
	RescheduleComment *string    `json:"reschedule_comment,omitempty"`
	CreatedAt        *time.Time  `json:"created_at,omitempty"`
	UpdatedAt        *time.Time  `json:"updated_at,omitempty"`
}

type RescheduleOrderRequest struct {
	ScheduledAt string  `json:"scheduled_at" validate:"required" example:"2024-01-01T18:00:00Z"`
	Comment     *string `json:"comment"      example:"Customer called to reschedule"`
}

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

type CreateOrderItemEntry struct {
	GoodID   string  `json:"good_id" validate:"required" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity int32   `json:"quantity" validate:"required,min=1" example:"2"`
	Price    *string `json:"price,omitempty" example:"50000"`
	Status   *string `json:"status,omitempty" example:"pending"`
	Comment  *string `json:"comment,omitempty"`
}

type CreateOrderItemRequest struct {
	OrderID string                 `json:"order_id" validate:"required" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Items   []CreateOrderItemEntry `json:"items" validate:"required,min=1"`
}

type UpdateOrderItemRequest struct {
	GoodID   *string `json:"good_id,omitempty" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	OrderID  *string `json:"order_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Quantity *int32  `json:"quantity,omitempty" example:"2"`
	Price    *string `json:"price,omitempty" example:"50000"`
	Status   *string `json:"status,omitempty" example:"pending"`
	Comment  *string `json:"comment,omitempty"`
}

type UpdateOrderItemStatusRequest struct {
	Status string `json:"status" validate:"required" example:"cooking"`
}

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
	CashierID      *string `json:"cashier_id,omitempty"       example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashRegisterID *string `json:"cash_register_id,omitempty" example:"uuid"`
	// payment_type: cash or card
	PaymentType *string `json:"payment_type,omitempty" example:"cash"`
	// discount_percent: e.g. 10 means 10%
	DiscountPercent *string `json:"discount_percent,omitempty" example:"10"`
	// discount_amount: fixed amount
	DiscountAmount  *string `json:"discount_amount,omitempty" example:"5000"`
	DiscountComment *string `json:"discount_comment,omitempty" example:"Holiday discount"`
	// customer_paid_amount: how much the customer paid (required — equals grand_total for card, may differ for cash)
	CustomerPaidAmount string `json:"customer_paid_amount" validate:"required" example:"100000"`
}

type UpdateOrderItemQuantityRequest struct {
	Quantity int32 `json:"quantity" validate:"required" example:"2"`
}

type TablePriceResponse struct {
	TableID         string  `json:"table_id"`
	PricePerHour    string  `json:"price_per_hour"`
	StartedAt       string  `json:"started_at"`
	DurationMinutes float64 `json:"duration_minutes"`
	DurationHours   float64 `json:"duration_hours"`
	TotalPrice      string  `json:"total_price"`
}
