import type { SWRConfiguration } from 'swr';
import type { ICafeTableItem, ICafeTableFormData } from 'src/types/cafe-tables';

import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

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
 * Get all cafe tables
 */
export function useGetCafeTables() {
    const url = endpoints.cafeTables.list;

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICafeTableItem[]> | ICafeTableItem[]>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const tables = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            tables,
            tablesLoading: isLoading,
            tablesError: error,
            tablesValidating: isValidating,
            tablesEmpty: !isLoading && !isValidating && !tables.length,
        }),
        [tables, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get cafe tables by hall ID
 */
export function useGetCafeTablesByHall(hallId: string) {
    const url = hallId ? endpoints.cafeTables.listByHall(hallId) : '';

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICafeTableItem[]> | ICafeTableItem[]>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const tables = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            tables,
            tablesLoading: isLoading,
            tablesError: error,
            tablesValidating: isValidating,
        }),
        [tables, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single cafe table by ID
 */
export function useGetCafeTable(tableId: string) {
    const url = tableId ? endpoints.cafeTables.details(tableId) : '';

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICafeTableItem> | ICafeTableItem>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const table = useMemo(() => {
        if (!data) return undefined;
        if ('data' in (data as any)) return (data as BackendResponse<ICafeTableItem>).data;
        return data as ICafeTableItem;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            table,
            tableLoading: isLoading,
            tableError: error,
            tableValidating: isValidating,
        }),
        [table, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Create new cafe table
 */
export function useCreateCafeTable() {
    const createTable = useCallback(async (hallId: string, formData: ICafeTableFormData) => {
        try {
            if (!hallId) {
                toast.error('Hall ID not found');
                throw new Error('Hall ID not found');
            }

            const payload = {
                ...formData,
                hall_id: hallId,
            };

            console.log('Creating cafe table:', payload);

            const response = await poster<BackendResponse<ICafeTableItem>>(
                endpoints.cafeTables.create,
                payload
            );

            console.log('Response:', response);

            // Extract data from wrapped response
            let tableData: ICafeTableItem;
            if (response?.data) {
                tableData = response.data;
            } else if ('id' in response) {
                tableData = response as unknown as ICafeTableItem;
            } else {
                throw new Error('Invalid response format');
            }

            // Revalidate tables list
            await mutate(endpoints.cafeTables.list);
            if (hallId) {
                await mutate(endpoints.cafeTables.listByHall(hallId));
            }

            toast.success('Table created successfully');
            return tableData;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create table';
            toast.error(message);
            throw error;
        }
    }, []);

    return { createTable };
}

/**
 * Update cafe table
 */
export function useUpdateCafeTable() {
    const updateTable = useCallback(async (tableId: string, hallId: string, formData: Partial<ICafeTableFormData>) => {
        try {
            const payload = {
                ...formData,
                hall_id: hallId,
            };

            const response = await putter<BackendResponse<ICafeTableItem>>(
                endpoints.cafeTables.update(tableId),
                payload
            );

            // Extract data from wrapped response
            let tableData: ICafeTableItem;
            if (response?.data) {
                tableData = response.data;
            } else if ('id' in response) {
                tableData = response as unknown as ICafeTableItem;
            } else {
                throw new Error('Invalid response format');
            }

            // Revalidate tables list and specific table
            await mutate(endpoints.cafeTables.list);
            await mutate(endpoints.cafeTables.details(tableId));
            if (hallId) {
                await mutate(endpoints.cafeTables.listByHall(hallId));
            }

            toast.success('Table updated successfully');
            return tableData;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update table';
            toast.error(message);
            throw error;
        }
    }, []);

    return { updateTable };
}

/**
 * Delete cafe table
 */
export function useDeleteCafeTable() {
    const deleteTable = useCallback(async (tableId: string, hallId?: string) => {
        try {
            await deleter(endpoints.cafeTables.delete(tableId));

            // Revalidate tables list
            await mutate(endpoints.cafeTables.list);
            if (hallId) {
                await mutate(endpoints.cafeTables.listByHall(hallId));
            }

            toast.success('Table deleted successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete table';
            toast.error(message);
            throw error;
        }
    }, []);

    return { deleteTable };
}
