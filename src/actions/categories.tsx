import type { SWRConfiguration } from 'swr';
import type { ICategory, ICategoryFormData, IGoodsItem } from 'src/types/category';
import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';
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
    code: number;
}

/**
 * Helper function to enrich categories with storage and department names
 */
function enrichCategories(
    categoriesData: ICategory[],
    storages: any[],
    departments: any[]
): ICategory[] {
    const storageMap = new Map(
        storages?.map((storage: any) => [storage.id, storage.name]) || []
    );
    const departmentMap = new Map(
        departments?.map((dept: any) => [dept.id, dept.name]) || []
    );

    return categoriesData.map((cat) => ({
        ...cat,
        storage_name: storageMap.get(cat.storage_id) || cat.storage_id || '-',
        department_name: departmentMap.get(cat.department_id) || cat.department_id || '-',
    }));
}

/**
 * Get all categories
 */
export function useGetCategories() {
    const url = endpoints.category.list;

    // Get storages and departments for enrichment
    const { storages } = useGetStorages();
    const { departments } = useGetDepartments();

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICategory[]>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedCategories = useMemo(() => {
        const categories = data?.data || [];
        return enrichCategories(categories, storages, departments);
    }, [data?.data, storages, departments]);

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

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICategory>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const memoizedValue = useMemo(
        () => ({
            category: data?.data,
            categoryLoading: isLoading,
            categoryError: error,
            categoryValidating: isValidating,
        }),
        [data, error, isLoading, isValidating]
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

