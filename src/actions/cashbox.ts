import type { SWRConfiguration } from 'swr';
import type { IGroupTransaction, IGroupTransactionFormData, ICashier, ICashierFormData, ITransaction, ITransactionFormData } from 'src/types/cashbox';

import useSWR, { mutate } from 'swr';
import { useCallback, useMemo } from 'react';

import { deleter, endpoints, fetcher, poster, putter } from 'src/lib/axios';

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

export function useGetGroupTransactions() {
    const { data, isLoading, error } = useSWR<BackendResponse<IGroupTransaction[]>>(
        endpoints.cashbox.groupTransactions.root,
        fetcher,
        swrOptions
    );

    const groupTransactions = useMemo(
        () => data?.data || [],
        [data?.data]
    );

    const groupTransactionsLoading = isLoading;
    const groupTransactionsError = error;

    return {
        groupTransactions,
        groupTransactionsLoading,
        groupTransactionsError,
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
