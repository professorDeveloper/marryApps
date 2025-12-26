// src/hooks/use-generic-data-table.ts
import type { SWRConfiguration } from 'swr';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

interface UseGenericDataTableOptions<T> {
  endpoint: string;
  dataKey?: string; // API response ichidagi data key nomi
  swrOptions?: SWRConfiguration;
}

interface GenericDataResponse<T> {
  [key: string]: T[];
}

export function useGenericDataTable<T = any>({
  endpoint,
  dataKey = 'data',
  swrOptions: customSwrOptions,
}: UseGenericDataTableOptions<T>) {
  const { data, isLoading, error, isValidating, mutate } = useSWR<GenericDataResponse<T>>(
    endpoint,
    fetcher,
    {
      ...swrOptions,
      ...customSwrOptions,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.[dataKey] || [],
      loading: isLoading,
      error,
      validating: isValidating,
      empty: !isLoading && !isValidating && !data?.[dataKey]?.length,
      mutate,
    }),
    [data, dataKey, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Bitta item uchun hook
// ----------------------------------------------------------------------

interface UseGenericItemOptions {
  endpoint: string;
  itemId?: string;
  dataKey?: string;
}

export function useGenericItem<T = any>({
  endpoint,
  itemId,
  dataKey = 'data',
}: UseGenericItemOptions) {
  const url = itemId ? [endpoint, { params: { id: itemId } }] : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR<{ [key: string]: T }>(
    url,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      data: data?.[dataKey],
      loading: isLoading,
      error,
      validating: isValidating,
      mutate,
    }),
    [data, dataKey, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Search hook
// ----------------------------------------------------------------------

interface UseGenericSearchOptions {
  endpoint: string;
  query?: string;
  dataKey?: string;
}

export function useGenericSearch<T = any>({
  endpoint,
  query,
  dataKey = 'results',
}: UseGenericSearchOptions) {
  const url = query ? [endpoint, { params: { query } }] : '';

  const { data, isLoading, error, isValidating } = useSWR<{ [key: string]: T[] }>(
    url,
    fetcher,
    {
      ...swrOptions,
      keepPreviousData: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      results: data?.[dataKey] || [],
      loading: isLoading,
      error,
      validating: isValidating,
      empty: !isLoading && !isValidating && !data?.[dataKey]?.length,
    }),
    [data, dataKey, error, isLoading, isValidating]
  );

  return memoizedValue;
}