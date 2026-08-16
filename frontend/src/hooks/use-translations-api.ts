import type { AxiosError } from 'axios';
import type { ITranslationItem, ITranslationFormData } from 'src/types/departments.tsx';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export interface UseTranslationsAPIReturn {
    getTranslations: () => Promise<ITranslationItem[]>;
    getTranslationById: (id: string) => Promise<ITranslationItem | null>;
    createTranslation: (data: ITranslationFormData) => Promise<ITranslationItem>;
    updateTranslation: (id: string, data: ITranslationFormData) => Promise<ITranslationItem>;
    deleteTranslation: (id: string) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Translations CRUD API operations uchun hook
 */
export function useTranslationsAPI(): UseTranslationsAPIReturn {
    /**
     * Barcha translations'ni oladi
     */
    const getTranslations = useCallback(async (): Promise<ITranslationItem[]> => {
        try {
            const response = await fetcher<BackendResponse<ITranslationItem[]>>(endpoints.translations.list);
            if (Array.isArray(response)) {
                return response;
            } else if (response?.data && Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch translations';
            toast.error(message);
            return [];
        }
    }, []);

    /**
     * ID orqali translation'ni oladi
     */
    const getTranslationById = useCallback(async (id: string): Promise<ITranslationItem | null> => {
        try {
            const response = await fetcher<BackendResponse<ITranslationItem>>(endpoints.translations.list);
            // Since API doesn't provide a single endpoint, we fetch all and filter
            if (Array.isArray(response)) {
                return response.find((t) => t.id === id) || null;
            } else if (response?.data && Array.isArray(response.data)) {
                return response.data.find((t) => t.id === id) || null;
            }
            return null;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch translation';
            toast.error(message);
            return null;
        }
    }, []);

    /**
     * Yangi translation'ni yaratadi
     */
    const createTranslation = useCallback(async (data: ITranslationFormData): Promise<ITranslationItem> => {
        try {
            const response = await poster<BackendResponse<ITranslationItem>>(endpoints.translations.create, data);
            // Extract data from wrapped response
            let translationData: ITranslationItem;
            if ('id' in response && 'en' in response) {
                translationData = response as unknown as ITranslationItem;
            } else if (response?.data) {
                translationData = response.data;
            } else {
                throw new Error('Invalid response format');
            }

            toast.success('Translation created successfully');
            return translationData;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to create translation';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Translation'ni yangilaydi
     */
    const updateTranslation = useCallback(
        async (id: string, data: ITranslationFormData): Promise<ITranslationItem> => {
            try {
                const response = await putter<BackendResponse<ITranslationItem>>(
                    endpoints.translations.update(id),
                    data
                );

                // Extract data from wrapped response
                let translationData: ITranslationItem;
                if ('id' in response && 'en' in response) {
                    translationData = response as unknown as ITranslationItem;
                } else if (response?.data) {
                    translationData = response.data;
                } else {
                    throw new Error('Invalid response format');
                }

                toast.success('Translation updated successfully');
                return translationData;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to update translation';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Translation'ni o'chiradi
     */
    const deleteTranslation = useCallback(async (id: string): Promise<void> => {
        try {
            await deleter(endpoints.translations.delete(id));
            toast.success('Translation deleted successfully');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete translation';
            toast.error(message);
            throw error;
        }
    }, []);

    return {
        getTranslations,
        getTranslationById,
        createTranslation,
        updateTranslation,
        deleteTranslation,
    };
}
