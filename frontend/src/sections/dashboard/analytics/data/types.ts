import type { Delta } from './formatters';

export interface SalesDayPoint {
  label: string;
  revenue: number;
  checks_count: number;
  average_check: number;
}

export interface PaymentTypeItem {
  type: string;
  revenue: number;
  percent: number;
}

export interface CategoryItem {
  name: string;
  revenue: number;
  percent: number;
}

export interface DishItem {
  name: string;
  revenue: number;
  quantity: number;
}

export interface PeriodPayload {
  period: { start: string; end: string; group_by?: string };
  kpis: {
    revenue: number;
    checks_count: number;
    average_check: number;
    returns_count: number;
    discounts_amount: number;
    vat_amount: number;
  };
  sales_dynamics: SalesDayPoint[];
  payment_types: PaymentTypeItem[];
  categories: CategoryItem[];
  dish_sales: DishItem[];
}

export interface AnalyticsPayload {
  current: PeriodPayload;
  previous: PeriodPayload;
}

export type KpiKey =
  | 'revenue'
  | 'checks_count'
  | 'average_check'
  | 'returns_count'
  | 'discounts_amount'
  | 'vat_amount';

export interface Kpi {
  key: KpiKey;
  label: string;
  unit: 'money' | 'int' | 'flat';
  good: 'up' | 'down' | 'flat';
  current: number;
  previous: number;
  delta: Delta;
}

export interface Insight {
  kind: 'peak' | 'compare' | 'ops' | 'mix' | 'dish';
  title: string;
  value: string;
  detail: string;
  direction?: 'up' | 'down' | 'flat';
}
