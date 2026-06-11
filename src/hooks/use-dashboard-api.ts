import type { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { fetcher, endpoints } from 'src/lib/axios';

export interface DashboardParams {
  start: string;
  end: string;
  previous_start?: string;
  previous_end?: string;
  group_by?: 'day' | 'week' | 'month';
  lang?: 'uz' | 'ru' | 'en';
}

export interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

interface DashboardKPIValue {
  value: string;
}

interface DashboardKPIs {
  revenue: DashboardKPIValue;
  checks_count: DashboardKPIValue;
  average_check: DashboardKPIValue;
  returns_count: DashboardKPIValue;
  discounts_amount: DashboardKPIValue;
  vat_amount: DashboardKPIValue;
}

interface DashboardPeriodData {
  period: DashboardPeriod;
  kpis: DashboardKPIs;
  sales_dynamics: DashboardSalesDynamicsItem[];
  revenue_by_payment_types: DashboardRevenueByPaymentTypes;
  revenue_by_categories: DashboardRevenueByCategories;
  dish_sales: DashboardDishSales;
}

interface DashboardSalesDynamicsItem {
  period: string;
  label: string;
  revenue: string;
  checks_count: number;
  average_check: string;
}

interface DashboardRevenueByPaymentTypeItem {
  payment_type: string;
  revenue: string;
  percent: string;
}

interface DashboardRevenueByPaymentTypes {
  total: string;
  items: DashboardRevenueByPaymentTypeItem[];
}

interface DashboardRevenueByCategoryItem {
  category_id?: string;
  category_name: string;
  revenue: string;
  percent: string;
}

interface DashboardRevenueByCategories {
  total: string;
  items: DashboardRevenueByCategoryItem[];
}

interface DashboardDishSalesItem {
  good_id: string;
  good_name: string;
  revenue: string;
  quantity: string;
}

interface DashboardDishSales {
  metric: string;
  sort: string;
  items: DashboardDishSalesItem[];
}

interface DashboardPeriod {
  start: string;
  end: string;
  group_by?: string;
  previous_start?: string;
  previous_end?: string;
}

export interface DashboardOverviewResponse {
  current: DashboardPeriodData;
  previous: DashboardPeriodData;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError?.response?.data?.message || (error as Error)?.message || fallback;
};

export function useDashboardAPI() {
  const getDashboardOverview = useCallback(
    async (params: DashboardParams): Promise<DashboardOverviewResponse | null> => {
      try {
        const queryParams = Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
        );


        const response = await fetcher<BackendResponse<DashboardOverviewResponse>>([
          endpoints.dashboard.overview,
          { params: queryParams },
        ]);

        return response.data || null;
      } catch (error) {
        const errorMsg = getErrorMessage(error, 'Failed to fetch dashboard overview');
        console.error('Dashboard API Error:', error, errorMsg);
        toast.error(errorMsg);
        return null;
      }
    },
    []
  );

  const getDashboardKPIs = useCallback(
    async (params: DashboardParams): Promise<DashboardOverviewResponse | null> => {
      try {
        const queryParams = Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
        );

        const response = await fetcher<BackendResponse<DashboardOverviewResponse>>([
          endpoints.dashboard.kpis,
          { params: queryParams },
        ]);

        return response.data || null;
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to fetch KPIs'));
        return null;
      }
    },
    []
  );

  const getDashboardSalesDynamics = useCallback(
    async (params: DashboardParams): Promise<DashboardOverviewResponse | null> => {
      try {
        const queryParams = Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
        );

        const response = await fetcher<BackendResponse<DashboardOverviewResponse>>([
          endpoints.dashboard.salesDynamics,
          { params: queryParams },
        ]);

        return response.data || null;
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to fetch sales dynamics'));
        return null;
      }
    },
    []
  );

  return {
    getDashboardOverview,
    getDashboardKPIs,
    getDashboardSalesDynamics,
  };
}
