import type { SWRConfiguration } from 'swr';
import type { ITranslationItem } from 'src/types/departments.tsx';
import type { ICategory, IGoodsItem, ICategoryFormData } from 'src/types/category';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';
import { useGetStorages, useGetDepartments } from 'src/actions/departments';

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
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
    };
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
        let translationFields: any = {};

        if (cat.name_i18n) {
            const translation = translationMap.get(cat.name_i18n);
            if (translation) {
                // Add translation fields for editing
                translationFields = {
                    name_en: translation.en || '',
                    name_ru: translation.ru || '',
                    name_uz: translation.uz || '',
                    name: translation.uz || cat.name, // Store uz value as fallback
                };

                // Try to get exact language match
                const langKey = getLangKey(currentLanguage);
                if (translation[langKey]) {
                    localizedName = translation[langKey] as string;
                } else if (translation.uz) {
                    // Fallback to uz
                    localizedName = translation.uz as string;
                } else if (translation.en) {
                    // Fallback to English
                    localizedName = translation.en as string;
                } else if (translation.ru) {
                    // Fallback to Russian
                    localizedName = translation.ru as string;
                } else {
                    // Last resort: use original name
                    localizedName = cat.name;
                }
            } else {
                translationFields = {
                    name_en: cat.name_en || '',
                    name_ru: cat.name_ru || '',
                    name_uz: cat.name || '',
                    name: cat.name, // Uzbek nomini default qilib qo'y
                };
                localizedName = cat.name;
            }
        } else {
            translationFields = {
                name_en: cat.name_en || '',
                name_ru: cat.name_ru || '',
                name_uz: cat.name || '',
                name: cat.name,
            };
            localizedName = cat.name;
        }

        return {
            ...cat,
            name: localizedName,
            ...translationFields,
            storage_name: storageMap.get(cat.storage_id) || cat.storage_id || '-',
            department_name: departmentMap.get(cat.department_id) || '-',
        };
    });
}

/**
 * Enrich categories from expand payload (no extra API calls)
 */
function enrichCategoriesFromExpand(
    categoriesData: ICategory[],
    currentLanguage: string = 'uz'
): ICategory[] {
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

    return categoriesData.map((cat: any) => {
        const expandedDept = cat?._expand?.department_id;
        const expandedName = cat?._expand?.name_i18n;
        const langKey = getLangKey(currentLanguage);

        const localizedName =
            expandedName?.[langKey] ||
            expandedName?.uz ||
            expandedName?.en ||
            expandedName?.ru ||
            cat.name;

        return {
            ...cat,
            name: localizedName,
            name_en: expandedName?.en || cat.name_en || cat.name,
            name_ru: expandedName?.ru || cat.name_ru || cat.name,
            name_uz: expandedName?.uz || cat.name_uz || cat.name,
            department_name: expandedDept?.name || cat.department_name || '-',
        };
    });
}

/**
 * Get all categories
 */
export function useGetCategories(searchQuery?: string) {
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

    const normalizedQuery = searchQuery?.trim() || '';
    const swrKey = normalizedQuery
        ? [endpoints.category.search, { params: { q: normalizedQuery } }]
        : endpoints.category.list;

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICategory[]> | ICategory[]>(
        swrKey,
        fetcher,
        { ...swrOptions }
    );

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    const enrichedCategories = useMemo(() => {
        let categories: ICategory[] = [];
        if (Array.isArray(data)) {
            categories = data;
        } else if (Array.isArray(data?.data)) {
            categories = data.data;
        }
        return enrichCategories(categories, storages, departments, translations, i18n.resolvedLanguage);
    }, [data, storages, departments, translations, i18n.resolvedLanguage]);

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
 * Get categories with server-side pagination using expand (no extra API calls)
 */
export function useGetCategoriesPage(params?: { search?: string; limit?: number; offset?: number }) {
    const { i18n } = useTranslation();

    const normalizedQuery = params?.search?.trim() || '';
    const limit = typeof params?.limit === 'number' ? params?.limit : 20;
    const offset = typeof params?.offset === 'number' ? params?.offset : 0;
    const expand = 'name_i18n,department_id';

    const swrKey = normalizedQuery
        ? [endpoints.category.search, { params: { q: normalizedQuery, limit, offset, expand } }]
        : [endpoints.category.list, { params: { limit, offset, expand } }];

    const { data, isLoading, error, isValidating } = useSWR<
        BackendResponse<ICategory[]> | ICategory[]
    >(swrKey, fetcher, { ...swrOptions });

    const categories = useMemo(() => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    }, [data]);

    const enrichedCategories = useMemo(
        () => enrichCategoriesFromExpand(categories, i18n.resolvedLanguage),
        [categories, i18n.resolvedLanguage]
    );

    const memoizedValue = useMemo(
        () => ({
            categories: enrichedCategories,
            categoriesLoading: isLoading,
            categoriesError: error,
            categoriesValidating: isValidating,
            categoriesEmpty: !isLoading && !isValidating && !enrichedCategories.length,
            pagination: (data as BackendResponse<ICategory[]>)?.pagination,
        }),
        [enrichedCategories, error, isLoading, isValidating, data]
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

                // Note: Mutations are now handled by the caller (edit-view) to ensure proper cache ordering
                // await mutate(endpoints.category.list);
                // await mutate(endpoints.category.details(categoryId));

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
            return data;
        }
        if ('data' in data) {
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

/**
 * Get all goods (not filtered by category)
 */
export function useGetGoodsAll(params?: { limit?: number; offset?: number }) {
    const limit = typeof params?.limit === 'number' ? params.limit : 1000;
    const offset = typeof params?.offset === 'number' ? params.offset : 0;
    const url = [endpoints.meals.list, { params: { limit, offset } }];

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IGoodsItem[]> | IGoodsItem[]>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const goods = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if ('data' in data) return (data as BackendResponse<IGoodsItem[]>).data || [];
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
