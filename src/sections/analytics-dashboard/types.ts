export interface DashboardPeriod {
  start: string;
  end: string;
  group_by: string;
  previous_start: string;
  previous_end: string;
}

export interface DashboardKPI {
  value: string;
  previous_value: string;
  change_percent: string;
  trend: 'up' | 'down' | 'same';
}

export interface DashboardKPIs {
  revenue: DashboardKPI;
  checks_count: DashboardKPI;
  average_check: DashboardKPI;
  returns_count: DashboardKPI;
  discounts_amount: DashboardKPI;
  vat_amount: DashboardKPI;
}

export interface SalesDynamicsItem {
  period: string;
  label: string;
  revenue: string;
  checks_count: number;
  average_check: string;
}

export interface RevenueByPaymentTypeItem {
  payment_type: string;
  revenue: string;
  percent: string;
}

export interface RevenueByPaymentTypes {
  total: string;
  items: RevenueByPaymentTypeItem[];
}

export interface RevenueByCategoryItem {
  category_id: string;
  category_name: string;
  revenue: string;
  percent: string;
}

export interface RevenueByCategories {
  total: string;
  items: RevenueByCategoryItem[];
}

export interface DishSaleItem {
  good_id: string;
  good_name: string;
  revenue: string;
  quantity: string;
}

export interface DishSales {
  metric: 'revenue' | 'quantity';
  sort: 'asc' | 'desc';
  items: DishSaleItem[];
}

export interface DashboardOverviewData {
  period: DashboardPeriod;
  kpis: DashboardKPIs;
  sales_dynamics: SalesDynamicsItem[];
  revenue_by_payment_types: RevenueByPaymentTypes;
  revenue_by_categories: RevenueByCategories;
  dish_sales: DishSales;
}

export interface DashboardOverviewResponse {
  status: string;
  message: string;
  data: DashboardOverviewData;
}

export interface DashboardOverviewParams {
  start: string;
  end: string;
  group_by?: 'day' | 'week' | 'month';
  dish_metric?: 'revenue' | 'quantity';
  dish_sort?: 'asc' | 'desc';
  limit?: number;
  lang?: 'uz' | 'ru' | 'en';
}

export interface HallUtilizationSlot {
  day: string;
  timeSlot: string;
  utilization: number;
  capacity: number;
}

export interface HallUtilizationData {
  hallName: string;
  totalCapacity: number;
  days: string[];
  timeSlots: string[];
  data: HallUtilizationSlot[];
}
