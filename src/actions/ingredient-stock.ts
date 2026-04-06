import type { SWRConfiguration } from 'swr';
import type { IIngredientItem } from 'src/types/ingredients';
import type {
    IIngredientStock,
    IIngredientStockFormData,
    IIngredientStockResponse,
} from 'src/types/ingredient-stock';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { putter, fetcher, deleter, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Enrich ingredient stock with ingredient and storage names
 */
function enrichIngredientStocks(
    stocks: IIngredientStock[],
    ingredients: IIngredientItem[]
): IIngredientStock[] {
    const ingredientMap = new Map(
        ingredients?.map((ing: IIngredientItem) => [
            ing.id,
            { name: ing.name, measurement: ing.measurement },
        ]) || []
    );

    return stocks.map((stock) => {
        const ingredientInfo = ingredientMap.get(stock.ingredient_id);
        return {
            ...stock,
            ingredient_name: ingredientInfo?.name || stock.ingredient_id,
            measurement: ingredientInfo?.measurement || '-',
        };
    });
}

/**
 * Get all ingredient stocks
 */
export function useGetIngredientStocks(options?: { includeIngredientMeta?: boolean }) {
    const url = endpoints.ingredientStock.list;
    const includeIngredientMeta = options?.includeIngredientMeta !== false;
    const { ingredients } = useGetIngredientsForStock(includeIngredientMeta);

    const { data, isLoading, error, isValidating } = useSWR<IIngredientStockResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedStocks = useMemo(() => {
        const stocks = Array.isArray(data?.data) ? data?.data : [];
        return enrichIngredientStocks(stocks, ingredients);
    }, [data?.data, ingredients]);

    const memoizedValue = useMemo(
        () => ({
            stocks: enrichedStocks,
            stocksLoading: isLoading,
            stocksError: error,
            stocksValidating: isValidating,
            stocksEmpty: !isLoading && !isValidating && !enrichedStocks.length,
        }),
        [enrichedStocks, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get ingredient stocks with server-side pagination
 */
export function useGetIngredientStocksPage(params?: {
    limit?: number;
    offset?: number;
    expand?: string;
    search?: string;
}) {
    const limit = typeof params?.limit === 'number' ? params?.limit : 20;
    const offset = typeof params?.offset === 'number' ? params?.offset : 0;
    const expand = params?.expand || 'ingredient_id,storage_id,branch_id';
    const search = params?.search || '';

    // Build URL with query parameters so SWR cache key includes search
    const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        expand,
        ...(search && { search }),
    });
    const url = `${endpoints.ingredientStock.list}?${queryParams.toString()}`;

    const { data, isLoading, error, isValidating } = useSWR<IIngredientStockResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const stocks = useMemo(() => (Array.isArray(data?.data) ? data?.data : []), [data?.data]);

    const memoizedValue = useMemo(
        () => ({
            stocks,
            stocksLoading: isLoading,
            stocksError: error,
            stocksValidating: isValidating,
            stocksEmpty: !isLoading && !isValidating && !stocks.length,
            pagination: data?.pagination,
        }),
        [stocks, data?.pagination, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single ingredient stock by ID
 */
export function useGetIngredientStock(stockId: string) {
    const url = stockId ? endpoints.ingredientStock.details(stockId) : '';
    const { ingredients } = useGetIngredientsForStock(!!stockId);

    const { data, isLoading, error, isValidating } = useSWR<IIngredientStockResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedData = useMemo(() => {
        if (!data?.data) return null;
        const stock = Array.isArray(data.data) ? data.data[0] : data.data;
        if (!stock) return null;
        return enrichIngredientStocks([stock], ingredients)[0];
    }, [data?.data, ingredients]);

    const memoizedValue = useMemo(
        () => ({
            stock: enrichedData,
            stockLoading: isLoading,
            stockError: error,
            stockValidating: isValidating,
        }),
        [enrichedData, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Helper hook to get ingredients for enrichment
 */
function useGetIngredientsForStock(enabled: boolean) {
    const url = endpoints.ingredient.list;

    const { data } = useSWR<{ data: IIngredientItem[] }>(
        enabled ? url : null,
        fetcher,
        { ...swrOptions }
    );

    const ingredients = useMemo(() => data?.data || [], [data?.data]);

    return { ingredients };
}

/**
 * Update ingredient stock
 */
export function useUpdateIngredientStock() {
    const updateStock = useCallback(
        async (stockId: string, formData: IIngredientStockFormData) => {
            try {
                const response = await putter<IIngredientStockResponse>(
                    endpoints.ingredientStock.update(stockId),
                    formData
                );

                // Revalidate stocks list and specific item
                await mutate(endpoints.ingredientStock.list);
                await mutate(endpoints.ingredientStock.details(stockId));

                toast.success('Stock quantity updated successfully');
                return response;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to update stock';
                toast.error(message);
                throw error;
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
        async (stockId: string) => {
            try {
                const response = await deleter<IIngredientStockResponse>(
                    endpoints.ingredientStock.delete(stockId)
                );

                // Revalidate stocks list
                await mutate(endpoints.ingredientStock.list);

                toast.success('Stock deleted successfully');
                return response;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to delete stock';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return { deleteStock };
}
