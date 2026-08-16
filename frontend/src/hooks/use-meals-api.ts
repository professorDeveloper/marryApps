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
    createMealWithCalculations: (data: any) => Promise<any>;
    updateMeal: (id: string, data: Partial<IMealsItem>) => Promise<IMealsItem>;
    deleteMeal: (id: string) => Promise<void>;
    deleteMeals: (ids: string[]) => Promise<void>;
    getCategories: () => Promise<any[]>;
    getDepartments: () => Promise<any[]>;
}

// ============================================================================
// REFERENCE DATA CACHE
// Categories and departments change rarely. Cache them for 5 minutes so that
// getMeals() and getMealById() don't each fire two extra requests per call.
// ============================================================================

const REFERENCE_CACHE_TTL_MS = 5 * 60 * 1000;

let _categoriesCache: { data: any[]; fetchedAt: number } | null = null;
let _departmentsCache: { data: any[]; fetchedAt: number } | null = null;
let _categoriesPromise: Promise<any[]> | null = null;
let _departmentsPromise: Promise<any[]> | null = null;

async function getCachedCategories(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const now = Date.now();
    if (_categoriesCache && now - _categoriesCache.fetchedAt < REFERENCE_CACHE_TTL_MS) {
        return _categoriesCache.data;
    }
    if (!_categoriesPromise) {
        _categoriesPromise = fetchFn().catch(() => []);
    }
    const data = await _categoriesPromise;
    _categoriesCache = { data, fetchedAt: Date.now() };
    _categoriesPromise = null;
    return data;
}

async function getCachedDepartments(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const now = Date.now();
    if (_departmentsCache && now - _departmentsCache.fetchedAt < REFERENCE_CACHE_TTL_MS) {
        return _departmentsCache.data;
    }
    if (!_departmentsPromise) {
        _departmentsPromise = fetchFn().catch(() => []);
    }
    const data = await _departmentsPromise;
    _departmentsCache = { data, fetchedAt: Date.now() };
    _departmentsPromise = null;
    return data;
}

// ============================================================================
// HELPERS
// ============================================================================

const parseNumberOrZero = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return Number.isNaN(num) ? 0 : num;
    }
    return 0;
};

const parseNumberOrUndefined = (value: unknown): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return Number.isNaN(num) ? undefined : num;
    }
    return undefined;
};

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
    const fetchCategoriesRaw = useCallback(async (): Promise<any[]> => {
        const res = await fetcher<BackendResponse<any[]>>(endpoints.category.list);
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
    }, []);

    const fetchDepartmentsRaw = useCallback(async (): Promise<any[]> => {
        const res = await fetcher<BackendResponse<any[]>>(endpoints.department.list);
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
    }, []);

    const getMeals = useCallback(async (): Promise<IMealsItem[]> => {
        try {
            const [mealsResponse, categoriesData, departmentsData] = await Promise.all([
                fetcher<BackendResponse<IMealAPIResponse[]>>(endpoints.meals.list),
                getCachedCategories(fetchCategoriesRaw),
                getCachedDepartments(fetchDepartmentsRaw),
            ]);

            // Extract meals data from wrapped response
            let mealsData: IMealAPIResponse[] = [];
            if (Array.isArray(mealsResponse)) {
                mealsData = mealsResponse;
            } else if (mealsResponse?.data && Array.isArray(mealsResponse.data)) {
                mealsData = mealsResponse.data;
            }

            // ID -> Name mapping (categoriesData/departmentsData already extracted by cache helpers)
            const categoryMap = new Map(categoriesData?.map((cat: any) => [cat.id, cat.name]) || []);
            const departmentMap = new Map(
                departmentsData?.map((dept: any) => [dept.id, dept.name]) || []
            );

            // Meals'ni enrich qiladi
            const enrichedMeals: IMealsItem[] = mealsData.map((meal) => ({
                    ...meal,
                    price: parseNumberOrZero(meal.price),
                    cost_price: parseNumberOrUndefined(meal.cost_price),
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
    }, [fetchCategoriesRaw, fetchDepartmentsRaw]);

    /**
     * ID bo'yicha single meal'ni oladi
     */
    const getMealById = useCallback(
        async (id: string): Promise<IMealsItem | null> => {
            try {
                const [mealResponse, categoriesData, departmentsData] = await Promise.all([
                    fetcher<BackendResponse<IMealAPIResponse>>(endpoints.meals.details(id)),
                    getCachedCategories(fetchCategoriesRaw),
                    getCachedDepartments(fetchDepartmentsRaw),
                ]);

                let mealData: IMealAPIResponse | null = null;
                if (mealResponse) {
                    if ('id' in mealResponse && 'name' in mealResponse) {
                        mealData = mealResponse as unknown as IMealAPIResponse;
                    } else if (mealResponse?.data) {
                        mealData = mealResponse.data as IMealAPIResponse;
                    }
                }

                if (!mealData) {
                    return null;
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
                    price: parseNumberOrZero(mealData.price),
                    cost_price: parseNumberOrUndefined(mealData.cost_price),
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
        [fetchCategoriesRaw, fetchDepartmentsRaw]
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
                    price: parseNumberOrZero(mealData.price),
                    cost_price: parseNumberOrUndefined(mealData.cost_price),
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
                    price: parseNumberOrZero(mealData.price),
                    cost_price: parseNumberOrUndefined(mealData.cost_price),
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

    /**
     * Meal'ni calculations bilan birga yaratadi (yangi qulayroq API)
     * 
     * Payload example:
     * {
     *   "compound_calculations": [{ "compound_id": "...", "quantity": "3" }],
     *   "good": { "category_id": "...", "color_code": "#...", "cook_time": 30, ... },
     *   "ingredient_calculations": [{ "ingredient_id": "...", "quantity": "2.5" }]
     * }
     */
    const createMealWithCalculations = useCallback(
        async (payload: {
            good: any;
            ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
            compound_calculations?: Array<{ compound_id: string; quantity: string }>;
        }): Promise<any> => {
            try {
                const payloadToSend = {
                    good: {
                        name: payload.good.name,
                        description: payload.good.description,
                        category_id: payload.good.category_id,
                        department_id: payload.good.department_id,
                        picture_url: payload.good.picture_url || null,
                        price: String(payload.good.price || 0),
                        cook_time: payload.good.cook_time || 0,
                        color_code: payload.good.color_code || null,
                    },
                    ingredient_calculations: payload.ingredient_calculations || [],
                    compound_calculations: payload.compound_calculations || [],
                };

                const response = await poster<BackendResponse<any>>(
                    endpoints.meals.createWithCalculations,
                    payloadToSend
                );

                // Extract data from wrapped response
                let data: any;
                if ('good' in response && 'calculations' in response) {
                    data = response;
                } else if (response?.data) {
                    data = response.data;
                } else {
                    throw new Error('Invalid response format');
                }

                toast.success('Meal with calculations created successfully');
                return data;
            } catch (error) {
                toast.error('Failed to create meal with calculations');
                console.error('Failed to create meal with calculations:', error);
                throw error;
            }
        },
        []
    );

    return {
        getMeals,
        getMealById,
        createMeal,
        createMealWithCalculations,
        updateMeal,
        deleteMeal,
        deleteMeals,
        getCategories,
        getDepartments,
    };
}
