import type { SWRConfiguration } from 'swr';
import type { IBranchItem, IBranchFormData } from 'src/types/branches';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

export function useGetBranches() {
  const url = endpoints.branches.list;

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IBranchItem[]> | IBranchItem[]>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const branches = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const memoizedValue = useMemo(
    () => ({
      branches,
      branchesLoading: isLoading,
      branchesError: error,
      branchesValidating: isValidating,
      branchesEmpty: !isLoading && !isValidating && !branches.length,
    }),
    [branches, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useGetBranch(branchId: string) {
  const url = branchId ? endpoints.branches.details(branchId) : '';

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IBranchItem> | IBranchItem>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const branch = useMemo(() => {
    if (!data) return undefined;
    if ('data' in (data as any)) return (data as BackendResponse<IBranchItem>).data;
    return data as IBranchItem;
  }, [data]);

  const memoizedValue = useMemo(
    () => ({
      branch,
      branchLoading: isLoading,
      branchError: error,
      branchValidating: isValidating,
    }),
    [branch, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useCreateBranch() {
  const createBranch = useCallback(async (formData: IBranchFormData) => {
    const response = await poster<BackendResponse<IBranchItem>>(endpoints.branches.create, formData);
    await mutate(endpoints.branches.list);
    return response.data;
  }, []);

  return { createBranch };
}

export function useUpdateBranch() {
  const updateBranch = useCallback(async (branchId: string, formData: IBranchFormData) => {
    const response = await putter<BackendResponse<IBranchItem>>(
      endpoints.branches.update(branchId),
      formData
    );
    await mutate(endpoints.branches.list);
    await mutate(endpoints.branches.details(branchId));
    return response.data;
  }, []);

  return { updateBranch };
}

export function useDeleteBranch() {
  const deleteBranch = useCallback(async (branchId: string) => {
    await deleter(endpoints.branches.delete(branchId));
    await mutate(endpoints.branches.list);
    return true;
  }, []);

  return { deleteBranch };
}


