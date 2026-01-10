import type { IMealsItem, IMealAPIResponse } from 'src/types/meals';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

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
            const [mealsResponse, categoriesResponse, departmentsResponse] = await Promise.all([
                fetcher<BackendResponse<IMealAPIResponse[]>>(endpoints.meals.list),
                fetcher<BackendResponse<any[]>>(endpoints.category.list).catch(() => null),
                fetcher<BackendResponse<any[]>>(endpoints.department.list).catch(() => null),
            ]);

            // Extract data from wrapped response
            let mealsData: IMealAPIResponse[] = [];
            if (Array.isArray(mealsResponse)) {
                mealsData = mealsResponse;
            } else if (mealsResponse?.data && Array.isArray(mealsResponse.data)) {
                mealsData = mealsResponse.data;
            }

            let categoriesData: any[] = [];
            if (categoriesResponse) {
                if (Array.isArray(categoriesResponse)) {
                    categoriesData = categoriesResponse;
                } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
                    categoriesData = categoriesResponse.data;
                }
            }

            let departmentsData: any[] = [];
            if (departmentsResponse) {
                if (Array.isArray(departmentsResponse)) {
                    departmentsData = departmentsResponse;
                } else if (departmentsResponse?.data && Array.isArray(departmentsResponse.data)) {
                    departmentsData = departmentsResponse.data;
                }
            }

            // ID -> Name mapping
            const categoryMap = new Map(categoriesData?.map((cat: any) => [cat.id, cat.name]) || []);
            const departmentMap = new Map(
                departmentsData?.map((dept: any) => [dept.id, dept.name]) || []
            );

            // Meals'ni enrich qiladi
            const enrichedMeals: IMealsItem[] = mealsData.map((meal) => {
                // Parse price safely
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
                    category: meal.category_id ? {
                        id: meal.category_id,
                        name: categoryMap.get(meal.category_id) || meal.category_id,
                    } : undefined,
                    department: meal.department_id ? {
                        id: meal.department_id,
                        name: departmentMap.get(meal.department_id) || meal.department_id,
                    } : undefined,
                };
            });

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
                const [mealResponse, categoriesResponse, departmentsResponse] = await Promise.all([
                    fetcher<BackendResponse<IMealAPIResponse>>(endpoints.meals.details(id)),
                    fetcher<BackendResponse<any[]>>(endpoints.category.list).catch(() => null),
                    fetcher<BackendResponse<any[]>>(endpoints.department.list).catch(() => null),
                ]);

                // Extract data from wrapped response
                let mealData: IMealAPIResponse | null = null;
                if (mealResponse) {
                    if ('id' in mealResponse && 'name' in mealResponse) {
                        // Direct meal object
                        mealData = mealResponse as unknown as IMealAPIResponse;
                    } else if (mealResponse?.data) {
                        mealData = mealResponse.data as IMealAPIResponse;
                    }
                }

                if (!mealData) {
                    return null;
                }

                let categoriesData: any[] = [];
                if (categoriesResponse) {
                    if (Array.isArray(categoriesResponse)) {
                        categoriesData = categoriesResponse;
                    } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
                        categoriesData = categoriesResponse.data;
                    }
                }

                let departmentsData: any[] = [];
                if (departmentsResponse) {
                    if (Array.isArray(departmentsResponse)) {
                        departmentsData = departmentsResponse;
                    } else if (departmentsResponse?.data && Array.isArray(departmentsResponse.data)) {
                        departmentsData = departmentsResponse.data;
                    }
                }

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

                const response = await poster<BackendResponse<IMealAPIResponse>>(
                    endpoints.meals.create,
                    payload
                );

                // Extract data from wrapped response
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
                    price: typeof mealData.price === 'string' ? parseFloat(mealData.price) : mealData.price,
                    coverUrl: mealData.picture_url || '',
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

                const response = await putter<BackendResponse<IMealAPIResponse>>(
                    endpoints.meals.update(id),
                    payload
                );

                // Extract data from wrapped response
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
                    price: typeof mealData.price === 'string' ? parseFloat(mealData.price) : mealData.price,
                    coverUrl: mealData.picture_url || '',
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
            const response = await fetcher<BackendResponse<any[]>>(endpoints.category.list);
            if (Array.isArray(response)) {
                return response;
            } else if (response?.data && Array.isArray(response.data)) {
                return response.data;
            }
            return [];
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
            const response = await fetcher<BackendResponse<any[]>>(endpoints.department.list);
            if (Array.isArray(response)) {
                return response;
            } else if (response?.data && Array.isArray(response.data)) {
                return response.data;
            }
            return [];
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
