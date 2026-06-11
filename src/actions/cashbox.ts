import type { SWRConfiguration } from 'swr';
import type { ICashier, ITransaction, ICashRegister, ICashierFormData, IGroupTransaction, ITransactionFormData, ICashRegisterFormData, IGroupTransactionFormData } from 'src/types/cashbox';

import useSWR from 'swr';
import { mutate } from 'src/lib/swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Backend response structure
 */
interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

// =============================================
// GROUP TRANSACTIONS HOOKS
// =============================================

export interface GroupTransactionListParams {
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export function useGetGroupTransactions(params?: GroupTransactionListParams) {
    const key = useMemo(() => {
        if (!params) return endpoints.cashbox.groupTransactions.root;
        const queryString = new URLSearchParams();
        if (params.search) queryString.append('search', params.search);
        if (params.sort_by) queryString.append('sort_by', params.sort_by);
        if (params.sort_order) queryString.append('sort_order', params.sort_order);
        if (typeof params.limit === 'number') queryString.append('limit', String(params.limit));
        if (typeof params.offset === 'number') queryString.append('offset', String(params.offset));

        const qs = queryString.toString();
        return qs ? `${endpoints.cashbox.groupTransactions.root}?${qs}` : endpoints.cashbox.groupTransactions.root;
    }, [params]);

    const { data, isLoading, error } = useSWR<BackendResponse<IGroupTransaction[] | { data: IGroupTransaction[]; total: number }>>(
        key,
        fetcher,
        swrOptions
    );

    const groupTransactions = useMemo(() => {
        if (!data?.data) return [];
        if (Array.isArray(data.data)) return data.data;
        if (data.data && 'data' in data.data) return (data.data as any).data || [];
        return [];
    }, [data?.data]);

    const total = useMemo(() => {
        if (!data?.data) return 0;
        if (Array.isArray(data.data)) return data.data.length;
        if (data.data && 'total' in data.data) return (data.data as any).total || 0;
        return 0;
    }, [data?.data]);

    const groupTransactionsLoading = isLoading;
    const groupTransactionsError = error;

    return {
        groupTransactions,
        groupTransactionsLoading,
        groupTransactionsError,
        total,
    };
}

export function useGetGroupTransaction(id: string) {
    const { data, isLoading, error } = useSWR<BackendResponse<IGroupTransaction>>(
        id ? `${endpoints.cashbox.groupTransactions.root}/${id}` : null,
        fetcher,
        swrOptions
    );

    return {
        groupTransaction: data?.data,
        groupTransactionLoading: isLoading,
        groupTransactionError: error,
    };
}

export function useCreateGroupTransaction() {
    const onSubmit = useCallback(async (payload: IGroupTransactionFormData) => {
        try {
            const res = await poster(endpoints.cashbox.groupTransactions.root, payload);
            mutate(endpoints.cashbox.groupTransactions.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, []);

    return { onSubmit };
}

export function useUpdateGroupTransaction(id: string) {
    const onSubmit = useCallback(async (payload: IGroupTransactionFormData) => {
        try {
            const res = await putter(`${endpoints.cashbox.groupTransactions.root}/${id}`, payload);
            mutate(endpoints.cashbox.groupTransactions.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, [id]);

    return { onSubmit };
}

export function useDeleteGroupTransaction() {
    const onDelete = useCallback(async (id: string) => {
        try {
            await deleter(`${endpoints.cashbox.groupTransactions.root}/${id}`);
            mutate(endpoints.cashbox.groupTransactions.root);
        } catch (error) {
            throw error;
        }
    }, []);

    return { onDelete };
}

// =============================================
// CASHIERS HOOKS
// =============================================

export function useGetCashiers() {
    const { data, isLoading, error } = useSWR<BackendResponse<ICashier[]>>(
        endpoints.cashbox.cashiers.root,
        fetcher,
        swrOptions
    );

    const cashiers = useMemo(
        () => data?.data || [],
        [data?.data]
    );

    return {
        cashiers,
        cashiersLoading: isLoading,
        cashiersError: error,
    };
}

export function useGetCashier(id: string) {
    const { data, isLoading, error } = useSWR<BackendResponse<ICashier>>(
        id ? `${endpoints.cashbox.cashiers.root}/${id}` : null,
        fetcher,
        swrOptions
    );

    return {
        cashier: data?.data,
        cashierLoading: isLoading,
        cashierError: error,
    };
}

export function useCreateCashier() {
    const onSubmit = useCallback(async (payload: ICashierFormData) => {
        try {
            const res = await poster(endpoints.cashbox.cashiers.root, payload);
            mutate(endpoints.cashbox.cashiers.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, []);

    return { onSubmit };
}

export function useUpdateCashier(id: string) {
    const onSubmit = useCallback(async (payload: ICashierFormData) => {
        try {
            const res = await putter(`${endpoints.cashbox.cashiers.root}/${id}`, payload);
            mutate(endpoints.cashbox.cashiers.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, [id]);

    return { onSubmit };
}

export function useDeleteCashier() {
    const onDelete = useCallback(async (id: string) => {
        try {
            await deleter(`${endpoints.cashbox.cashiers.root}/${id}`);
            mutate(endpoints.cashbox.cashiers.root);
        } catch (error) {
            throw error;
        }
    }, []);

    return { onDelete };
}

// =============================================
// TRANSACTIONS HOOKS
// =============================================

export function useGetTransactions() {
    const { data, isLoading, error } = useSWR<BackendResponse<ITransaction[]>>(
        endpoints.cashbox.transactions.root,
        fetcher,
        swrOptions
    );

    const transactions = useMemo(
        () => data?.data || [],
        [data?.data]
    );

    return {
        transactions,
        transactionsLoading: isLoading,
        transactionsError: error,
    };
}

export function useGetTransaction(id: string) {
    const { data, isLoading, error } = useSWR<BackendResponse<ITransaction>>(
        id ? `${endpoints.cashbox.transactions.root}/${id}` : null,
        fetcher,
        swrOptions
    );

    return {
        transaction: data?.data,
        transactionLoading: isLoading,
        transactionError: error,
    };
}

export function useCreateTransaction() {
    const onSubmit = useCallback(async (payload: ITransactionFormData) => {
        try {
            const res = await poster(endpoints.cashbox.transactions.root, payload);
            mutate(endpoints.cashbox.transactions.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, []);

    return { onSubmit };
}

export function useUpdateTransaction(id: string) {
    const onSubmit = useCallback(async (payload: ITransactionFormData) => {
        try {
            const res = await putter(`${endpoints.cashbox.transactions.root}/${id}`, payload);
            mutate(endpoints.cashbox.transactions.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, [id]);

    return { onSubmit };
}

export function useDeleteTransaction() {
    const onDelete = useCallback(async (id: string) => {
        try {
            await deleter(`${endpoints.cashbox.transactions.root}/${id}`);
            mutate(endpoints.cashbox.transactions.root);
        } catch (error) {
            throw error;
        }
    }, []);

    return { onDelete };
}

// =============================================
// CASH REGISTERS HOOKS (Transaction Groups)
// =============================================

export function useGetCashRegisters() {
    const { data, isLoading, error } = useSWR<BackendResponse<ICashRegister[]>>(
        endpoints.cashbox.cashRegisters.root,
        fetcher,
        swrOptions
    );

    const cashRegisters = useMemo(
        () => data?.data || [],
        [data?.data]
    );

    return {
        cashRegisters,
        cashRegistersLoading: isLoading,
        cashRegistersError: error,
    };
}

export function useGetCashRegister(id: string) {
    const { data, isLoading, error } = useSWR<BackendResponse<ICashRegister>>(
        id ? `${endpoints.cashbox.cashRegisters.root}/${id}` : null,
        fetcher,
        swrOptions
    );

    return {
        cashRegister: data?.data,
        cashRegisterLoading: isLoading,
        cashRegisterError: error,
    };
}

export function useCreateCashRegister() {
    const onSubmit = useCallback(async (payload: ICashRegisterFormData) => {
        try {
            const res = await poster(endpoints.cashbox.cashRegisters.root, payload);
            mutate(endpoints.cashbox.cashRegisters.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, []);

    return { onSubmit };
}

export function useUpdateCashRegister(id: string) {
    const onSubmit = useCallback(async (payload: ICashRegisterFormData) => {
        try {
            const res = await putter(`${endpoints.cashbox.cashRegisters.root}/${id}`, payload);
            mutate(endpoints.cashbox.cashRegisters.root);
            return res;
        } catch (error) {
            throw error;
        }
    }, [id]);

    return { onSubmit };
}

export function useDeleteCashRegister() {
    const onDelete = useCallback(async (id: string) => {
        try {
            await deleter(`${endpoints.cashbox.cashRegisters.root}/${id}`);
            mutate(endpoints.cashbox.cashRegisters.root);
        } catch (error) {
            throw error;
        }
    }, []);

    return { onDelete };
}
