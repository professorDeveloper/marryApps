import type { SWRConfiguration } from 'swr';
import type {
  IModifierItem,
  IModifierFormData,
  IModifierRecipePayload,
  IModifierWithCalculations,
} from 'src/types/modifiers';

import useSWR from 'swr';
import { useMemo, useCallback } from 'react';

import { mutate } from 'src/lib/swr';
import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ============================================================================
// MODIFIERS HOOKS
// ============================================================================

/**
 * Backend response structure
 */
interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
  pagination?: {
    total?: number;
    limit?: number;
    offset?: number;
    total_pages?: number;
  };
  total?: number;
  limit?: number;
  offset?: number;
}

/**
 * Get all modifiers with optional search
 */
export function useGetModifiers(
  searchQuery?: string,
  options?: { limit?: number; offset?: number; expand?: string }
) {
  const normalizedQuery = searchQuery?.trim() || '';
  const expand = options?.expand;

  const params = {
    ...(normalizedQuery ? { q: normalizedQuery } : {}),
    ...(typeof options?.limit === 'number' ? { limit: options?.limit } : {}),
    ...(typeof options?.offset === 'number' ? { offset: options?.offset } : {}),
    ...(expand ? { expand } : {}),
  };

  const swrKey = [endpoints.modifier.list, { params }];

  const { data, isLoading, error, isValidating } = useSWR<
    BackendResponse<IModifierItem[]> | IModifierItem[]
  >(swrKey, fetcher, { ...swrOptions });

  const modifiers = useMemo(() => {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  }, [data]);

  const pagination = useMemo(() => {
    if (!data || Array.isArray(data)) {
      const fallbackTotal = modifiers.length;
      return {
        total: fallbackTotal,
        limit: fallbackTotal,
        offset: 0,
        total_pages: fallbackTotal > 0 ? 1 : 0,
      };
    }

    const paginationData = data.pagination || {};
    const total =
      typeof paginationData.total === 'number'
        ? paginationData.total
        : typeof data.total === 'number'
          ? data.total
          : modifiers.length;
    const limit =
      typeof paginationData.limit === 'number'
        ? paginationData.limit
        : typeof data.limit === 'number'
          ? data.limit
          : modifiers.length;
    const offset =
      typeof paginationData.offset === 'number'
        ? paginationData.offset
        : typeof data.offset === 'number'
          ? data.offset
          : 0;
    const total_pages =
      typeof paginationData.total_pages === 'number'
        ? paginationData.total_pages
        : limit > 0
          ? Math.ceil(total / limit)
          : 0;

    return {
      total,
      limit,
      offset,
      total_pages,
    };
  }, [data, modifiers.length]);

  const memoizedValue = useMemo(
    () => ({
      modifiers,
      modifiersTotal: pagination.total,
      modifiersLimit: pagination.limit,
      modifiersOffset: pagination.offset,
      modifiersTotalPages: pagination.total_pages,
      modifiersLoading: isLoading,
      modifiersError: error,
      modifiersValidating: isValidating,
      modifiersEmpty: !isLoading && !isValidating && !modifiers.length,
    }),
    [modifiers, pagination, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Get single modifier by ID
 */
export function useGetModifier(modifierId: string) {
  const url = modifierId ? endpoints.modifier.details(modifierId) : '';

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IModifierItem>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const modifier = useMemo(() => {
    if (!data?.data) return undefined;
    return data.data;
  }, [data?.data]);

  const memoizedValue = useMemo(
    () => ({
      modifier,
      modifierLoading: isLoading,
      modifierError: error,
      modifierValidating: isValidating,
    }),
    [modifier, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Create new modifier
 */
export function useCreateModifier() {
  const createModifier = useCallback(
    async (formData: IModifierFormData) => {
      try {
        const modifierPayload = {
          code: formData.code,
          name: formData.name,
          description: formData.description || '',
          is_active: formData.is_active,
          name_i18n: formData.name_i18n || '',
          picture_url: formData.picture_url || '',
        };

        const response = await poster<BackendResponse<IModifierItem>>(
          endpoints.modifier.create,
          modifierPayload
        );

        // Revalidate modifiers list
        await mutate(endpoints.modifier.list);

        return response.data;
      } catch (error) {
        console.error('Failed to create modifier:', error);
        throw error;
      }
    },
    []
  );

  return { createModifier };
}

/**
 * Update modifier
 */
export function useUpdateModifier() {
  const updateModifier = useCallback(
    async (modifierId: string, formData: IModifierFormData) => {
      try {
        const modifierPayload = {
          code: formData.code,
          name: formData.name,
          description: formData.description || '',
          is_active: formData.is_active,
          name_i18n: formData.name_i18n || '',
          picture_url: formData.picture_url || '',
        };

        const response = await putter<BackendResponse<IModifierItem>>(
          endpoints.modifier.update(modifierId),
          modifierPayload
        );

        return response.data;
      } catch (error) {
        console.error('Failed to update modifier:', error);
        throw error;
      }
    },
    []
  );

  return { updateModifier };
}

/**
 * Delete modifier
 */
export function useDeleteModifier() {
  const deleteModifier = useCallback(
    async (modifierId: string) => {
      try {
        await deleter(endpoints.modifier.delete(modifierId));

        // Revalidate modifiers list (match all paginated/search keys)
        await mutate(
          (key) =>
            key === endpoints.modifier.list ||
            (Array.isArray(key) && key[0] === endpoints.modifier.list),
          undefined,
          { revalidate: true }
        );

        return true;
      } catch (error) {
        console.error('Failed to delete modifier:', error);
        throw error;
      }
    },
    []
  );

  return { deleteModifier };
}

// ============================================================================
// MODIFIERS — RECIPE (with-calculations) HOOKS
// ============================================================================

/**
 * Get modifier with embedded ingredient + compound calculations.
 */
export function useGetModifierWithCalculations(modifierId: string | undefined) {
  const url = modifierId ? endpoints.modifier.withCalculations(modifierId) : '';

  const { data, isLoading, error, isValidating, mutate: mutateModifier } = useSWR<
    BackendResponse<IModifierWithCalculations> | IModifierWithCalculations
  >(url || null, fetcher, { ...swrOptions });

  const modifierWithCalculations = useMemo<IModifierWithCalculations | undefined>(() => {
    if (!data) return undefined;
    if ('id' in data && 'calculations' in data) {
      return data as IModifierWithCalculations;
    }
    if ((data as BackendResponse<IModifierWithCalculations>)?.data) {
      return (data as BackendResponse<IModifierWithCalculations>).data;
    }
    return undefined;
  }, [data]);

  return useMemo(
    () => ({
      modifierWithCalculations,
      modifierWithCalculationsLoading: isLoading,
      modifierWithCalculationsError: error,
      modifierWithCalculationsValidating: isValidating,
      mutateModifierWithCalculations: mutateModifier,
    }),
    [modifierWithCalculations, isLoading, error, isValidating, mutateModifier]
  );
}

/**
 * Create modifier + calculations atomically.
 */
export function useCreateModifierWithCalculations() {
  const createModifierWithCalculations = useCallback(
    async (payload: IModifierRecipePayload) => {
      try {
        const response = await poster<BackendResponse<IModifierWithCalculations>>(
          endpoints.modifier.createWithCalculations,
          payload
        );

        await mutate(endpoints.modifier.list);

        return response?.data ?? response;
      } catch (error) {
        console.error('Failed to create modifier with calculations:', error);
        throw error;
      }
    },
    []
  );

  return { createModifierWithCalculations };
}

/**
 * Update modifier + calculations atomically.
 */
export function useUpdateModifierWithCalculations() {
  const updateModifierWithCalculations = useCallback(
    async (modifierId: string, payload: IModifierRecipePayload) => {
      try {
        const response = await putter<BackendResponse<IModifierWithCalculations>>(
          endpoints.modifier.updateWithCalculations(modifierId),
          payload
        );

        await mutate(endpoints.modifier.list);
        await mutate(endpoints.modifier.details(modifierId));
        await mutate(endpoints.modifier.withCalculations(modifierId));

        return response?.data ?? response;
      } catch (error) {
        console.error('Failed to update modifier with calculations:', error);
        throw error;
      }
    },
    []
  );

  return { updateModifierWithCalculations };
}
