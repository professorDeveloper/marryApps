import type { SWRConfiguration } from 'swr';
import type {
    IIngredientItem,
    IIngredientFormData,
    IIngredientGroup,
    IIngredientResponse,
    IIngredientGroupResponse,
} from 'src/types/ingredients';

import useSWR, { mutate } from 'swr';
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
        group_name: groupMap.get(ingredient.group_id) || ingredient.group_id || '-',
    }));
}

/**
 * Get all ingredients
 */
export function useGetIngredients() {
    const url = endpoints.ingredient.list;
    const { ingredientGroups } = useGetIngredientGroups();

    const { data, isLoading, error, isValidating } = useSWR<IIngredientResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedIngredients = useMemo(() => {
        const ingredients = data?.data || [];
        return enrichIngredients(ingredients, ingredientGroups);
    }, [data?.data, ingredientGroups]);

    const memoizedValue = useMemo(
        () => ({
            ingredients: enrichedIngredients,
            ingredientsLoading: isLoading,
            ingredientsError: error,
            ingredientsValidating: isValidating,
            ingredientsEmpty: !isLoading && !isValidating && !enrichedIngredients.length,
        }),
        [enrichedIngredients, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single ingredient by ID
 */
export function useGetIngredient(ingredientId: string) {
    const url = ingredientId ? endpoints.ingredient.details(ingredientId) : '';
    const { ingredientGroups } = useGetIngredientGroups();

    const { data, isLoading, error, isValidating } = useSWR<IIngredientResponse>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const enrichedData = useMemo(() => {
        if (!data?.data) return null;
        const ingredient = Array.isArray(data.data) ? data.data[0] : data.data;
        if (!ingredient) return null;
        return enrichIngredients([ingredient], ingredientGroups)[0];
    }, [data?.data, ingredientGroups]);

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

                // Revalidate ingredients list
                await mutate(endpoints.ingredient.list);

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
