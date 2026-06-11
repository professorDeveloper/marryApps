import type { SWRConfiguration } from 'swr';
import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import useSWR from 'swr';
import { mutate } from 'src/lib/swr';
import { useMemo, useCallback } from 'react';

import { fetcher, putter, deleter, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
    };
    code: number;
}

export interface IIngredientStock {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    storage_id: string;
    storage_name: string;
    quantity: string;
    measurement_unit: string;
    price_per_unit: string;
    total_cost: string;
    created_at: string;
    updated_at: string;
}

export interface IIngredientStockFilters {
    limit?: number;
    offset?: number;
    ingredient_id?: string;
    ingredient_name?: string;
    search?: string;
    storage_id?: string;
    measurement?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface IIngredientStockResult {
    items: IIngredientStock[];
    pagination?: BackendResponse<IIngredientStock[]>['pagination'];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get ingredient stocks with filtering and pagination
 */
export function useGetIngredientStocks(filters?: IIngredientStockFilters) {
    const params = {
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        ...(filters?.ingredient_id && { ingredient_id: filters.ingredient_id }),
        ...(filters?.ingredient_name && { ingredient_name: filters.ingredient_name }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.storage_id && { storage_id: filters.storage_id }),
        ...(filters?.measurement && { measurement: filters.measurement }),
        ...(filters?.sort_by && { sort_by: filters.sort_by }),
        ...(filters?.sort_order && { sort_order: filters.sort_order }),
    };

    const { data, isLoading, error, isValidating, mutate: mutateStocks } = useSWR<
        BackendResponse<IIngredientStock[]> | IIngredientStock[]
    >(
        [endpoints.ingredientStock.list, { params }],
        fetcher,
        { ...swrOptions }
    );

    const stocksData = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            stocks: stocksData,
            stocksLoading: isLoading,
            stocksError: error,
            stocksValidating: isValidating,
            stocksEmpty: !isLoading && !isValidating && stocksData.length === 0,
            pagination: (data as BackendResponse<IIngredientStock[]>)?.pagination,
            mutate: mutateStocks,
        }),
        [stocksData, error, isLoading, isValidating, mutateStocks, data]
    );

    return memoizedValue;
}

/**
 * Get single ingredient stock by ID
 */
export function useGetIngredientStock(stockId: string) {
    const url = stockId ? endpoints.ingredientStock.details(stockId) : null;

    const { data, isLoading, error, isValidating, mutate: mutateStock } = useSWR<
        BackendResponse<IIngredientStock> | IIngredientStock
    >(url, fetcher, { ...swrOptions });

    const stock = useMemo(() => {
        if (!data) return null;
        if ('id' in data && 'ingredient_id' in data) {
            return data as IIngredientStock;
        } else if (data && typeof data === 'object' && 'data' in data) {
            return (data as BackendResponse<IIngredientStock>).data;
        }
        return null;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            stock,
            stockLoading: isLoading,
            stockError: error,
            stockValidating: isValidating,
            mutate: mutateStock,
        }),
        [stock, error, isLoading, isValidating, mutateStock]
    );

    return memoizedValue;
}

/**
 * Get ingredient stocks by storage ID (for inventory)
 */
export function useGetIngredientStocksByStorage(storageId: string | undefined, filters?: Omit<IIngredientStockFilters, 'storage_id'>) {
    const params = {
        limit: filters?.limit || 1000,
        offset: filters?.offset || 0,
        ...(storageId && { storage_id: storageId }),
        ...(filters?.ingredient_id && { ingredient_id: filters.ingredient_id }),
        ...(filters?.ingredient_name && { ingredient_name: filters.ingredient_name }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.measurement && { measurement: filters.measurement }),
        ...(filters?.sort_by && { sort_by: filters.sort_by }),
        ...(filters?.sort_order && { sort_order: filters.sort_order }),
    };

    const { data, isLoading, error, isValidating, mutate: mutateStocks } = useSWR<
        BackendResponse<IIngredientStock[]> | IIngredientStock[]
    >(
        storageId ? [endpoints.ingredientStock.list, { params }] : null,
        fetcher,
        { ...swrOptions }
    );

    const stocksData = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            stocks: stocksData,
            stocksLoading: isLoading,
            stocksError: error,
            stocksValidating: isValidating,
            stocksEmpty: !isLoading && !isValidating && stocksData.length === 0,
            pagination: (data as BackendResponse<IIngredientStock[]>)?.pagination,
            mutate: mutateStocks,
        }),
        [stocksData, error, isLoading, isValidating, mutateStocks, data]
    );

    return memoizedValue;
}

/**
 * Update ingredient stock
 */
export function useUpdateIngredientStock() {
    const updateStock = useCallback(
        async (stockId: string, data: Partial<IIngredientStock>): Promise<IIngredientStock | null> => {
            try {
                const response = await putter<BackendResponse<IIngredientStock>>(
                    endpoints.ingredientStock.update(stockId),
                    data
                );

                const stock = response.data || response;
                
                // Revalidate stocks list
                await mutate(endpoints.ingredientStock.list);

                toast.success('Ingredient stock updated successfully');
                return stock as IIngredientStock;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to update ingredient stock';
                toast.error(message);
                return null;
            }
        },
        []
    );

    return { updateStock };
}

/**
 * Delete ingredient stock
 */
export function useDeleteIngredientStock() {
    const deleteStock = useCallback(
        async (stockId: string): Promise<void> => {
            try {
                await deleter(endpoints.ingredientStock.delete(stockId));

                // Revalidate stocks list
                await mutate(endpoints.ingredientStock.list);

                toast.success('Ingredient stock deleted successfully');
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to delete ingredient stock';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return { deleteStock };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transform ingredient stocks to inventory items format
 */
export function transformStocksToInventoryItems(stocks: IIngredientStock[]) {
    return stocks.map((stock) => ({
        ingredient_id: stock.ingredient_id,
        ingredient_name: stock.ingredient_name,
        storage_id: stock.storage_id,
        storage_name: stock.storage_name,
        current_quantity: parseFloat(stock.quantity) || 0,
        measurement_unit: stock.measurement_unit,
        price_per_unit: parseFloat(stock.price_per_unit) || 0,
        total_cost: parseFloat(stock.total_cost) || 0,
    }));
}

/**
 * Get current stock quantity for an ingredient in a storage
 */
export function useGetCurrentStock(ingredientId: string, storageId: string) {
    const { stocks, stocksLoading } = useGetIngredientStocks({
        ingredient_id: ingredientId,
        storage_id: storageId,
        limit: 1,
    });

    const currentStock = useMemo(() => {
        if (!stocks.length) return 0;
        return parseFloat(stocks[0].quantity) || 0;
    }, [stocks]);

    return { currentStock, stocksLoading };
}
