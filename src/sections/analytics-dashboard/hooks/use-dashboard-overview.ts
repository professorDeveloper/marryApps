import type { SWRConfiguration } from 'swr';
import type { AxiosRequestConfig } from 'axios';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

import type {
  DashboardOverviewResponse,
  DashboardOverviewData,
  DashboardOverviewParams,
} from '../types';

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useDashboardOverview(params: DashboardOverviewParams) {
  const { start, end, group_by, dish_metric, dish_sort, limit, lang } = params;

  const queryParams: Record<string, string | number> = {
    start,
    end,
  };

  if (group_by) queryParams.group_by = group_by;
  if (dish_metric) queryParams.dish_metric = dish_metric;
  if (dish_sort) queryParams.dish_sort = dish_sort;
  if (limit) queryParams.limit = limit;
  if (lang) queryParams.lang = lang;

  const config: AxiosRequestConfig = {
    params: queryParams,
  };

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    [endpoints.dashboard.overview, config],
    fetcher<DashboardOverviewResponse>,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.data || null,
      isLoading,
      error,
      isValidating,
      isEmpty: !isLoading && !isValidating && !data?.data,
      mutate,
    }),
    [data, isLoading, error, isValidating, mutate]
  );

  return memoizedValue;
}
