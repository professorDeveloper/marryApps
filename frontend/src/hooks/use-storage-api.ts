import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface Storage {
    id: string;
    name: string;
    location?: string;
    created_at?: string;
    updated_at?: string;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export interface UseStorageAPIReturn {
    getStorages: () => Promise<Storage[]>;
    getStorageById: (id: string) => Promise<Storage | null>;
    createStorage: (data: Partial<Storage>) => Promise<Storage>;
    updateStorage: (id: string, data: Partial<Storage>) => Promise<Storage>;
    deleteStorage: (id: string) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useStorageAPI(): UseStorageAPIReturn {
    /**
     * Barcha storages'ni oladi
     */
    const getStorages = useCallback(async (): Promise<Storage[]> => {
        try {
            const response = await fetcher<BackendResponse<Storage[]>>(endpoints.storage.list);
            return response.data || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch storages';
            toast.error(message);
            return [];
        }
    }, []);

    /**
     * ID orqali storage'ni oladi
     */
    const getStorageById = useCallback(async (id: string): Promise<Storage | null> => {
        try {
            const response = await fetcher<BackendResponse<Storage>>(endpoints.storage.details(id));
            return response.data || null;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch storage';
            toast.error(message);
            return null;
        }
    }, []);

    /**
     * Yangi storage'ni yaratadi
     */
    const createStorage = useCallback(
        async (data: Partial<Storage>): Promise<Storage> => {
            try {
                const response = await poster<BackendResponse<Storage>>(endpoints.storage.create, data);
                toast.success('Storage created successfully');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to create storage';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Storage'ni yangilaydi
     */
    const updateStorage = useCallback(
        async (id: string, data: Partial<Storage>): Promise<Storage> => {
            try {
                const response = await putter<BackendResponse<Storage>>(endpoints.storage.update(id), data);
                toast.success('Storage updated successfully');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to update storage';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Storage'ni o'chiradi
     */
    const deleteStorage = useCallback(async (id: string): Promise<void> => {
        try {
            await deleter(endpoints.storage.delete(id));
            toast.success('Storage deleted successfully');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete storage';
            toast.error(message);
            throw error;
        }
    }, []);

    return {
        getStorages,
        getStorageById,
        createStorage,
        updateStorage,
        deleteStorage,
    };
}
