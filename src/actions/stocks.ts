import type { SWRConfiguration } from 'swr';

import useSWR from 'swr';
import { mutate } from 'src/lib/swr';
import { useCallback } from 'react';

import { poster, fetcher, deleter, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';
import { IStock, IStockFormData } from 'src/types/stocks';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------
// API Functions
// ----------------------------------------------------------------------

export const getStocks = async () => {
    const response = await fetcher(endpoints.stocks.list);
    return response;
};

export const getStockById = async (id: string) => {
    const response = await fetcher(endpoints.stocks.details(id));
    return response;
};

export const createStock = async (data: IStockFormData) => {
    const response = await poster(endpoints.stocks.create, data);
    return response;
};

export const updateStock = async (id: string, data: IStockFormData) => {
    const response = await poster(endpoints.stocks.update(id), data);
    return response;
};

export const deleteStock = async (id: string) => {
    const response = await deleter(endpoints.stocks.delete(id));
    return response;
};

// ----------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------

export function useGetStocks() {
    const URL = endpoints.stocks.list;

    const { data, error, isLoading, isValidating } = useSWR(URL, fetcher, swrOptions);

    const memoizedValue = {
        stocks: (data as IStock[]) || [],
        stocksLoading: isLoading,
        stocksError: error,
        stocksValidating: isValidating,
        stocksEmpty: !isLoading && !(data as IStock[])?.length,
    };

    return memoizedValue;
}

export function useGetStockById(id?: string) {
    const URL = id ? endpoints.stocks.details(id) : null;

    const { data, error, isLoading, isValidating } = useSWR(URL, fetcher, swrOptions);

    const memoizedValue = {
        stock: data as IStock,
        stockLoading: isLoading,
        stockError: error,
        stockValidating: isValidating,
    };

    return memoizedValue;
}

export function useCreateStock() {
    const createStockMutation = useCallback(
        async (data: IStockFormData) => {
            try {
                const response = await createStock(data);
                
                // Invalidate stocks list cache
                mutate(endpoints.stocks.list);
                
                toast.success('Stock created successfully');
                return response;
            } catch (error) {
                console.error('Error creating stock:', error);
                toast.error('Failed to create stock');
                throw error;
            }
        },
        []
    );

    return createStockMutation;
}

export function useUpdateStock() {
    const updateStockMutation = useCallback(
        async (id: string, data: IStockFormData) => {
            try {
                const response = await updateStock(id, data);
                
                // Invalidate both the specific stock and the list cache
                mutate(endpoints.stocks.list);
                mutate(endpoints.stocks.details(id));
                
                toast.success('Stock updated successfully');
                return response;
            } catch (error) {
                console.error('Error updating stock:', error);
                toast.error('Failed to update stock');
                throw error;
            }
        },
        []
    );

    return updateStockMutation;
}

export function useDeleteStock() {
    const deleteStockMutation = useCallback(
        async (id: string) => {
            try {
                await deleteStock(id);
                
                // Invalidate stocks list cache
                mutate(endpoints.stocks.list);
                
                toast.success('Stock deleted successfully');
            } catch (error) {
                console.error('Error deleting stock:', error);
                toast.error('Failed to delete stock');
                throw error;
            }
        },
        []
    );

    return deleteStockMutation;
}
