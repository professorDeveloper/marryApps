package model

type GoodsReportRow struct {
	GoodID       string `json:"good_id"`
	Name         string `json:"name"`
	TotalQty     int64  `json:"total_qty"`
	AvgSellPrice string `json:"avg_sell_price"`
	TotalSell    string `json:"total_sell"`
	AvgCostPrice string `json:"avg_cost_price"`
	TotalCost    string `json:"total_cost"`
	AvgMarkup    string `json:"avg_markup"`
	TotalMarkup  string `json:"total_markup"`
	AvgMarkupPct string `json:"avg_markup_pct"`
}

type GoodsReportTotals struct {
	TotalQty     int64  `json:"total_qty"`
	TotalSell    string `json:"total_sell"`
	TotalCost    string `json:"total_cost"`
	TotalMarkup  string `json:"total_markup"`
	AvgMarkupPct string `json:"avg_markup_pct"`
	TotalCount   int64  `json:"total_count"`
}

type GoodsReportResponse struct {
	Data   []GoodsReportRow  `json:"data"`
	Totals GoodsReportTotals `json:"totals"`
	Limit  int32             `json:"limit"`
	Offset int32             `json:"offset"`
}
