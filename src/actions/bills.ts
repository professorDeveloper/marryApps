import type { SWRConfiguration } from 'swr';
import type { IBillDetail, IBillsListData, IBillsFilterParams } from 'src/types/bills';

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
    code?: number;
}

/**
 * Build query string from filter parameters
 */
const buildQueryString = (params: IBillsFilterParams): string => {
    const queryParams = new URLSearchParams();

    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    const billStatus = params.bill_status;
    if (Array.isArray(billStatus) && billStatus.length > 0) {
        queryParams.append('bill_status', billStatus.join(','));
    } else if (billStatus) {
        queryParams.append('bill_status', billStatus as string);
    }
    const paymentType = params.payment_type;
    if (Array.isArray(paymentType) && paymentType.length > 0) {
        queryParams.append('payment_type', paymentType.join(','));
    } else if (paymentType) {
        queryParams.append('payment_type', paymentType as string);
    }
    const waiterId = params.waiter_id;
    if (waiterId != null && waiterId !== '') {
        queryParams.append('waiter_id', String(waiterId));
    }
    const hallId = params.hall_id;
    if (Array.isArray(hallId) && hallId.length > 0) {
        queryParams.append('hall_id', hallId.join(','));
    } else if (typeof hallId === 'string' && hallId !== '') {
        queryParams.append('hall_id', hallId);
    }
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

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IBillsListData>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const bills = useMemo(() => {
        if (!data?.data?.items) return [];
        return Array.isArray(data.data.items) ? data.data.items : [];
    }, [data]);

    const pagination = useMemo(() => {
        if (!data?.data) return undefined;
        return {
            total: data.data.total ?? bills.length,
            limit: data.data.limit ?? params?.limit ?? 20,
            offset: data.data.offset ?? params?.offset ?? 0,
        };
    }, [data, bills.length, params?.limit, params?.offset]);

    const total = useMemo(() => {
        if (!data?.data) return bills.length;
        return data.data.total ?? bills.length;
    }, [data, bills.length]);

    const totals = useMemo(() => {
        if (!data?.data) return undefined;
        return data.data.totals;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            bills,
            billsTotal: total,
            billsLoading: isLoading,
            billsError: error,
            billsValidating: isValidating,
            billsEmpty: !isLoading && !isValidating && !bills.length,
            pagination,
            totals,
        }),
        [bills, total, error, isLoading, isValidating, pagination, totals]
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
