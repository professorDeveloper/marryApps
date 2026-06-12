import type { SWRConfiguration } from 'swr';
import type { IStopListItem, ICreateStopListRequest } from 'src/types/stop-list';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useMemo, useCallback } from 'react';

import { poster, deleter, fetcher, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        page: number;
        total_pages: number;
    };
    code: number;
}

export function useGetStopList(params?: { limit?: number; offset?: number }) {
    const limit = params?.limit ?? 1000;
    const offset = params?.offset ?? 0;

    const { data, isLoading, error, mutate } = useSWR<BackendResponse<IStopListItem[]>>(
        [endpoints.stopList.list, { params: { limit, offset } }],
        fetcher,
        swrOptions
    );

    const stopList = useMemo<IStopListItem[]>(() => data?.data ?? [], [data]);

    const stoppedGoodsMap = useMemo(() => {
        const map = new Map<string, IStopListItem>();
        stopList.forEach((item) => {
            if (item.type === 'goods' && item.good_id) {
                map.set(item.good_id, item);
            }
        });
        return map;
    }, [stopList]);

    return {
        stopList,
        stoppedGoodsMap,
        isLoading,
        error,
        mutate,
    };
}

export function useCreateStopListItem() {
    const createStopListItem = useCallback(async (payload: ICreateStopListRequest) => {
        try {
            const response = await poster<BackendResponse<IStopListItem>>(endpoints.stopList.create, payload);
            toast.success('Item added to stop list');
            return response.data;
        } catch (error) {
            toast.error('Failed to add item to stop list');
            throw error;
        }
    }, []);

    return { createStopListItem };
}

export function useDeleteStopListItem() {
    const deleteStopListItem = useCallback(async (id: string) => {
        try {
            await deleter(endpoints.stopList.delete(id));
            toast.success('Item removed from stop list');
        } catch (error) {
            toast.error('Failed to remove item from stop list');
            throw error;
        }
    }, []);

    return { deleteStopListItem };
}
