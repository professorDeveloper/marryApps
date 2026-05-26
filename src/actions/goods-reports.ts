import type { SWRConfiguration } from 'swr';
import type {
  IGoodsReportsResponse,
  IGoodsReportsFilterParams,
  IGoodsReportOrdersResponse,
} from 'src/types/goods-reports';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

const buildQueryString = (params: IGoodsReportsFilterParams): string => {
  const queryParams = new URLSearchParams();

  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.department_ids && params.department_ids.length > 0) {
    queryParams.append('department_ids', params.department_ids.join(','));
  } else if (params.department_id) {
    queryParams.append('department_ids', params.department_id);
  }
  if (params.category_ids && params.category_ids.length > 0) {
    queryParams.append('category_ids', params.category_ids.join(','));
  } else if (params.category_id) {
    queryParams.append('category_ids', params.category_id);
  }
  if (params.good_ids && params.good_ids.length > 0) {
    queryParams.append('good_ids', params.good_ids.join(','));
  } else if (params.good_id) {
    queryParams.append('good_ids', params.good_id);
  }
  if (params.waiter_ids && params.waiter_ids.length > 0) {
    queryParams.append('waiter_ids', params.waiter_ids.join(','));
  } else if (params.waiter_id) {
    queryParams.append('waiter_ids', params.waiter_id);
  }
  if (params.hall_ids && params.hall_ids.length > 0) {
    queryParams.append('hall_ids', params.hall_ids.join(','));
  } else if (params.hall_id) {
    queryParams.append('hall_ids', params.hall_id);
  }
  if (params.table_ids && params.table_ids.length > 0) {
    queryParams.append('table_ids', params.table_ids.join(','));
  } else if (params.table_id) {
    queryParams.append('table_ids', params.table_id);
  }
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_order) queryParams.append('sort_order', params.sort_order);

  queryParams.append('limit', String(params.limit ?? 500));
  queryParams.append('offset', String(params.offset ?? 0));

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

export function useGetGoodsReports(params?: IGoodsReportsFilterParams) {
  const shouldFetch = Boolean(params?.start_date && params?.end_date);
  const queryString = buildQueryString(params || {});
  const url = shouldFetch ? `${endpoints.goodsReports.list}${queryString}` : null;

  const { data, isLoading, error, isValidating } = useSWR<IGoodsReportsResponse>(url, fetcher, {
    ...swrOptions,
  });

  const reports = useMemo(() => data?.data || [], [data]);
  const totals = useMemo(() => data?.totals, [data]);
  const pagination = useMemo(() => data?.pagination, [data]);

  const memoizedValue = useMemo(
    () => ({
      reports,
      totals,
      reportsLoading: isLoading,
      reportsError: error,
      reportsValidating: isValidating,
      reportsEmpty: !isLoading && !isValidating && !reports.length,
      reportsPagination: pagination,
    }),
    [reports, totals, pagination, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetGoodsReportOrders(
  goodId: string,
  params?: {
    start_date?: string;
    end_date?: string;
    waiter_id?: string;
    hall_id?: string;
    table_id?: string;
    limit?: number;
    offset?: number;
  }
) {
  const shouldFetch = Boolean(goodId);
  const queryParams = new URLSearchParams();

  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  if (params?.waiter_id) queryParams.append('waiter_ids', params.waiter_id);
  if (params?.hall_id) queryParams.append('hall_ids', params.hall_id);
  if (params?.table_id) queryParams.append('table_ids', params.table_id);
  if (typeof params?.limit === 'number') queryParams.append('limit', String(params.limit));
  if (typeof params?.offset === 'number') queryParams.append('offset', String(params.offset));

  const queryString = queryParams.toString();
  const url = shouldFetch ? `${endpoints.goodsReports.orders(goodId)}${queryString ? `?${queryString}` : ''}` : null;

  const { data, isLoading, error, isValidating } = useSWR<IGoodsReportOrdersResponse>(url, fetcher, {
    ...swrOptions,
  });

  const reports = useMemo(() => data?.data || [], [data]);
  const totals = useMemo(() => data?.totals, [data]);
  const pagination = useMemo(() => data?.pagination, [data]);

  const memoizedValue = useMemo(
    () => ({
      reports,
      totals,
      reportsLoading: isLoading,
      reportsError: error,
      reportsValidating: isValidating,
      reportsEmpty: !isLoading && !isValidating && !reports.length,
      reportsPagination: pagination,
    }),
    [reports, totals, pagination, error, isLoading, isValidating]
  );

  return memoizedValue;
}
