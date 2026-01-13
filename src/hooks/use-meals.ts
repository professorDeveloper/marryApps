import type { SWRConfiguration } from 'swr';
import type { IMealsItem, IMealAPIResponse } from 'src/types/meals';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';
import { useGetCategories } from 'src/actions/categories';
import { useGetDepartments } from 'src/actions/departments';

import { toast } from 'sonner';

// ============================================================================
// CONFIGURATION
// ============================================================================

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

// ============================================================================
// TYPES
// ============================================================================

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enrich meals with category and department names
 */
function enrichMeals(
    mealsData: IMealAPIResponse[],
    categories: any[],
    departments: any[]
): IMealsItem[] {
    const categoryMap = new Map(categories?.map((cat: any) => [cat.id, cat.name]) || []);
    const departmentMap = new Map(departments?.map((dept: any) => [dept.id, dept.name]) || []);

    return mealsData.map((meal) => {
        let parsedPrice: number = 0;
        if (typeof meal.price === 'string') {
            const num = parseFloat(meal.price);
            parsedPrice = isNaN(num) ? 0 : num;
        } else if (typeof meal.price === 'number') {
            parsedPrice = meal.price;
        }

        return {
            ...meal,
            price: parsedPrice,
            coverUrl: meal.picture_url || '',
            category: meal.category_id
                ? {
                    id: meal.category_id,
                    name: categoryMap.get(meal.category_id) || meal.category_id,
                }
                : undefined,
            department: meal.department_id
                ? {
                    id: meal.department_id,
                    name: departmentMap.get(meal.department_id) || meal.department_id,
                }
                : undefined,
        };
    });
}

/**
 * Enrich single meal with category and department names
 */
function enrichMeal(
    mealData: IMealAPIResponse,
    categories: any[],
    departments: any[]
): IMealsItem {
    const categoryMap = new Map(categories?.map((cat: any) => [cat.id, cat.name]) || []);
    const departmentMap = new Map(departments?.map((dept: any) => [dept.id, dept.name]) || []);

    return {
        ...mealData,
        price:
            typeof mealData.price === 'string'
                ? parseFloat(mealData.price)
                : mealData.price,
        coverUrl: mealData.picture_url || '',
        category: mealData.category_id
            ? {
                id: mealData.category_id,
                name: categoryMap.get(mealData.category_id) || mealData.category_id,
            }
            : undefined,
        department: mealData.department_id
            ? {
                id: mealData.department_id,
                name: departmentMap.get(mealData.department_id) || mealData.department_id,
            }
            : undefined,
    };
}

// ============================================================================
// MEALS HOOKS
// ============================================================================

/**
 * Get all meals with enriched category and department names
 */
export function useGetMeals() {
    const url = endpoints.meals.list;

    // Get categories and departments for enrichment
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();

    const { data, isLoading, error, isValidating, mutate: mutateMeals } = useSWR<
        BackendResponse<IMealAPIResponse[]> | IMealAPIResponse[]
    >(url, fetcher, { ...swrOptions });

    const enrichedMeals = useMemo(() => {
        let mealsData: IMealAPIResponse[] = [];

        if (Array.isArray(data)) {
            mealsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
            mealsData = data.data;
        }

        return enrichMeals(mealsData, categories, departments);
    }, [data, categories, departments]);

    const memoizedValue = useMemo(
        () => ({
            meals: enrichedMeals,
            mealsLoading: isLoading,
            mealsError: error,
            mealsValidating: isValidating,
            mealsEmpty: !isLoading && !isValidating && enrichedMeals.length === 0,
            mutate: mutateMeals,
        }),
        [enrichedMeals, error, isLoading, isValidating, mutateMeals]
    );

    return memoizedValue;
}

/**
 * Get single meal by ID with enriched category and department names
 */
export function useGetMeal(mealId: string) {
    const url = mealId ? endpoints.meals.details(mealId) : null;

    // Get categories and departments for enrichment
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();

    const { data, isLoading, error, isValidating, mutate: mutateMeal } = useSWR<
        BackendResponse<IMealAPIResponse> | IMealAPIResponse
    >(url, fetcher, { ...swrOptions });

    const enrichedMeal = useMemo(() => {
        if (!data) return null;

        let mealData: IMealAPIResponse | null = null;
        if ('id' in data && 'name' in data) {
            mealData = data as unknown as IMealAPIResponse;
        } else if (data && typeof data === 'object' && 'data' in data) {
            mealData = (data as BackendResponse<IMealAPIResponse>).data;
        }

        if (!mealData) return null;

        return enrichMeal(mealData, categories, departments);
    }, [data, categories, departments]);

    const memoizedValue = useMemo(
        () => ({
            meal: enrichedMeal,
            mealLoading: isLoading,
            mealError: error,
            mealValidating: isValidating,
            mutate: mutateMeal,
        }),
        [enrichedMeal, error, isLoading, isValidating, mutateMeal]
    );

    return memoizedValue;
}

/**
 * Create new meal
 */
export function useCreateMeal() {
    const createMeal = useCallback(
        async (data: Partial<IMealsItem>): Promise<IMealsItem> => {
            try {
                const payload = {
                    name: data.name,
                    description: data.description,
                    category_id: data.category_id,
                    department_id: data.department_id,
                    picture_url: data.picture_url || null,
                    price: String(data.price || 0),
                    cook_time: data.cook_time || 0,
                };

                const response = await poster<BackendResponse<IMealAPIResponse>>(
                    endpoints.meals.create,
                    payload
                );

                let mealData: IMealAPIResponse;
                if ('id' in response && 'name' in response) {
                    mealData = response as unknown as IMealAPIResponse;
                } else if (response?.data) {
                    mealData = response.data as IMealAPIResponse;
                } else {
                    throw new Error('Invalid response format');
                }

                const enriched: IMealsItem = {
                    ...mealData,
                    price:
                        typeof mealData.price === 'string'
                            ? parseFloat(mealData.price)
                            : mealData.price,
                    coverUrl: mealData.picture_url || '',
                };

                // Revalidate meals list
                await mutate(endpoints.meals.list);

                toast.success('Meal created successfully');
                return enriched;
            } catch (error) {
                toast.error('Failed to create meal');
                console.error('Failed to create meal:', error);
                throw error;
            }
        },
        []
    );

    return { createMeal };
}

/**
 * Update meal
 */
export function useUpdateMeal() {
    const updateMeal = useCallback(
        async (id: string, data: Partial<IMealsItem>): Promise<IMealsItem> => {
            try {
                const payload = {
                    name: data.name,
                    description: data.description,
                    category_id: data.category_id,
                    department_id: data.department_id,
                    picture_url: data.picture_url || null,
                    price: String(data.price || 0),
                    cook_time: data.cook_time || 0,
                };

                const response = await putter<BackendResponse<IMealAPIResponse>>(
                    endpoints.meals.update(id),
                    payload
                );

                let mealData: IMealAPIResponse;
                if ('id' in response && 'name' in response) {
                    mealData = response as unknown as IMealAPIResponse;
                } else if (response?.data) {
                    mealData = response.data as IMealAPIResponse;
                } else {
                    throw new Error('Invalid response format');
                }

                const enriched: IMealsItem = {
                    ...mealData,
                    price:
                        typeof mealData.price === 'string'
                            ? parseFloat(mealData.price)
                            : mealData.price,
                    coverUrl: mealData.picture_url || '',
                };

                // Revalidate meals list and single meal
                await mutate(endpoints.meals.list);
                await mutate(endpoints.meals.details(id));

                toast.success('Meal updated successfully');
                return enriched;
            } catch (error) {
                toast.error('Failed to update meal');
                console.error('Failed to update meal:', error);
                throw error;
            }
        },
        []
    );

    return { updateMeal };
}

/**
 * Delete meal
 */
export function useDeleteMeal() {
    const deleteMeal = useCallback(
        async (id: string): Promise<void> => {
            try {
                await deleter(endpoints.meals.delete(id));

                // Revalidate meals list
                await mutate(endpoints.meals.list);

                toast.success('Meal deleted successfully');
            } catch (error) {
                toast.error('Failed to delete meal');
                console.error('Failed to delete meal:', error);
                throw error;
            }
        },
        []
    );

    return { deleteMeal };
}

/**
 * Delete multiple meals
 */
export function useDeleteMeals() {
    const deleteMeals = useCallback(
        async (ids: string[]): Promise<void> => {
            try {
                await Promise.all(ids.map((id) => deleter(endpoints.meals.delete(id))));

                // Revalidate meals list
                await mutate(endpoints.meals.list);

                toast.success('Meals deleted successfully');
            } catch (error) {
                toast.error('Failed to delete meals');
                console.error('Failed to delete meals:', error);
                throw error;
            }
        },
        []
    );

    return { deleteMeals };
}

