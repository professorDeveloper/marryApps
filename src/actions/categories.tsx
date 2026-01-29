import type { SWRConfiguration } from 'swr';

import type { ICategoryFormData, IGoodsItem, ICategory } from 'src/types/category';
import type { ITranslationItem } from 'src/types/departments.tsx';

import { useTranslation } from 'react-i18next';
import useSWR, { mutate } from 'swr';
import { useCallback, useMemo } from 'react';

import { deleter, endpoints, fetcher, poster, putter } from 'src/lib/axios';
import { useGetDepartments, useGetStorages } from 'src/actions/departments';

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

/**
 * Helper function to enrich categories with storage, department names and translations
 */
function enrichCategories(
    categoriesData: ICategory[],
    storages: any[],
    departments: any[],
    translations: ITranslationItem[] = [],
    currentLanguage: string = 'uz'
): ICategory[] {
    const storageMap = new Map(
        storages?.map((storage: any) => [storage.id, storage.name]) || []
    );
    const departmentMap = new Map(
        departments?.map((dept: any) => [dept.id, dept.name]) || []
    );

    // Create translations map for quick lookup
    const translationMap = new Map(
        translations?.map((t: ITranslationItem) => [t.id, t]) || []
    );

    // Helper function to map i18n language codes to translation fields
    const getLangKey = (lang: string): keyof ITranslationItem => {
        const langMap: Record<string, keyof ITranslationItem> = {
            'uz': 'uz',
            'uz-Latn': 'uz-Latn',
            'uz-Cyrl': 'uz-Cyrl',
            'ru': 'ru',
            'en': 'en',
        };
        return (langMap[lang] || 'uz') as keyof ITranslationItem;
    };

    return categoriesData.map((cat) => {
        // Get localized name from translation
        let localizedName = cat.name;

        if (cat.name_i18n) {
            const translation = translationMap.get(cat.name_i18n);
            if (translation) {
                // Try to get exact language match
                const langKey = getLangKey(currentLanguage);
                if (translation[langKey]) {
                    localizedName = translation[langKey] as string;
                } else if (translation.uz) {
                    // Fallback to uz
                    localizedName = translation.uz as string;
                } else if (translation.en) {
                    // Final fallback to English
                    localizedName = translation.en as string;
                }
            }
        }

        return {
            ...cat,
            name: localizedName,
            storage_name: storageMap.get(cat.storage_id) || cat.storage_id || '-',
            department_name: departmentMap.get(cat.department_id) || cat.department_id || '-',
        };
    });
}

/**
 * Get all categories
 */
export function useGetCategories() {
    const url = endpoints.category.list;
    const { i18n } = useTranslation();

    // Get storages and departments for enrichment
    const { storages } = useGetStorages();
    const { departments } = useGetDepartments();

    // Fetch translations
    const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
        endpoints.translations.list,
        fetcher,
        { ...swrOptions }
    );

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICategory[]>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    const enrichedCategories = useMemo(() => {
        const categories = data?.data || [];
        return enrichCategories(categories, storages, departments, translations, i18n.resolvedLanguage);
    }, [data?.data, storages, departments, translations, i18n.resolvedLanguage]);

    const memoizedValue = useMemo(
        () => ({
            categories: enrichedCategories,
            categoriesLoading: isLoading,
            categoriesError: error,
            categoriesValidating: isValidating,
            categoriesEmpty: !isLoading && !isValidating && !enrichedCategories.length,
        }),
        [enrichedCategories, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single category by ID
 */
export function useGetCategory(categoryId: string) {
    const url = categoryId ? endpoints.category.details(categoryId) : '';
    const { i18n } = useTranslation();

    // Fetch translations
    const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
        endpoints.translations.list,
        fetcher,
        { ...swrOptions }
    );

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICategory>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    // Enrich single category
    const enrichedCategory = useMemo(() => {
        if (!data?.data) return undefined;
        const enriched = enrichCategories([data.data], [], [], translations, i18n.resolvedLanguage);
        return enriched[0];
    }, [data?.data, translations, i18n.resolvedLanguage]);

    const memoizedValue = useMemo(
        () => ({
            category: enrichedCategory,
            categoryLoading: isLoading,
            categoryError: error,
            categoryValidating: isValidating,
        }),
        [enrichedCategory, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Create new category
 */
export function useCreateCategory() {
    const createCategory = useCallback(
        async (formData: ICategoryFormData) => {
            try {
                const response = await poster<ICategory>(
                    endpoints.category.create,
                    formData
                );

                // Revalidate categories list
                await mutate(endpoints.category.list);

                return response;
            } catch (error) {
                console.error('Failed to create category:', error);
                throw error;
            }
        },
        []
    );

    return { createCategory };
}

/**
 * Update category
 */
export function useUpdateCategory() {
    const updateCategory = useCallback(
        async (categoryId: string, formData: ICategoryFormData) => {
            try {
                const response = await putter<ICategory>(
                    endpoints.category.update(categoryId),
                    formData
                );

                // Revalidate categories list and single category
                await mutate(endpoints.category.list);
                await mutate(endpoints.category.details(categoryId));

                return response;
            } catch (error) {
                console.error('Failed to update category:', error);
                throw error;
            }
        },
        []
    );

    return { updateCategory };
}

/**
 * Delete category
 */
export function useDeleteCategory() {
    const deleteCategory = useCallback(
        async (categoryId: string) => {
            try {
                await deleter(endpoints.category.delete(categoryId));

                // Revalidate categories list
                await mutate(endpoints.category.list);

                return true;
            } catch (error) {
                console.error('Failed to delete category:', error);
                throw error;
            }
        },
        []
    );

    return { deleteCategory };
}


/**
 * Get goods by category ID
 */
export function useGetGoodsByCategory(categoryId: string) {
    const url = categoryId ? endpoints.category.goods(categoryId) : '';

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IGoodsItem[]> | IGoodsItem[]>(
        url,
        fetcher,
        { ...swrOptions }
    );


    // Handle both response formats
    const goods = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) {
            // Direct array response
            console.log('Direct array response:', data);
            return data;
        }
        if ('data' in data) {
            // Wrapped response
            console.log('Wrapped response:', (data as BackendResponse<IGoodsItem[]>).data);
            return (data as BackendResponse<IGoodsItem[]>).data || [];
        }
        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            goods,
            goodsLoading: isLoading,
            goodsError: error,
            goodsValidating: isValidating,
            goodsEmpty: !isLoading && !isValidating && !goods?.length,
        }),
        [goods, error, isLoading, isValidating]
    );

    return memoizedValue;
}

