import type { SWRConfiguration } from 'swr';
import type {
    IIngredientStock,
    IIngredientStockFormData,
    IIngredientStockResponse,
} from 'src/types/ingredient-stock';
import type { MetadataRecord } from 'src/types/metadata';
import type { IIngredientItem } from 'src/types/ingredients';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { putter, fetcher, deleter, endpoints } from 'src/lib/axios';
import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';
import { useGetIngredients } from 'src/actions/ingredients';

import { toast } from 'src/components/snackbar';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Enrich ingredient stock with ingredient and storage names from metadata
 */
function enrichIngredientStocks(
    stocks: IIngredientStock[],
    ingredients: IIngredientItem[],
    storages: MetadataRecord[]
): IIngredientStock[] {
    const ingredientMap = new Map(
        ingredients?.map((ing: IIngredientItem) => [ing.id, ing]) || []
    );

    const storageMap = new Map(
        storages?.map((storage: MetadataRecord) => [storage.id, storage.name]) || []
    );

    return stocks.map((stock) => {
        const ingredient = ingredientMap.get(stock.ingredient_id);
        const storageName = storageMap.get(stock.storage_id);
        
        return {
            ...stock,
            ingredient_name: ingredient?.name || stock.ingredient_id,
            storage_name: storageName || stock.storage_id,
            measurement: ingredient?.measurement,
            price_per_unit: ingredient?.price_per_unit,
        };
    });
}

/**
 * Get all ingredient stocks
 */
export function useGetIngredientStocks(options?: { includeIngredientMeta?: boolean }) {
    const url = endpoints.ingredientStock.list;
    const includeIngredientMeta = options?.includeIngredientMeta !== false;
    const { data: metadata, isLoading: metadataLoading } = useMetadata(
        includeIngredientMeta ? [MetadataEntity.STORAGES] : []
    );
    const { ingredients, ingredientsLoading } = useGetIngredients();

    const { data, isLoading, error, isValidating } = useSWR<IIngredientStockResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedStocks = useMemo(() => {
        const stocks = Array.isArray(data?.data) ? data?.data : [];
        return enrichIngredientStocks(
            stocks,
            ingredients || [],
            metadata?.storages || []
        );
    }, [data?.data, ingredients, metadata?.storages]);

    const memoizedValue = useMemo(
        () => ({
            stocks: enrichedStocks,
            stocksLoading: isLoading || metadataLoading || ingredientsLoading,
            stocksError: error,
            stocksValidating: isValidating,
            stocksEmpty: !isLoading && !metadataLoading && !ingredientsLoading && !isValidating && !enrichedStocks.length,
        }),
        [enrichedStocks, error, isLoading, isValidating, metadataLoading, ingredientsLoading]
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
    storage_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}) {
    const limit = typeof params?.limit === 'number' ? params?.limit : 20;
    const offset = typeof params?.offset === 'number' ? params?.offset : 0;
    const expand = params?.expand || 'ingredient_id,storage_id,branch_id';
    const search = params?.search || '';
    const storage_id = params?.storage_id || '';
    const sort_by = params?.sort_by || '';
    const sort_order = params?.sort_order || '';

    // Build URL with query parameters so SWR cache key includes search, filters, and sort
    const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        expand,
        ...(search && { search }),
        ...(storage_id && { storage_id }),
        ...(sort_by && { sort_by }),
        ...(sort_order && { sort_order }),
    });
    const url = `${endpoints.ingredientStock.list}?${queryParams.toString()}`;

    const { data, isLoading, error, isValidating } = useSWR<IIngredientStockResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    // Use metadata hook for storages and ingredients hook for full ingredient data
    const { data: metadata, isLoading: metadataLoading } = useMetadata([
        MetadataEntity.STORAGES,
    ]);
    const { ingredients, ingredientsLoading } = useGetIngredients();

    const enrichedStocks = useMemo(() => {
        const stocks = Array.isArray(data?.data) ? data?.data : [];
        return enrichIngredientStocks(
            stocks,
            ingredients || [],
            metadata?.storages || []
        );
    }, [data?.data, ingredients, metadata?.storages]);

    const memoizedValue = useMemo(
        () => ({
            stocks: enrichedStocks,
            stocksLoading: isLoading || metadataLoading || ingredientsLoading,
            stocksError: error,
            stocksValidating: isValidating,
            stocksEmpty: !isLoading && !metadataLoading && !ingredientsLoading && !isValidating && !enrichedStocks.length,
            pagination: data?.pagination,
        }),
        [enrichedStocks, data?.pagination, error, isLoading, isValidating, metadataLoading, ingredientsLoading]
    );

    return memoizedValue;
}

/**
 * Get single ingredient stock by ID
 */
export function useGetIngredientStock(stockId: string) {
    const url = stockId ? endpoints.ingredientStock.details(stockId) : '';
    const { data: metadata, isLoading: metadataLoading } = useMetadata(
        stockId ? [MetadataEntity.STORAGES] : []
    );
    const { ingredients, ingredientsLoading } = useGetIngredients();

    const { data, isLoading, error, isValidating } = useSWR<IIngredientStockResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedData = useMemo(() => {
        if (!data?.data) return null;
        const stock = Array.isArray(data.data) ? data.data[0] : data.data;
        if (!stock) return null;
        return enrichIngredientStocks(
            [stock],
            ingredients || [],
            metadata?.storages || []
        )[0];
    }, [data?.data, ingredients, metadata?.storages]);

    const memoizedValue = useMemo(
        () => ({
            stock: enrichedData,
            stockLoading: isLoading || metadataLoading || ingredientsLoading,
            stockError: error,
            stockValidating: isValidating,
        }),
        [enrichedData, error, isLoading, isValidating, metadataLoading, ingredientsLoading]
    );

    return memoizedValue;
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
