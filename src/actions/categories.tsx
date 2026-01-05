import type { SWRConfiguration } from 'swr';
import type { ICategory, ICategoryFormData } from 'src/types/category';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';

// ============================================================================
// CONFIGURATION
// ============================================================================

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

// ============================================================================
// CATEGORIES HOOKS
// ============================================================================

/**
 * Get all categories
 */
export function useGetCategories() {
    const url = endpoints.category.list;

    const { data, isLoading, error, isValidating } = useSWR<ICategory[]>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const memoizedValue = useMemo(
        () => ({
            categories: data || [],
            categoriesLoading: isLoading,
            categoriesError: error,
            categoriesValidating: isValidating,
            categoriesEmpty: !isLoading && !isValidating && !data?.length,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single category by ID
 */
export function useGetCategory(categoryId: string) {
    const url = categoryId ? endpoints.category.details(categoryId) : '';

    const { data, isLoading, error, isValidating } = useSWR<ICategory>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const memoizedValue = useMemo(
        () => ({
            category: data,
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
