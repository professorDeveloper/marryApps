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

const OrderItemStatusAllowedValues = "pending, cooking, ready, cancelled"

func IsValidOrderItemStatus(status string) bool {
	switch OrderItemStatus(status) {
	case OrderItemStatusPending,
		OrderItemStatusCooking,
		OrderItemStatusReady,
		OrderItemStatusCancelled:
		return true
	default:
		return false
	}
}

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
	Status         *string                 `json:"status,omitempty"     example:"open"`
	GuestCount     *int32                  `json:"guest_count,omitempty" example:"2"`
	Comment        *string                 `json:"comment,omitempty"`
	Items          []CreateOrderItemInline `json:"items,omitempty"`
	OrderType      *string                 `json:"order_type,omitempty"   example:"dine_in"`
	ScheduledAt    *string                 `json:"scheduled_at,omitempty" example:"2024-01-01T15:00:00Z"`
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
	ID                string              `json:"id"                          example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	TableID           string              `json:"table_id"                    example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	WaiterID          *string             `json:"waiter_id,omitempty"          example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID         *string             `json:"cashier_id,omitempty"         example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashRegisterID    *string             `json:"cash_register_id,omitempty"   example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status            OrderStatus         `json:"status"                      example:"open"`
	GuestCount        *int32              `json:"guest_count,omitempty"       example:"2"`
	TotalAmount       string              `json:"total_amount"                example:"100000"`
	Comment           *string             `json:"comment,omitempty"`
	OrderType         string              `json:"order_type"                  example:"dine_in"`
	ScheduledAt       *time.Time          `json:"scheduled_at,omitempty"`
	RescheduleComment *string             `json:"reschedule_comment,omitempty"`
	TableType         *string             `json:"table_type,omitempty" example:"time_based"`
	PricePerHour      *string             `json:"price_per_hour,omitempty" example:"50000"`
	TableStartedAt    *time.Time          `json:"table_started_at,omitempty"`
	TableAmount       *string             `json:"table_amount,omitempty" example:"12500.00"`
	ItemsAmount       *string             `json:"items_amount,omitempty" example:"50000"`
	ServicePercent    *string             `json:"service_percent,omitempty" example:"20"`
	ServiceAmount     *string             `json:"service_amount,omitempty" example:"10000"`
	Items             []OrderItemResponse `json:"items"`
	CreatedAt         *time.Time          `json:"created_at,omitempty"`
	UpdatedAt         *time.Time          `json:"updated_at,omitempty"`
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

type OrderItemWithGoodResponse struct {
	ID         string          `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	OrderID    string          `json:"order_id" example:"4365eb64-3569-4f72-bd79-703695ae42be"`
	GoodID     string          `json:"good_id" example:"6aac7e44-05ea-4711-96c8-7de524faf55b"`
	GoodName   string          `json:"good_name" example:"Osh"`
	PictureUrl *string         `json:"picture_url,omitempty" example:"https://example.com/goods/osh.jpg"`
	Quantity   int32           `json:"quantity" example:"2"`
	Price      string          `json:"price" example:"25000"`
	Status     OrderItemStatus `json:"status" example:"pending"`
	Comment    *string         `json:"comment,omitempty" example:"kamroq achchiq"`
	CreatedAt  *time.Time      `json:"created_at,omitempty"`
	UpdatedAt  *time.Time      `json:"updated_at,omitempty"`
}

type OrderItemDetailResponse struct {
	ID         string          `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	GoodID     string          `json:"good_id" example:"d4e5f6a7-b8c9-4a5b-8c9d-e0f1a2b3c4d5"`
	GoodName   string          `json:"good_name" example:"Osh"`
	PictureUrl *string         `json:"picture_url,omitempty" example:"https://example.com/goods/osh.jpg"`
	Quantity   int32           `json:"quantity" example:"2"`
	Price      string          `json:"price" example:"50000"`
	Status     OrderItemStatus `json:"status" example:"pending"`
	Comment    *string         `json:"comment,omitempty" example:"kamroq achchiq"`
	CreatedAt  *time.Time      `json:"created_at,omitempty"`
	UpdatedAt  *time.Time      `json:"updated_at,omitempty"`
}

type MarkOrderPaidRequest struct {
	CashierID      *string `json:"cashier_id,omitempty"       example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashRegisterID *string `json:"cash_register_id,omitempty" example:"uuid"`
	// payment_type: cash, card, or split
	PaymentType *string `json:"payment_type,omitempty" example:"cash"`
	// discount_percent: e.g. 10 means 10% — takes priority over discount_amount
	DiscountPercent *string `json:"discount_percent,omitempty" example:"10"`
	// discount_amount: fixed flat discount (ignored if discount_percent is set)
	DiscountAmount  *string `json:"discount_amount,omitempty" example:"5000"`
	DiscountComment *string `json:"discount_comment,omitempty" example:"Holiday discount"`
	// customer_paid_amount: total handed by customer (required)
	CustomerPaidAmount string `json:"customer_paid_amount" validate:"required" example:"100000"`
	// table_charge: confirmed table fee from GET /orders/:id/table-price (optional; auto-calc if table has price_per_hour and this is not provided)
	TableCharge *string `json:"table_charge,omitempty" example:"50000"`
	// cash_amount: cash portion paid (required for split; equals customer_paid_amount for cash-only)
	CashAmount *string `json:"cash_amount,omitempty" example:"80000"`
	// card_amount: card portion paid (required for split; equals customer_paid_amount for card-only)
	CardAmount *string `json:"card_amount,omitempty" example:"20000"`
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

type WaiterOrderScope string

const (
	WaiterOrderScopeActive       WaiterOrderScope = "active"
	WaiterOrderScopeReservations WaiterOrderScope = "reservations"
	WaiterOrderScopeHistory      WaiterOrderScope = "history"
	WaiterOrderScopeAll          WaiterOrderScope = "all"
)

type GetMyOrdersRequest struct {
	Scope     *WaiterOrderScope `json:"scope,omitempty"      query:"scope"      example:"active"`
	OrderType *OrderType        `json:"order_type,omitempty" query:"order_type" example:"dine_in"`
	TableID   *string           `json:"table_id,omitempty"   query:"table_id"   example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Limit     int32             `json:"limit"                query:"limit"      example:"20"`
	Offset    int32             `json:"offset"               query:"offset"     example:"0"`
}

type WaiterOrderListItem struct {
	ID                string      `json:"id" example:"c0f18a64-7f5c-4425-9414-1b01cddee9d9"`
	TableID           *string     `json:"table_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	TableNumber       *int32      `json:"table_number,omitempty" example:"12"`
	HallName          *string     `json:"hall_name,omitempty" example:"Main hall"`
	WaiterID          *string     `json:"waiter_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashierID         *string     `json:"cashier_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	CashRegisterID    *string     `json:"cash_register_id,omitempty" example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	Status            OrderStatus `json:"status" example:"open"`
	GuestCount        *int32      `json:"guest_count,omitempty" example:"2"`
	TotalAmount       string      `json:"total_amount" example:"100000"`
	Comment           *string     `json:"comment,omitempty"`
	OrderType         OrderType   `json:"order_type" example:"dine_in"`
	ScheduledAt       *time.Time  `json:"scheduled_at,omitempty"`
	RescheduleComment *string     `json:"reschedule_comment,omitempty"`
	ItemCount         int64       `json:"item_count" example:"3"`
	TotalItems        int64       `json:"total_items" example:"5"`
	CreatedAt         *time.Time  `json:"created_at,omitempty"`
	UpdatedAt         *time.Time  `json:"updated_at,omitempty"`
}

type WaiterOrderListResponse struct {
	Message    string                `json:"message" example:"My orders retrieved successfully"`
	Data       []WaiterOrderListItem `json:"data"`
	StatusCode int                   `json:"status_code" example:"200"`
}

type GetOrdersRequest struct {
	Type      *OrderType   `json:"type,omitempty"       query:"type"       example:"dine_in"`
	Status    *OrderStatus `json:"status,omitempty"     query:"status"     example:"open"`
	From      *string      `json:"from,omitempty"       query:"from"       example:"2026-04-01"`
	To        *string      `json:"to,omitempty"         query:"to"         example:"2026-04-07"`
	TableID   *string      `json:"table_id,omitempty"   query:"table_id"   example:"a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5"`
	SortBy    string       `json:"sort_by"              query:"sort_by"    example:"created_at"`
	SortOrder string       `json:"sort_order"           query:"sort_order" example:"desc"`
	Limit     int32        `json:"limit"                query:"limit"      example:"20"`
	Offset    int32        `json:"offset"               query:"offset"     example:"0"`
}
