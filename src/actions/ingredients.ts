import type { SWRConfiguration } from 'swr';
import type {
    IIngredientItem,
    IIngredientGroup,
    IIngredientFormData,
    IIngredientResponse,
    IIngredientGroupResponse,
} from 'src/types/ingredients';

import useSWR from 'swr';
import { mutate } from 'src/lib/swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Get all ingredient groups
 */
export function useGetIngredientGroups() {
    const url = endpoints.ingredientGroups.list

    const { data, isLoading, error, isValidating } = useSWR<IIngredientGroupResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const memoizedValue = useMemo(
        () => ({
            ingredientGroups: data?.data || [],
            ingredientGroupsLoading: isLoading,
            ingredientGroupsError: error,
            ingredientGroupsValidating: isValidating,
            ingredientGroupsEmpty: !isLoading && !isValidating && !data?.data?.length,
        }),
        [data?.data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Helper function to enrich ingredients with group names
 */
function enrichIngredients(
    ingredientsData: IIngredientItem[],
    groups: IIngredientGroup[]
): IIngredientItem[] {
    const groupMap = new Map(
        groups?.map((group: IIngredientGroup) => [group.id, group.name]) || []
    );

    return ingredientsData.map((ingredient) => ({
        ...ingredient,
        group_name:
            ingredient._expand?.group_id?.name ||
            groupMap.get(ingredient.group_id) ||
            ingredient.group_id ||
            '-',
    }));
}

/**
 * Get all ingredients
 */
export function useGetIngredients(
    searchQuery?: string,
    options?: { limit?: number; offset?: number; expand?: string }
) {
    const normalizedQuery = searchQuery?.trim() || '';
    const params = {
        ...(normalizedQuery ? { search: normalizedQuery } : {}),
        ...(typeof options?.limit === 'number' ? { limit: options.limit } : {}),
        ...(typeof options?.offset === 'number' ? { offset: options.offset } : {}),
        expand: options?.expand || 'group_id,name_i18n',
    };
    const url = normalizedQuery
        ? [endpoints.ingredient.list, { params }]
        : [endpoints.ingredient.list, { params }];

    const { data, isLoading, error, isValidating } = useSWR<IIngredientResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedIngredients = useMemo(() => {
        const ingredients = data?.data || [];
        return enrichIngredients(ingredients, []);
    }, [data?.data]);

    const pagination = useMemo(() => {
        const paginationData = data?.pagination || {};
        const total =
            typeof paginationData.total === 'number'
                ? paginationData.total
                : typeof data?.total === 'number'
                    ? data?.total
                    : enrichedIngredients.length;
        const limit =
            typeof paginationData.limit === 'number'
                ? paginationData.limit
                : typeof data?.limit === 'number'
                    ? data?.limit
                    : enrichedIngredients.length;
        const offset =
            typeof paginationData.offset === 'number'
                ? paginationData.offset
                : typeof data?.offset === 'number'
                    ? data?.offset
                    : 0;
        const total_pages =
            typeof paginationData.total_pages === 'number'
                ? paginationData.total_pages
                : limit > 0
                    ? Math.ceil(total / limit)
                    : 0;

        return { total, limit, offset, total_pages };
    }, [data?.pagination, data?.total, data?.limit, data?.offset, enrichedIngredients.length]);

    const memoizedValue = useMemo(
        () => ({
            ingredients: enrichedIngredients,
            ingredientsTotal: pagination.total,
            ingredientsLimit: pagination.limit,
            ingredientsOffset: pagination.offset,
            ingredientsTotalPages: pagination.total_pages,
            ingredientsLoading: isLoading,
            ingredientsError: error,
            ingredientsValidating: isValidating,
            ingredientsEmpty: !isLoading && !isValidating && !enrichedIngredients.length,
        }),
        [enrichedIngredients, pagination, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single ingredient by ID
 */
export function useGetIngredient(ingredientId: string) {
    const url = ingredientId ? endpoints.ingredient.details(ingredientId) : '';

    const { data, isLoading, error, isValidating } = useSWR<IIngredientResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedData = useMemo(() => {
        if (!data?.data) return null;
        const ingredient = Array.isArray(data.data) ? data.data[0] : data.data;
        if (!ingredient) return null;
        return enrichIngredients([ingredient], [])[0];
    }, [data?.data]);

    const memoizedValue = useMemo(
        () => ({
            ingredient: enrichedData,
            ingredientLoading: isLoading,
            ingredientError: error,
            ingredientValidating: isValidating,
        }),
        [enrichedData, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Create new ingredient
 */
export function useCreateIngredient() {
    const createIngredient = useCallback(
        async (formData: IIngredientFormData) => {
            try {
                // Get brand_id from localStorage (saved from auth)
                // const brandId = localStorage.getItem('brand_id');

                const payload = {
                    ...formData,
                    
                };

                const response = await poster<IIngredientResponse>(
                    endpoints.ingredient.create,
                    payload
                );

                // Revalidate ingredients list
                await mutate(endpoints.ingredient.list);

                toast.success('Ingredient created successfully');
                return response;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to create ingredient';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return { createIngredient };
}

/**
 * Update ingredient
 */
export function useUpdateIngredient() {
    const updateIngredient = useCallback(
        async (ingredientId: string, formData: IIngredientFormData) => {
            try {
                const response = await putter<IIngredientResponse>(
                    endpoints.ingredient.update(ingredientId),
                    formData
                );

                // Revalidate ingredients list and specific item
                await mutate(endpoints.ingredient.list);
                await mutate(endpoints.ingredient.details(ingredientId));

                toast.success('Ingredient updated successfully');
                return response;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to update ingredient';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return { updateIngredient };
}

/**
 * Delete ingredient
 */
export function useDeleteIngredient() {
    const deleteIngredient = useCallback(
        async (ingredientId: string) => {
            try {
                const response = await deleter<IIngredientResponse>(
                    endpoints.ingredient.delete(ingredientId)
                );

                // Revalidate ingredients list (match all paginated/search keys)
                await mutate(
                    (key) =>
                        key === endpoints.ingredient.list ||
                        (Array.isArray(key) && key[0] === endpoints.ingredient.list),
                    undefined,
                    { revalidate: true }
                );

                toast.success('Ingredient deleted successfully');
                return response;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to delete ingredient';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return { deleteIngredient };
}
