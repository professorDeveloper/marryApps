import type { SWRConfiguration } from 'swr';
import type { IBranchItem } from 'src/types/branches';
import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher, endpoints } from 'src/lib/axios';

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * ID orqali bitta branch'ni oladi
 */
export function useGetBranchById(branchId: string | undefined) {
    const url = branchId ? endpoints.branches.details(branchId) : null;

    const { data, isLoading, error, isValidating } = useSWR<
        BackendResponse<IBranchItem> | IBranchItem
    >(url, fetcher, { ...swrOptions });

    // Backend response'ni parse qilamiz
    const branch = useMemo(() => {
        if (!data) return undefined;

        // Agar BackendResponse formatida bo'lsa
        if ('data' in data && 'id' in data.data) {
            return (data as BackendResponse<IBranchItem>).data;
        }
        // Agar direct IBranchItem bo'lsa
        if ('id' in data) {
            return data as IBranchItem;
        }

        return undefined;
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
