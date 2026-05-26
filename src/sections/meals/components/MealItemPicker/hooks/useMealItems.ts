import type { MealItem } from '../types';

import useSWR from 'swr';
import { useMemo, useCallback } from 'react';

import { useGetCompounds } from 'src/hooks/use-compounds';

import { fetcher, endpoints } from 'src/lib/axios';

interface RawIngredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit?: string;
}

interface BackendResponse<T> {
    status?: string;
    message?: string;
    data: T;
    code?: number;
}

/** Max items loaded into the meal/compound item picker available table */
const PICKER_LIST_LIMIT = 2000;

export interface UseMealItemsResult {
    items: MealItem[];
    loading: boolean;
    refresh: () => Promise<void>;
}

export function useMealItems(isVisible: boolean = true): UseMealItemsResult {
    // Always fetch data once and cache it globally - don't depend on visibility
    const {
        data: ingredientsResponse,
        isLoading: ingredientsLoading,
        mutate: mutateIngredients,
    } = useSWR<BackendResponse<RawIngredient[]>>(
        [endpoints.ingredient.list, { params: { limit: PICKER_LIST_LIMIT, offset: 0 } }],
        fetcher,
        {
            revalidateIfStale: false, // Don't re-fetch stale data when component re-mounts
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // Dedupe requests within 1 minute
            keepPreviousData: true, // Keep previous data while revalidating
        }
    );

    const {
        compounds,
        compoundsLoading,
        mutate: mutateCompounds,
    } = useGetCompounds(undefined, true, { limit: PICKER_LIST_LIMIT, offset: 0 });

    // Memoize items array to prevent unnecessary re-renders
    const items: MealItem[] = useMemo(() => {
        if (!ingredientsResponse?.data && !compounds) return [];
        
        const ingredientItems: MealItem[] = (ingredientsResponse?.data || []).map((ing) => ({
            id: ing.id,
            name: ing.name,
            measurement: ing.measurement,
            type: 'ingredient',
            price_per_unit: ing.price_per_unit,
        }));

        const compoundItems: MealItem[] = (compounds || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            measurement: c.measurement,
            type: 'compound',
            price_per_unit: c.price_per_unit ?? (c.price != null ? String(c.price) : undefined),
        }));

        return [...ingredientItems, ...compoundItems];
    }, [ingredientsResponse?.data, compounds]);

    const refresh = useCallback(async () => {
        await Promise.all([mutateIngredients(), mutateCompounds()]);
    }, [mutateIngredients, mutateCompounds]);

    return {
        items,
        loading: ingredientsLoading || compoundsLoading,
        refresh,
    };
}
