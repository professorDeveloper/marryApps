import type { SWRConfiguration } from 'swr';
import type { IMealsItem, IMealAPIResponse } from 'src/types/meals';
import type { ITranslationItem } from 'src/types/departments.tsx';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
    };
    code: number;
}

export interface IMealCalculation {
    id: string;
    good_id: string;
    ingredient_id: string;
    component_compound_id?: string;
    quantity: string;
    measurement_unit: string;
    price_per_unit: string;
    total_cost: string;
    created_at: string;
    updated_at: string;
}

export interface IMealWithCalculations {
    id: string;
    name: string;
    price: string;
    calculations: IMealCalculation[];
    total_cost: string;
    profit: string;
    profit_margin: string;
}

export interface MealsFilters {
    query?: string;
    category_id?: string;
    department_id?: string;
    storage_id?: string;
    limit?: number;
    offset?: number;
    expand?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enrich meals with category, department names and translations
 */
function enrichMeals(
    mealsData: IMealAPIResponse[],
    categories: any[],
    departments: any[],
    translations: ITranslationItem[] = [],
    currentLanguage: string = 'uz'
): IMealsItem[] {
    const categoryMap = new Map(categories?.map((cat: any) => [cat.id, cat.name]) || []);
    const departmentMap = new Map(departments?.map((dept: any) => [dept.id, dept.name]) || []);

    // Create translations map for quick lookup by ID
    const translationMap = new Map(
        translations?.map((t: ITranslationItem) => [t.id, t]) || []
    );

    // Helper function to get translation field based on language
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

    return mealsData.map((meal) => {
        let parsedPrice: number = 0;
        if (typeof meal.price === 'string') {
            const num = parseFloat(meal.price);
            parsedPrice = isNaN(num) ? 0 : num;
        } else if (typeof meal.price === 'number') {
            parsedPrice = meal.price;
        }

        // Get localized names from translation
        let name_en = meal.name;
        let name_ru = meal.name;
        let name_uz = meal.name;

        if (meal.name_i18n) {
            const translation = translationMap.get(meal.name_i18n);
            if (translation) {
                // Extract all language variants
                name_en = (translation.en || meal.name) as string;
                name_ru = (translation.ru || meal.name) as string;
                name_uz = (translation.uz || meal.name) as string;
            }
        }

        return {
            ...meal,
            price: parsedPrice,
            coverUrl: meal.picture_url || '',
            name_en,
            name_ru,
            name_uz,
            category: meal.category_id
                ? {
                    id: meal.category_id,
                    name: categoryMap.get(meal.category_id) || '-',
                }
                : undefined,
            department: meal.department_id
                ? {
                    id: meal.department_id,
                    name: departmentMap.get(meal.department_id) || '-',
                }
                : undefined,
        };
    });
}

/**
 * Enrich meals from expand payload (no extra API calls)
 */
function enrichMealsFromExpand(
    mealsData: IMealAPIResponse[],
    currentLanguage: string = 'uz'
): IMealsItem[] {
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

    return mealsData.map((meal: any) => {
        let parsedPrice: number = 0;
        if (typeof meal.price === 'string') {
            const num = parseFloat(meal.price);
            parsedPrice = isNaN(num) ? 0 : num;
        } else if (typeof meal.price === 'number') {
            parsedPrice = meal.price;
        }

        const expandedCategory = meal?._expand?.category_id;
        const expandedDepartment = meal?._expand?.department_id;
        const expandedName = meal?._expand?.name_i18n;

        const langKey = getLangKey(currentLanguage);
        const localizedName =
            expandedName?.[langKey] ||
            expandedName?.uz ||
            expandedName?.en ||
            meal.name;

        return {
            ...meal,
            name: localizedName,
            price: parsedPrice,
            coverUrl: meal.picture_url || '',
            name_en: expandedName?.en || meal.name,
            name_ru: expandedName?.ru || meal.name,
            name_uz: expandedName?.uz || meal.name,
            category: meal.category_id
                ? {
                    id: meal.category_id,
                    name: expandedCategory?.name || meal.category_name || '-',
                }
                : undefined,
            department: meal.department_id
                ? {
                    id: meal.department_id,
                    name: expandedDepartment?.name || meal.department_name || '-',
                }
                : undefined,
        };
    });
}

/**
 * Enrich single meal with category, department names and translations
 */
function enrichMeal(
    mealData: IMealAPIResponse,
    categories: any[],
    departments: any[],
    translations: ITranslationItem[] = [],
    currentLanguage: string = 'uz'
): IMealsItem {
    const categoryMap = new Map(categories?.map((cat: any) => [cat.id, cat.name]) || []);
    const departmentMap = new Map(departments?.map((dept: any) => [dept.id, dept.name]) || []);

    // Create translations map for quick lookup by ID
    const translationMap = new Map(
        translations?.map((t: ITranslationItem) => [t.id, t]) || []
    );

    // Get localized names from translation
    let name_en = mealData.name;
    let name_ru = mealData.name;
    let name_uz = mealData.name;

    if (mealData.name_i18n) {
        const translation = translationMap.get(mealData.name_i18n);
        if (translation) {
            // Extract all language variants
            name_en = (translation.en || mealData.name) as string;
            name_ru = (translation.ru || mealData.name) as string;
            name_uz = (translation.uz || mealData.name) as string;
        }
    }

    return {
        ...mealData,
        price:
            typeof mealData.price === 'string'
                ? parseFloat(mealData.price)
                : mealData.price,
        coverUrl: mealData.picture_url || '',
        name_en,
        name_ru,
        name_uz,
        category: mealData.category_id
            ? {
                id: mealData.category_id,
                name: categoryMap.get(mealData.category_id) || '-',
            }
            : undefined,
        department: mealData.department_id
            ? {
                id: mealData.department_id,
                name: departmentMap.get(mealData.department_id) || '-',
            }
            : undefined,
    };
}

// ============================================================================
// MEALS HOOKS
// ============================================================================

/**
 * Get all meals with enriched category, department names and translations
 */
export function useGetMeals(searchQuery?: string | MealsFilters) {
    const { i18n } = useTranslation();

    // Get categories and departments for enrichment
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();

    // Fetch translations
    const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
        endpoints.translations.list,
        fetcher,
        { ...swrOptions }
    );

    const filters: MealsFilters =
        typeof searchQuery === 'string' ? { query: searchQuery } : (searchQuery || {});
    const normalizedQuery = filters.query?.trim() || '';
    const params: Record<string, string> = {};

    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.department_id) params.department_id = filters.department_id;
    if (filters.storage_id) params.storage_id = filters.storage_id;

    const swrKey = normalizedQuery
        ? [endpoints.meals.search, { params: { ...params, query: normalizedQuery } }]
        : [endpoints.meals.list, { params }];

    const { data, isLoading, error, isValidating, mutate: mutateMeals } = useSWR<
        BackendResponse<IMealAPIResponse[]> | IMealAPIResponse[]
    >(swrKey, fetcher, { ...swrOptions });

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    const enrichedMeals = useMemo(() => {
        let mealsData: IMealAPIResponse[] = [];

        if (Array.isArray(data)) {
            mealsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
            mealsData = data.data;
        }

        return enrichMeals(mealsData, categories, departments, translations, i18n.resolvedLanguage);
    }, [data, categories, departments, translations, i18n.resolvedLanguage]);

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
 * Get meals with server-side pagination using expand (no extra API calls)
 */
export function useGetMealsPage(filters?: MealsFilters) {
    const { i18n } = useTranslation();

    const normalizedQuery = filters?.query?.trim() || '';
    const limit = typeof filters?.limit === 'number' ? filters?.limit : 20;
    const offset = typeof filters?.offset === 'number' ? filters?.offset : 0;
    const expand = filters?.expand || 'category_id,department_id,name_i18n';

    const params: Record<string, string | number> = {
        limit,
        offset,
        expand,
    };

    if (filters?.category_id) params.category_id = filters.category_id;
    if (filters?.department_id) params.department_id = filters.department_id;
    if (filters?.storage_id) params.storage_id = filters.storage_id;

    const swrKey = normalizedQuery
        ? [endpoints.meals.search, { params: { ...params, query: normalizedQuery } }]
        : [endpoints.meals.list, { params }];

    const { data, isLoading, error, isValidating, mutate: mutateMeals } = useSWR<
        BackendResponse<IMealAPIResponse[]> | IMealAPIResponse[]
    >(swrKey, fetcher, { ...swrOptions });

    const mealsData = useMemo(() => {
        if (Array.isArray(data)) return data;
        if (data?.data && Array.isArray(data.data)) return data.data;
        return [];
    }, [data]);

    const enrichedMeals = useMemo(
        () => enrichMealsFromExpand(mealsData, i18n.resolvedLanguage),
        [mealsData, i18n.resolvedLanguage]
    );

    return {
        meals: enrichedMeals,
        mealsLoading: isLoading,
        mealsError: error,
        mealsValidating: isValidating,
        mealsEmpty: !isLoading && !isValidating && enrichedMeals.length === 0,
        pagination: (data as BackendResponse<IMealAPIResponse[]>)?.pagination,
        mutate: mutateMeals,
    };
}

/**
 * Get single meal by ID with enriched category, department names and translations
 */
export function useGetMeal(mealId: string) {
    const url = mealId ? endpoints.meals.details(mealId) : null;
    const { i18n } = useTranslation();

    // Get categories and departments for enrichment
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();

    // Fetch translations
    const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
        endpoints.translations.list,
        fetcher,
        { ...swrOptions }
    );

    const { data, isLoading, error, isValidating, mutate: mutateMeal } = useSWR<
        BackendResponse<IMealAPIResponse> | IMealAPIResponse
    >(url, fetcher, { ...swrOptions });

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    const enrichedMeal = useMemo(() => {
        if (!data) return null;

        let mealData: IMealAPIResponse | null = null;
        if ('id' in data && 'name' in data) {
            mealData = data as unknown as IMealAPIResponse;
        } else if (data && typeof data === 'object' && 'data' in data) {
            mealData = (data as BackendResponse<IMealAPIResponse>).data;
        }

        if (!mealData) return null;

        return enrichMeal(mealData, categories, departments, translations, i18n.resolvedLanguage);
    }, [data, categories, departments, translations, i18n.resolvedLanguage]);

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
                    name_i18n: (data as any).name_i18n || undefined,
                    description: data.description,
                    description_i18n: (data as any).description_i18n || undefined,
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
                    name_i18n: (data as any).name_i18n || undefined,
                    description: data.description,
                    description_i18n: (data as any).description_i18n || undefined,
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

                // Note: Mutations are now handled by the caller (edit-view) to ensure proper cache ordering
                // await mutate(endpoints.meals.list);
                // await mutate(endpoints.meals.details(id));

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

// ============================================================================
// MEAL CALCULATIONS HOOKS
// ============================================================================

/**
 * Get meal calculations by meal_id
 */
export function useGetMealCalculations(mealId: string | undefined) {
    const url = mealId ? endpoints.meals.calculations(mealId) : null;

    const { data, isLoading, error, isValidating, mutate: mutateCalculations } = useSWR<
        BackendResponse<IMealCalculation[]> | IMealCalculation[]
    >(url, fetcher, { ...swrOptions });

    const calculations = useMemo(() => {
        if (!data) return [];

        if (Array.isArray(data)) {
            return data;
        } else if (data?.data && Array.isArray(data.data)) {
            return data.data;
        }

        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            calculations,
            calculationsLoading: isLoading,
            calculationsError: error,
            calculationsValidating: isValidating,
            mutate: mutateCalculations,
        }),
        [calculations, error, isLoading, isValidating, mutateCalculations]
    );

    return memoizedValue;
}

/**
 * Create meal calculation
 */
export function useCreateMealCalculation() {
    const createCalculation = useCallback(
        async (payload: {
            good_id: string;
            ingredient_id?: string;
            compound_to_add_id?: string;
            quantity: string;
        }): Promise<IMealCalculation> => {
            try {
                const response = await poster<BackendResponse<IMealCalculation>>(
                    endpoints.meals.createCalculation,
                    payload
                );

                // Revalidate calculations for the meal
                if (payload.good_id) {
                    await mutate(endpoints.meals.calculations(payload.good_id));
                }

                toast.success('Calculation created successfully');
                return response.data || (response as unknown as IMealCalculation);
            } catch (error) {
                console.error('Error creating calculation:', error);
                toast.error('Failed to create calculation');
                throw error;
            }
        },
        []
    );

    return { createCalculation };
}

/**
 * Delete meal calculation
 */
export function useDeleteMealCalculation() {
    const deleteCalculation = useCallback(
        async (calculationId: string, mealId: string): Promise<void> => {
            try {
                await deleter(endpoints.meals.deleteCalculation(calculationId));

                // Revalidate calculations for the meal
                if (mealId) {
                    await mutate(endpoints.meals.calculations(mealId));
                }

                toast.success('Calculation deleted successfully');
            } catch (error) {
                console.error('Error deleting calculation:', error);
                toast.error('Failed to delete calculation');
                throw error;
            }
        },
        []
    );

    return { deleteCalculation };
}


/**
 * Get meal with calculations (includes total_cost, profit, profit_margin)
 */
export function useGetMealWithCalculations(mealId: string | undefined) {
    const url = mealId ? endpoints.meals.withCalculations(mealId) : null;

    const { data, isLoading, error, isValidating, mutate: mutateMeal } = useSWR<
        BackendResponse<IMealWithCalculations> | IMealWithCalculations
    >(url, fetcher, { ...swrOptions });

    const mealWithCalculations = useMemo(() => {
        if (!data) return undefined;

        if ('id' in data && 'calculations' in data) {
            return data as IMealWithCalculations;
        } else if (data?.data && 'calculations' in data.data) {
            return data.data as IMealWithCalculations;
        }

        return undefined;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            mealWithCalculations,
            loading: isLoading,
            error,
            isValidating,
            mutate: mutateMeal,
        }),
        [mealWithCalculations, error, isLoading, isValidating, mutateMeal]
    );

    return memoizedValue;
}

/**
 * Create meal with calculations (yangi qulayroq API - bitta request orqali)
 */
export function useCreateMealWithCalculations() {
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
                        name_i18n: payload.good.name_i18n || undefined,
                        description: payload.good.description,
                        description_i18n: payload.good.description_i18n || undefined,
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

                // Revalidate meals list
                await mutate(endpoints.meals.list);

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

    return { createMealWithCalculations };
}

/**
 * Update meal with calculations (yangi qulayroq API - PUT request)
 */
export function useUpdateMealWithCalculations() {
    const updateMealWithCalculations = useCallback(
        async (
            mealId: string,
            payload: {
                good: any;
                ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
                compound_calculations?: Array<{ compound_id: string; quantity: string }>;
            }
        ): Promise<any> => {
            try {
                const payloadToSend = {
                    good: {
                        name: payload.good.name,
                        name_i18n: payload.good.name_i18n || undefined,
                        description: payload.good.description,
                        description_i18n: payload.good.description_i18n || undefined,
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

                const response = await putter<BackendResponse<any>>(
                    endpoints.meals.updateWithCalculations(mealId),
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

                // Revalidate meals list and specific meal
                await mutate(endpoints.meals.list);
                await mutate(endpoints.meals.details(mealId));
                await mutate(endpoints.meals.withCalculations(mealId));

                toast.success('Meal with calculations updated successfully');
                return data;
            } catch (error) {
                toast.error('Failed to update meal with calculations');
                console.error('Failed to update meal with calculations:', error);
                throw error;
            }
        },
        []
    );

    return { updateMealWithCalculations };
}

