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
    quantity?: number;
    created_at: string;
    updated_at: string;
}

export type GoodModifierEntry = { modifier_id: string; quantity: number };

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
export async function attachModifierToGood(
    goodId: string,
    modifierId: string,
    quantity?: number
): Promise<void> {
    try {
        const url = endpoints.meals.attachModifier?.(goodId) || `/api/v1/goods/${goodId}/modifiers`;
        const payload: { modifier_id: string; quantity?: number } = { modifier_id: modifierId };
        if (quantity != null) payload.quantity = quantity;
        await poster(url, payload);
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
    currentEntries: GoodModifierEntry[],
    previousEntries: GoodModifierEntry[]
): Promise<{ attached: number; detached: number }> {
    const currentMap = new Map(currentEntries.map((e) => [e.modifier_id, e.quantity]));
    const previousMap = new Map(previousEntries.map((e) => [e.modifier_id, e.quantity]));

    const toAttach = currentEntries.filter((e) => !previousMap.has(e.modifier_id));
    const toDetach = previousEntries.filter((e) => !currentMap.has(e.modifier_id));

    let attached = 0;
    let detached = 0;

    for (const { modifier_id, quantity } of toAttach) {
        try {
            await attachModifierToGood(goodId, modifier_id, quantity);
            attached++;
        } catch (error) {
            toast.error(`Failed to attach modifier: ${modifier_id}`);
        }
    }

    for (const { modifier_id } of toDetach) {
        try {
            await detachModifierFromGood(goodId, modifier_id);
            detached++;
        } catch (error) {
            toast.error(`Failed to detach modifier: ${modifier_id}`);
        }
    }

    const url = endpoints.meals.modifiers?.(goodId) || `/api/v1/goods/${goodId}/modifiers`;
    await mutate(url);

    return { attached, detached };
}

/**
 * Hook to sync modifiers
 */
export function useSyncGoodModifiers() {
    const syncModifiers = useCallback(
        async (
            goodId: string,
            currentEntries: GoodModifierEntry[],
            previousEntries: GoodModifierEntry[]
        ) => {
            try {
                const result = await syncGoodModifiers(goodId, currentEntries, previousEntries);
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
