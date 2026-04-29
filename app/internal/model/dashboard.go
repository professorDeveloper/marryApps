package model

import "time"

type DashboardGroupBy string

const (
	DashboardGroupByDay   DashboardGroupBy = "day"
	DashboardGroupByWeek  DashboardGroupBy = "week"
	DashboardGroupByMonth DashboardGroupBy = "month"
)

type DashboardDishMetric string

const (
	DashboardDishMetricRevenue  DashboardDishMetric = "revenue"
	DashboardDishMetricQuantity DashboardDishMetric = "quantity"
)

type DashboardSort string

const (
	DashboardSortAsc  DashboardSort = "asc"
	DashboardSortDesc DashboardSort = "desc"
)

type DashboardOverviewRequest struct {
	Start       time.Time           `json:"start" validate:"required"`
	End         time.Time           `json:"end" validate:"required"`
	GroupBy     DashboardGroupBy    `json:"group_by" validate:"omitempty,oneof=day week month"`
	DishMetric  DashboardDishMetric `json:"dish_metric" validate:"omitempty,oneof=revenue quantity"`
	DishSort    DashboardSort       `json:"dish_sort" validate:"omitempty,oneof=asc desc"`
	Limit       int32               `json:"limit" validate:"omitempty,min=1,max=100"`
	Lang        string              `json:"lang" validate:"omitempty,oneof=uz ru en"`
}

type DashboardKPIValue struct {
	Value         string  `json:"value"`
	PreviousValue string  `json:"previous_value"`
	ChangePercent string  `json:"change_percent"`
	Trend         string  `json:"trend"` // up, down, same
}

type DashboardKPIs struct {
	Revenue        DashboardKPIValue `json:"revenue"`
	ChecksCount    DashboardKPIValue `json:"checks_count"`
	AverageCheck   DashboardKPIValue `json:"average_check"`
	ReturnsCount   DashboardKPIValue `json:"returns_count"`
	DiscountsAmount DashboardKPIValue `json:"discounts_amount"`
	VATAmount      DashboardKPIValue `json:"vat_amount"`
}

type DashboardSalesDynamicsItem struct {
	Period       string  `json:"period"`
	Label        string  `json:"label"`
	Revenue      string  `json:"revenue"`
	ChecksCount  int64   `json:"checks_count"`
	AverageCheck string  `json:"average_check"`
}

type DashboardRevenueByPaymentTypeItem struct {
	PaymentType string  `json:"payment_type"`
	Revenue     string  `json:"revenue"`
	Percent     string  `json:"percent"`
}

type DashboardRevenueByPaymentTypes struct {
	Total string                             `json:"total"`
	Items []DashboardRevenueByPaymentTypeItem `json:"items"`
}

type DashboardRevenueByCategoryItem struct {
	CategoryID   *string `json:"category_id,omitempty"`
	CategoryName string  `json:"category_name"`
	Revenue      string  `json:"revenue"`
	Percent      string  `json:"percent"`
}

type DashboardRevenueByCategories struct {
	Total string                           `json:"total"`
	Items []DashboardRevenueByCategoryItem `json:"items"`
}

type DashboardDishSalesItem struct {
	GoodID   string  `json:"good_id"`
	GoodName string  `json:"good_name"`
	Revenue  string  `json:"revenue"`
	Quantity string  `json:"quantity"`
}

type DashboardDishSales struct {
	Metric string                 `json:"metric"`
	Sort   string                 `json:"sort"`
	Items  []DashboardDishSalesItem `json:"items"`
}

type DashboardPeriod struct {
	Start         time.Time          `json:"start"`
	End           time.Time          `json:"end"`
	GroupBy       DashboardGroupBy   `json:"group_by"`
	PreviousStart *time.Time         `json:"previous_start,omitempty"`
	PreviousEnd   *time.Time         `json:"previous_end,omitempty"`
}

type DashboardOverviewResponse struct {
	Period                   DashboardPeriod                 `json:"period"`
	KPIs                     DashboardKPIs                   `json:"kpis"`
	SalesDynamics            []DashboardSalesDynamicsItem   `json:"sales_dynamics"`
	RevenueByPaymentTypes    DashboardRevenueByPaymentTypes  `json:"revenue_by_payment_types"`
	RevenueByCategories      DashboardRevenueByCategories    `json:"revenue_by_categories"`
	DishSales                DashboardDishSales              `json:"dish_sales"`
}
