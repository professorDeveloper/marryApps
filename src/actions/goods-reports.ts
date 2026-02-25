import type { SWRConfiguration } from 'swr';
import type { IGoodsReportsResponse, IGoodsReportsFilterParams } from 'src/types/goods-reports';

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
  if (params.department_id) queryParams.append('department_id', params.department_id);
  if (params.category_id) queryParams.append('category_id', params.category_id);
  if (params.good_id) queryParams.append('good_id', params.good_id);
  if (params.waiter_id) queryParams.append('waiter_id', params.waiter_id);
  if (params.hall_id) queryParams.append('hall_id', params.hall_id);
  if (params.table_id) queryParams.append('table_id', params.table_id);

  queryParams.append('limit', String(params.limit ?? 20));
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

  const reports = useMemo(() => data?.data?.data || [], [data]);
  const totals = useMemo(() => data?.data?.totals, [data]);

  const memoizedValue = useMemo(
    () => ({
      reports,
      totals,
      reportsLoading: isLoading,
      reportsError: error,
      reportsValidating: isValidating,
      reportsEmpty: !isLoading && !isValidating && !reports.length,
    }),
    [reports, totals, error, isLoading, isValidating]
  );

  return memoizedValue;
}
