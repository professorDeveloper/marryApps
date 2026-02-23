import type { SWRConfiguration } from 'swr';
import type {
    IIngredientReportsResponse,
    IIngredientReportsFilterParams,
    IIngredientReportDetailResponse,
} from 'src/types/ingredient-reports';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Build query string from filter parameters
 */
const buildQueryString = (params: Partial<IIngredientReportsFilterParams>): string => {
    const queryParams = new URLSearchParams();

    if (params.storage_id !== undefined && params.storage_id !== null) {
        queryParams.append('storage_id', params.storage_id);
    }
    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    if (params.ingredient_id) queryParams.append('ingredient_id', params.ingredient_id);

    queryParams.append('limit', String(params.limit ?? 20));
    queryParams.append('offset', String(params.offset ?? 0));

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Get ingredient reports with filters
 * Note: storage_id is optional - empty string can be sent as `storage_id=`
 */
export function useGetIngredientReports(params?: Partial<IIngredientReportsFilterParams>) {
    // Fetch when date range exists; storage_id can be empty
    const shouldFetch = Boolean(params?.start && params?.end);

    const queryString = buildQueryString(params || {});
    const url = shouldFetch ? `${endpoints.ingredientReports.list}${queryString}` : null;

    const { data, isLoading, error, isValidating } = useSWR<IIngredientReportsResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const reports = useMemo(() => {
        if (!data?.data) return [];
        return Array.isArray(data.data) ? data.data : [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            reports,
            reportsLoading: isLoading,
            reportsError: error,
            reportsValidating: isValidating,
            reportsEmpty: !isLoading && !isValidating && !reports.length,
        }),
        [reports, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single ingredient report detail by ingredient ID
 */
export function useGetIngredientReportDetail(
    ingredientId: string,
    storageId: string,
    startDate: string,
    endDate: string
) {
    // Only fetch if all required parameters are provided
    const shouldFetch = ingredientId && storageId && startDate && endDate;
    const url = shouldFetch
        ? `${endpoints.ingredientReports.details(ingredientId)}?storage_id=${storageId}&start=${startDate}&end=${endDate}`
        : null;

    const { data, isLoading, error, isValidating } = useSWR<IIngredientReportDetailResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const report = useMemo(() => {
        if (!data?.data) return undefined;
        return data.data;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            report,
            reportLoading: isLoading,
            reportError: error,
            reportValidating: isValidating,
        }),
        [report, error, isLoading, isValidating]
    );

    return memoizedValue;
}
