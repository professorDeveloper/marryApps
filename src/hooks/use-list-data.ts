import { useMemo } from 'react';

import useSWR from 'swr';

import { fetcher } from 'src/lib/axios';

interface ApiResponse {
  products?: any[];
  users?: any[];
  results?: any[];
}

export function useListData<T>(endpoint: string) {
  const { data, isLoading, error, isValidating, mutate } = useSWR<ApiResponse>(
    endpoint, 
    fetcher, 
    {
      keepPreviousData: true,
    }
  );

  const tableData = useMemo(
    () => (data?.products || data?.users || data?.results || []) as T[],
    [data]
  );

  return useMemo(
    () => ({
      tableData,
      loading: isLoading,
      empty: !isLoading && !tableData.length,
      mutate,
    }),
    [tableData, isLoading, mutate]
  );
}