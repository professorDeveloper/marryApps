export interface IGoodsReportItem {
  good_id: string;
  name: string;
  total_qty: number;
  avg_sell_price: string;
  total_sell: string;
  avg_cost_price: string;
  total_cost: string;
  avg_markup: string;
  total_markup: string;
  avg_markup_pct: string;
}

export interface IGoodsReportsTotals {
  total_qty: number;
  total_sell: string;
  total_cost: string;
  total_markup: string;
  avg_markup_pct: string;
  total_count: number;
}

export interface IGoodsReportsFilterParams {
  // APIda required, lekin initial state uchun optional qoldirilgan.
  start_date?: string;
  end_date?: string;
  department_id?: string;
  category_id?: string;
  good_id?: string;
  waiter_id?: string;
  hall_id?: string;
  table_id?: string;
  limit?: number;
  offset?: number;
}

export interface IGoodsReportsResponse {
  status: string;
  message: string;
  data: {
    data: IGoodsReportItem[];
    totals: IGoodsReportsTotals;
    limit: number;
    offset: number;
  };
  code: number;
}
