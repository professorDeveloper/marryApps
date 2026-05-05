import type { IModifierItem } from 'src/types/modifiers';
import type { SWRConfiguration } from 'swr';

import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, deleter, fetcher, endpoints } from 'src/lib/axios';

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

export interface IGoodModifier {
    id: string;
    good_id: string;
    modifier_id: string;
    modifier?: IModifierItem;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get modifiers attached to a good
 */
export function useGetGoodModifiers(goodId: string | undefined) {
    const url = goodId ? endpoints.meals.modifiers?.(goodId) || `/api/v1/goods/${goodId}/modifiers` : '';

    const { data, isLoading, error, isValidating } = useSWR<
        BackendResponse<IGoodModifier[]> | IGoodModifier[] | IModifierItem[]
    >(url || null, fetcher, { ...swrOptions });

    const modifiers = useMemo(() => {
        if (!data) return [];

        // Handle different response formats
        if (Array.isArray(data)) {
            return data;
        }
        if (data?.data && Array.isArray(data.data)) {
            return data.data;
        }

        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            modifiers,
            modifiersLoading: isLoading,
            modifiersError: error,
            modifiersValidating: isValidating,
        }),
        [modifiers, error, isLoading, isValidating]
    );

    return memoizedValue;
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Attach modifier to good
 */
export async function attachModifierToGood(goodId: string, modifierId: string): Promise<void> {
    try {
        const url = endpoints.meals.attachModifier?.(goodId) || `/api/v1/goods/${goodId}/modifiers`;
        await poster(url, { modifier_id: modifierId });
    } catch (error) {
        console.error('Failed to attach modifier to good:', error);
        throw error;
    }
}

/**
 * Detach modifier from good
 */
export async function detachModifierFromGood(goodId: string, modifierId: string): Promise<void> {
    try {
        const url = endpoints.meals.detachModifier?.(goodId, modifierId) || `/api/v1/goods/${goodId}/modifiers/${modifierId}`;
        await deleter(url);
    } catch (error) {
        console.error('Failed to detach modifier from good:', error);
        throw error;
    }
}

/**
 * Sync modifiers for a good (attach new, detach removed)
 * Returns statistics about the operation
 */
export async function syncGoodModifiers(
    goodId: string,
    currentModifierIds: string[],
    previousModifierIds: string[]
): Promise<{ attached: number; detached: number }> {
    const currentSet = new Set(currentModifierIds);
    const previousSet = new Set(previousModifierIds);

    // Find modifiers to attach (in current but not in previous)
    const toAttach = currentModifierIds.filter((id) => !previousSet.has(id));

    // Find modifiers to detach (in previous but not in current)
    const toDetach = previousModifierIds.filter((id) => !currentSet.has(id));

    let attached = 0;
    let detached = 0;

    // Attach new modifiers
    for (const modifierId of toAttach) {
        try {
            await attachModifierToGood(goodId, modifierId);
            attached++;
        } catch (error) {
            toast.error(`Failed to attach modifier: ${modifierId}`);
        }
    }

    // Detach removed modifiers
    for (const modifierId of toDetach) {
        try {
            await detachModifierFromGood(goodId, modifierId);
            detached++;
        } catch (error) {
            toast.error(`Failed to detach modifier: ${modifierId}`);
        }
    }

    // Revalidate the modifiers list
    const url = endpoints.meals.modifiers?.(goodId) || `/api/v1/goods/${goodId}/modifiers`;
    await mutate(url);

    return { attached, detached };
}

/**
 * Hook to sync modifiers
 */
export function useSyncGoodModifiers() {
    const syncModifiers = useCallback(
        async (goodId: string, currentModifierIds: string[], previousModifierIds: string[]) => {
            try {
                const result = await syncGoodModifiers(goodId, currentModifierIds, previousModifierIds);
                if (result.attached > 0 || result.detached > 0) {
                    toast.success(`Modifiers updated: ${result.attached} added, ${result.detached} removed`);
                }
                return result;
            } catch (error) {
                toast.error('Failed to sync modifiers');
                throw error;
            }
        },
        []
    );

    return { syncModifiers };
}
