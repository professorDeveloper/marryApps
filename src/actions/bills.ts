import type { SWRConfiguration } from 'swr';
import type { IBillItem, IBillDetail, IBillsResponse, IBillsFilterParams } from 'src/types/bills';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

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

/**
 * Build query string from filter parameters
 */
const buildQueryString = (params: IBillsFilterParams): string => {
    const queryParams = new URLSearchParams();

    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    if (params.bill_status) queryParams.append('bill_status', params.bill_status);
    if (params.payment_type) queryParams.append('payment_type', params.payment_type);
    if (params.waiter_id) queryParams.append('waiter_id', params.waiter_id);
    if (params.hall_id) queryParams.append('hall_id', params.hall_id);
    if (params.table_id) queryParams.append('table_id', params.table_id);

    queryParams.append('limit', String(params.limit ?? 20));
    queryParams.append('offset', String(params.offset ?? 0));

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Get bills with filters
 */
export function useGetBills(params?: IBillsFilterParams) {
    const queryString = buildQueryString(params || {});
    const url = queryString ? `${endpoints.bills.list}${queryString}` : endpoints.bills.list;

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IBillItem[]>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const bills = useMemo(() => {
        if (!data?.data) return [];
        return Array.isArray(data.data) ? data.data : [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            bills,
            billsLoading: isLoading,
            billsError: error,
            billsValidating: isValidating,
            billsEmpty: !isLoading && !isValidating && !bills.length,
        }),
        [bills, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single bill details by ID
 */
export function useGetBillDetails(billId: string) {
    const url = billId ? `${endpoints.bills.list}/${billId}` : '';

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IBillDetail>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const bill = useMemo(() => {
        if (!data?.data) return undefined;
        return data.data;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            bill,
            billLoading: isLoading,
            billError: error,
            billValidating: isValidating,
        }),
        [bill, error, isLoading, isValidating]
    );

    return memoizedValue;
}
