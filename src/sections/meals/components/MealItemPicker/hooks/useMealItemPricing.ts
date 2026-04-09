import { useMemo } from 'react';

import type { MealItemRow } from '../types';

export interface UseMealItemPricingResult {
    priceByKey: Map<string, number>;
    loading: boolean;
}

function parsePrice(value: unknown): number {
    if (value == null) return 0;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
}

export function useMealItemPricing(rows: MealItemRow[]): UseMealItemPricingResult {
    const priceByKey = useMemo(() => {
        const map = new Map<string, number>();
        rows.forEach((r) => {
            // NOTE: composite key is stable and already used as Map key in picker state.
            // Here we just map by `${type}:${id}` again at call-site.
            map.set(`${r.type}:${r.id}`, parsePrice(r.price_per_unit));
        });
        return map;
    }, [rows]);

    return { priceByKey, loading: false };
}
