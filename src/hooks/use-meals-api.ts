import type { IMealsItem, IMealAPIResponse } from 'src/types/meals';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface UseMealsAPIReturn {
    getMeals: () => Promise<IMealsItem[]>;
    getMealById: (id: string) => Promise<IMealsItem | null>;
    createMeal: (data: Partial<IMealsItem>) => Promise<IMealsItem>;
    updateMeal: (id: string, data: Partial<IMealsItem>) => Promise<IMealsItem>;
    deleteMeal: (id: string) => Promise<void>;
    deleteMeals: (ids: string[]) => Promise<void>;
    getCategories: () => Promise<any[]>;
    getDepartments: () => Promise<any[]>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Meals CRUD API operations uchun hook
 */
export function useMealsAPI(): UseMealsAPIReturn {
    /**
     * Barcha meals'ni oladi va category/department names'ni enrich qiladi
     */
    const getMeals = useCallback(async (): Promise<IMealsItem[]> => {
        try {
            // Parallel'da meals, categories va departments'ni oladi
            const [mealsData, categoriesData, departmentsData] = await Promise.all([
                fetcher<IMealAPIResponse[]>(endpoints.meals.list),
                fetcher<any[]>(endpoints.category.list).catch(() => []),
                fetcher<any[]>(endpoints.department.list).catch(() => []),
            ]);

            // ID -> Name mapping
            const categoryMap = new Map(categoriesData?.map((cat: any) => [cat.id, cat.name]) || []);
            const departmentMap = new Map(
                departmentsData?.map((dept: any) => [dept.id, dept.name]) || []
            );

            // Meals'ni enrich qiladi
            const enrichedMeals: IMealsItem[] = mealsData.map((meal) => ({
                ...meal,
                price: typeof meal.price === 'string' ? parseFloat(meal.price) : meal.price,
                coverUrl: meal.picture_url || '',
                category: meal.category_id ? {
                    id: meal.category_id,
                    name: categoryMap.get(meal.category_id) || meal.category_id,
                } : undefined,
                department: meal.department_id ? {
                    id: meal.department_id,
                    name: departmentMap.get(meal.department_id) || meal.department_id,
                } : undefined,
            }));

            return enrichedMeals;
        } catch (error) {
            toast.error('Failed to load meals');
            console.error('Failed to fetch meals:', error);
            return [];
        }
    }, []);

    /**
     * ID bo'yicha single meal'ni oladi
     */
    const getMealById = useCallback(
        async (id: string): Promise<IMealsItem | null> => {
            try {
                // Parallel'da meal, category va department ma'lumotlarini oladi
                const [mealData, categoriesData, departmentsData] = await Promise.all([
                    fetcher<IMealAPIResponse>(endpoints.meals.details(id)),
                    fetcher<any[]>(endpoints.category.list).catch(() => []),
                    fetcher<any[]>(endpoints.department.list).catch(() => []),
                ]);

                // ID -> Name mapping
                const categoryMap = new Map(
                    categoriesData?.map((cat: any) => [cat.id, cat.name]) || []
                );
                const departmentMap = new Map(
                    departmentsData?.map((dept: any) => [dept.id, dept.name]) || []
                );

                const enriched: IMealsItem = {
                    ...mealData,
                    price: typeof mealData.price === 'string' ? parseFloat(mealData.price) : mealData.price,
                    coverUrl: mealData.picture_url || '',
                    category: mealData.category_id ? {
                        id: mealData.category_id,
                        name: categoryMap.get(mealData.category_id) || mealData.category_id,
                    } : undefined,
                    department: mealData.department_id ? {
                        id: mealData.department_id,
                        name: departmentMap.get(mealData.department_id) || mealData.department_id,
                    } : undefined,
                };
                return enriched;
            } catch (error) {
                toast.error('Failed to load meal details');
                console.error('Failed to fetch meal by id:', error);
                return null;
            }
        },
        []
    );

    /**
     * Yangi meal yaratadi
     */
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

                const response = await poster<IMealAPIResponse>(
                    endpoints.meals.create,
                    payload
                );

                const enriched: IMealsItem = {
                    ...response,
                    price: typeof response.price === 'string' ? parseFloat(response.price) : response.price,
                    coverUrl: response.picture_url || '',
                };

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

    /**
     * Meal'ni update qiladi
     */
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

                const response = await putter<IMealAPIResponse>(
                    endpoints.meals.update(id),
                    payload
                );

                const enriched: IMealsItem = {
                    ...response,
                    price: typeof response.price === 'string' ? parseFloat(response.price) : response.price,
                    coverUrl: response.picture_url || '',
                };

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

    /**
     * Meal'ni delete qiladi
     */
    const deleteMeal = useCallback(
        async (id: string): Promise<void> => {
            try {
                await deleter(endpoints.meals.delete(id));
                toast.success('Meal deleted successfully');
            } catch (error) {
                toast.error('Failed to delete meal');
                console.error('Failed to delete meal:', error);
                throw error;
            }
        },
        []
    );

    /**
     * Ko'p meals'ni delete qiladi
     */
    const deleteMeals = useCallback(
        async (ids: string[]): Promise<void> => {
            try {
                await Promise.all(ids.map((id) => deleter(endpoints.meals.delete(id))));
                toast.success('Meals deleted successfully');
            } catch (error) {
                toast.error('Failed to delete meals');
                console.error('Failed to delete meals:', error);
                throw error;
            }
        },
        []
    );

    /**
     * Barcha categoriesni oladi
     */
    const getCategories = useCallback(async (): Promise<any[]> => {
        try {
            const data = await fetcher<any[]>(endpoints.category.list);
            return data || [];
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    }, []);

    /**
     * Barcha departmentsni oladi
     */
    const getDepartments = useCallback(async (): Promise<any[]> => {
        try {
            const data = await fetcher<any[]>(endpoints.department.list);
            return data || [];
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            return [];
        }
    }, []);

    return {
        getMeals,
        getMealById,
        createMeal,
        updateMeal,
        deleteMeal,
        deleteMeals,
        getCategories,
        getDepartments,
    };
}
