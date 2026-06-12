import type { SWRConfiguration } from 'swr';
import type {
    IIngredientReportsResponse,
    IIngredientMovementsTotals,
    IIngredientMovementsResponse,
    IIngredientReportsFilterParams,
    IIngredientReportDetailResponse,
    IIngredientMovementsFilterParams,
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
    if (params.ingredient_ids && params.ingredient_ids.length > 0) {
        queryParams.append('ingredient_ids', params.ingredient_ids.join(','));
    } else if (params.ingredient_id) {
        queryParams.append('ingredient_id', params.ingredient_id);
    }
    if (params.measurement) queryParams.append('measurement', params.measurement);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    queryParams.append('limit', String(params.limit ?? 500));
    queryParams.append('offset', String(params.offset ?? 0));

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Get ingredient reports with filters
 */
export function useGetIngredientReports(params?: Partial<IIngredientReportsFilterParams>) {
    // Fetch when date range and storage_id exist
    const shouldFetch = Boolean(params?.start && params?.end && params?.storage_id);

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
    const totals = useMemo(() => data?.totals, [data]);
    const pagination = useMemo(() => data?.pagination, [data]);

    const memoizedValue = useMemo(
        () => ({
            reports,
            totals,
            reportsPagination: pagination,
            reportsLoading: isLoading,
            reportsError: error,
            reportsValidating: isValidating,
            reportsEmpty: !isLoading && !isValidating && !reports.length,
        }),
        [reports, totals, pagination, error, isLoading, isValidating]
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

/**
 * Get ingredient stock movements for a specific ingredient.
 * When event_types has multiple values (group filter), fetches without server-side
 * event_type filter and applies client-side filtering within the page.
 */
export function useGetIngredientMovements(
    ingredientId: string | null,
    params: Partial<IIngredientMovementsFilterParams>
) {
    const shouldFetch = Boolean(ingredientId && params.storage_id);
    const eventTypes = params.event_types ?? [];

    const queryParams = new URLSearchParams();
    if (params.storage_id) queryParams.append('storage_id', params.storage_id);
    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    queryParams.append('limit', String(params.limit ?? 20));
    queryParams.append('offset', String(params.offset ?? 0));

    const url = shouldFetch
        ? `${endpoints.ingredientReports.movements(ingredientId!)}?${queryParams.toString()}`
        : null;

    const { data, isLoading, error, isValidating } = useSWR<IIngredientMovementsResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const movements = useMemo(() => {
        if (!data?.data?.items) return [];
        const all = data.data.items;
        if (eventTypes.length > 0) {
            return all.filter((m) => eventTypes.includes(m.event_type as any));
        }
        return all;
    }, [data, eventTypes]);

    const totals = useMemo<IIngredientMovementsTotals | undefined>(() => data?.data?.totals, [data]);

    return useMemo(
        () => ({
            movements,
            movementsTotals: totals,
            movementsLoading: isLoading,
            movementsError: error,
            movementsValidating: isValidating,
            movementsEmpty: !isLoading && !isValidating && !movements.length,
        }),
        [movements, totals, error, isLoading, isValidating]
    );
}

/**
 * Get inventory status report for a storage
 * This replaces ingredient stock for inventory forms
 */
export function useGetInventoryStatus(
    storageId: string | undefined,
    options?: {
        end?: string;
        ingredient_id?: string;
        limit?: number;
        offset?: number;
    }
) {
    const params = {
        storage_id: storageId || '',
        ...(options?.end && { end: options.end }),
        ...(options?.ingredient_id && { ingredient_id: options.ingredient_id }),
        limit: options?.limit || 1000,
        offset: options?.offset || 0,
    };

    const { data, isLoading, error, isValidating } = useSWR<IIngredientReportsResponse>(
        storageId ? [endpoints.ingredientReports.inventoryStatus, { params }] : null,
        fetcher,
        { ...swrOptions }
    );

    const reports = useMemo(() => {
        if (!data?.data) return [];
        return Array.isArray(data.data) ? data.data : [];
    }, [data]);
    const pagination = useMemo(() => data?.pagination, [data]);

    const memoizedValue = useMemo(
        () => ({
            reports,
            pagination,
            loading: isLoading,
            error,
            validating: isValidating,
            empty: !isLoading && !isValidating && !reports.length,
        }),
        [reports, pagination, error, isLoading, isValidating]
    );

    return memoizedValue;
}
