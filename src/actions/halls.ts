import type { SWRConfiguration } from 'swr';

import useSWR, { mutate } from 'swr';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { deleter, endpoints, fetcher, poster, putter } from 'src/lib/axios';
import type { IHallFormData, IHallItem } from 'src/types/halls';

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
 * Get all halls
 */
export function useGetHalls() {
    const url = endpoints.halls.list;

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IHallItem[]> | IHallItem[]>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const halls = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            halls,
            hallsLoading: isLoading,
            hallsError: error,
            hallsValidating: isValidating,
            hallsEmpty: !isLoading && !isValidating && !halls.length,
        }),
        [halls, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single hall by ID
 */
export function useGetHall(hallId: string) {
    const url = hallId ? endpoints.halls.details(hallId) : '';

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IHallItem> | IHallItem>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const hall = useMemo(() => {
        if (!data) return undefined;
        if ('data' in (data as any)) return (data as BackendResponse<IHallItem>).data;
        return data as IHallItem;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            hall,
            hallLoading: isLoading,
            hallError: error,
            hallValidating: isValidating,
        }),
        [hall, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Create new hall
 * branch_id ni user tanlasi yoki localStorage'dan oladi
 */
export function useCreateHall() {
    const createHall = useCallback(async (formData: IHallFormData) => {
        try {
            // branch_id ni formData'dan ol, yoki localStorage'dan olish
            let branchId = formData.branch_id;

            if (!branchId) {
                branchId = localStorage.getItem('branch_id') || localStorage.getItem('brand_id') || '';
            }

            console.log('Creating hall with branchId:', branchId);
            console.log('Form data:', formData);

            if (!branchId) {
                toast.error('Branch ID not found. Please select branch or login again.');
                throw new Error('Branch ID not found');
            }

            const payload: IHallFormData = {
                ...formData,
                branch_id: branchId,
            };

            console.log('Sending payload:', payload);

            const response = await poster<BackendResponse<IHallItem>>(
                endpoints.halls.create,
                payload
            );

            console.log('Response:', response);

            // Extract data from wrapped response
            let hallData: IHallItem;
            if (response?.data) {
                hallData = response.data;
            } else if ('id' in response) {
                hallData = response as unknown as IHallItem;
            } else {
                throw new Error('Invalid response format');
            }

            // Revalidate halls list
            await mutate(endpoints.halls.list);

            toast.success('Hall created successfully');
            return hallData;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create hall';
            toast.error(message);
            throw error;
        }
    }, []);

    return { createHall };
}

/**
 * Update hall
 */
export function useUpdateHall() {
    const updateHall = useCallback(async (hallId: string, formData: Partial<IHallFormData>) => {
        try {
            // branch_id ni include qilmaymiz - update qismida kerak emas
            const { branch_id: _branchId, ...payload } = formData;

            const response = await putter<BackendResponse<IHallItem>>(
                endpoints.halls.update(hallId),
                payload
            );

            // Extract data from wrapped response
            let hallData: IHallItem;
            if (response?.data) {
                hallData = response.data;
            } else if ('id' in response) {
                hallData = response as unknown as IHallItem;
            } else {
                throw new Error('Invalid response format');
            }

            // Revalidate halls list and specific hall
            await mutate(endpoints.halls.list);
            await mutate(endpoints.halls.details(hallId));

            toast.success('Hall updated successfully');
            return hallData;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update hall';
            toast.error(message);
            throw error;
        }
    }, []);

    return { updateHall };
}

/**
 * Delete hall
 */
export function useDeleteHall() {
    const deleteHall = useCallback(async (hallId: string) => {
        try {
            await deleter(endpoints.halls.delete(hallId));

            // Revalidate halls list
            await mutate(endpoints.halls.list);

            toast.success('Hall deleted successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete hall';
            toast.error(message);
            throw error;
        }
    }, []);

    return { deleteHall };
}
