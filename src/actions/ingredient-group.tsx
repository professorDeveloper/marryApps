import type { SWRConfiguration } from 'swr';
import type {
  IIngredientGroupItem,
  IIngredientGroupFormData,
  IIngredientGroupResponse,
} from 'src/types/ingredient-group';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';

// ============================================================================
// CONFIGURATION
// ============================================================================

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ============================================================================
// INGREDIENT GROUPS HOOKS
// ============================================================================

/**
 * Get all ingredient groups
 */
export function useGetIngredientGroups() {
  const url = endpoints.ingredientGroups.list;

  const { data, isLoading, error, isValidating } = useSWR<IIngredientGroupResponse>(
    url,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      ingredientGroups: (data?.data as IIngredientGroupItem[]) || [],
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
 * Get single ingredient group by ID
 */
export function useGetIngredientGroup(groupId: string) {
  const url = groupId ? endpoints.ingredientGroups.details(groupId) : '';

  const { data, isLoading, error, isValidating } = useSWR<IIngredientGroupResponse>(
    url,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    if (!data?.data) {
      return {
        ingredientGroup: null,
        ingredientGroupLoading: isLoading,
        ingredientGroupError: error,
        ingredientGroupValidating: isValidating,
      };
    }

    const ingredientGroup = Array.isArray(data.data)
      ? (data.data[0] as IIngredientGroupItem)
      : (data.data as IIngredientGroupItem);

    return {
      ingredientGroup,
      ingredientGroupLoading: isLoading,
      ingredientGroupError: error,
      ingredientGroupValidating: isValidating,
    };
  }, [data, error, isLoading, isValidating]);

  return memoizedValue;
}

/**
 * Create new ingredient group
 */
export function useCreateIngredientGroup() {
  const createIngredientGroup = useCallback(async (formData: IIngredientGroupFormData) => {
    try {
      const response = await poster<IIngredientGroupResponse>(
        endpoints.ingredientGroups.create,
        formData
      );

      await mutate(endpoints.ingredientGroups.list);

      toast.success('Ingredient group created successfully');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create ingredient group';
      toast.error(message);
      throw error;
    }
  }, []);

  return { createIngredientGroup };
}

/**
 * Update ingredient group
 */
export function useUpdateIngredientGroup() {
  const updateIngredientGroup = useCallback(
    async (groupId: string, formData: IIngredientGroupFormData) => {
      try {
        const response = await putter<IIngredientGroupResponse>(
          endpoints.ingredientGroups.update(groupId),
          formData
        );

        await mutate(endpoints.ingredientGroups.list);
        await mutate(endpoints.ingredientGroups.details(groupId));

        toast.success('Ingredient group updated successfully');
        return response;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update ingredient group';
        toast.error(message);
        throw error;
      }
    },
    []
  );

  return { updateIngredientGroup };
}

/**
 * Delete ingredient group
 */
export function useDeleteIngredientGroup() {
  const deleteIngredientGroup = useCallback(async (groupId: string) => {
    try {
      const response = await deleter<IIngredientGroupResponse>(
        endpoints.ingredientGroups.delete(groupId)
      );

      await mutate(endpoints.ingredientGroups.list);

      toast.success('Ingredient group deleted successfully');
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete ingredient group';
      toast.error(message);
      throw error;
    }
  }, []);

  return { deleteIngredientGroup };
}
