package model

import "time"

type GetBillsRequest struct {
	Start *time.Time `json:"start,omitempty"`
	End   *time.Time `json:"end,omitempty"`

	BillStatus  *string `json:"bill_status,omitempty"`
	PaymentType *string `json:"payment_type,omitempty"`
	WaiterID    *string `json:"waiter_id,omitempty"`
	HallID      *string `json:"hall_id,omitempty"`
	TableID     *string `json:"table_id,omitempty"`

	Limit  int32 `json:"limit"`
	Offset int32 `json:"offset"`
}

type BillListItem struct {
	ID              string     `json:"id"`
	BillNo          int32      `json:"bill_no"`
	BillStatus      string     `json:"bill_status"`
	OpenedAt        *time.Time `json:"opened_at,omitempty"`
	ClosedAt        *time.Time `json:"closed_at,omitempty"`
	WaiterID        *string    `json:"waiter_id,omitempty"`
	WaiterName      *string    `json:"waiter_name,omitempty"`
	TableNumber     *int32     `json:"table_number,omitempty"`
	HallName        *string    `json:"hall_name,omitempty"`
	GuestCount      *int32     `json:"guest_count,omitempty"`
	FoodCost        string     `json:"food_cost"`
	FoodTotal       string     `json:"food_total"`
	ServicePercent  string     `json:"service_percent"`
	ServiceAmount   string     `json:"service_amount"`
	DiscountPercent string     `json:"discount_percent"`
	DiscountAmount  string     `json:"discount_amount"`
	GrandTotal      string     `json:"grand_total"`
	PaymentType     *string    `json:"payment_type,omitempty"`
	Quantity        int32      `json:"quantity"`
}

type BillListResponse struct {
	Total  int64          `json:"total"`
	Limit  int32          `json:"limit"`
	Offset int32          `json:"offset"`
	Items  []BillListItem `json:"items"`
}

type BillItem struct {
	ID       string  `json:"id"`
	GoodID   string  `json:"good_id"`
	GoodName *string `json:"good_name,omitempty"`
	Quantity int32   `json:"quantity"`
	Price    string  `json:"price"`
	Status   string  `json:"status"`
	Comment  *string `json:"comment,omitempty"`
}

type BillDetails struct {
	ID              string     `json:"id"`
	BillNo          int32      `json:"bill_no"`
	BillStatus      string     `json:"bill_status"`
	OpenedAt        *time.Time `json:"opened_at,omitempty"`
	ClosedAt        *time.Time `json:"closed_at,omitempty"`
	PaidAt          *time.Time `json:"paid_at,omitempty"`
	PaymentType     *string    `json:"payment_type,omitempty"`
	TableID         *string    `json:"table_id,omitempty"`
	TableNumber     *int32     `json:"table_number,omitempty"`
	HallName        *string    `json:"hall_name,omitempty"`
	WaiterID        *string    `json:"waiter_id,omitempty"`
	WaiterName      *string    `json:"waiter_name,omitempty"`
	CashierID       *string    `json:"cashier_id,omitempty"`
	CashierName     *string    `json:"cashier_name,omitempty"`
	GuestCount      *int32     `json:"guest_count,omitempty"`
	FoodCost        string     `json:"food_cost"`
	FoodTotal       string     `json:"food_total"`
	ServicePercent  string     `json:"service_percent"`
	ServiceAmount   string     `json:"service_amount"`
	DiscountPercent string     `json:"discount_percent"`
	DiscountAmount  string     `json:"discount_amount"`
	DiscountComment *string    `json:"discount_comment,omitempty"`
	GrandTotal      string     `json:"grand_total"`
	Comment         *string    `json:"comment,omitempty"`
	Items           []BillItem `json:"items"`
}
