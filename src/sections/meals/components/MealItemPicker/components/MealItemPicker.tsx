import type {
    MealItem,
    MealItemRow,
    MealItemType,
    MealItemPickerApi,
    MealItemTypeFilter,
} from '../types';

import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack } from '@mui/material';

import { compositeKey } from '../types';
import { AddedTable } from './AddedTable';
import { AvailableTable } from './AvailableTable';
import { useMealItems } from '../hooks/useMealItems';
import { MealItemPickerCache } from '../MealItemPickerCache';
import { useMealItemPricing } from '../hooks/useMealItemPricing';

// ---------------------------------------------------------------------------
// Persisted-but-not-yet-hydrated calc storage
// ---------------------------------------------------------------------------

interface PendingCalc {
    type: MealItemType;
    id: string;
    quantity: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MealItemPickerProps {
    apiRef: React.RefObject<MealItemPickerApi | null>;
    isVisible?: boolean;
    menuPrice?: string;
    showProfitMargin?: boolean;
    tableHeight?: string | number;
    cacheKey?: string;
    onTotalCostChange?: (cost: number) => void;
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_FILTER: MealItemTypeFilter = { ingredient: true, compound: true };
const EMPTY_SET: Set<string> = new Set();
const EMPTY_MAP: Map<string, MealItemRow> = new Map();

function applyFilter(
    rows: { type: MealItemType; name: string }[],
    filter: MealItemTypeFilter,
    search: string
) {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
        if (r.type === 'ingredient' && !filter.ingredient) return false;
        if (r.type === 'compound' && !filter.compound) return false;
        if (q && !r.name.toLowerCase().includes(q)) return false;
        return true;
    });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const MealItemPicker = React.memo(function MealItemPicker({
    apiRef,
    isVisible = true,
    menuPrice,
    showProfitMargin = false,
    tableHeight = 700,
    cacheKey,
    onTotalCostChange,
    onNavigateFocus,
}: MealItemPickerProps) {
    const { t } = useTranslation('menu');
    // Only fetch meal items when this tab is visible to avoid unnecessary requests
    const { items, loading, refresh } = useMealItems(isVisible);

    // Lookup: composite key → MealItem
    const itemsByKey = useMemo(() => {
        const map = new Map<string, MealItem>();
        items.forEach((it) => map.set(compositeKey(it.type, it.id), it));
        return map;
    }, [items]);

    // Added rows live as Map<compositeKey, MealItemRow> so insertion order is stable.
    // Rows may be hydrated before items load; those render with placeholder metadata.
    // Initialize from cache if cacheKey is provided, otherwise start with empty map.
    const [addedRowsMap, setAddedRowsMap] = useState<Map<string, MealItemRow>>(() => {
        if (cacheKey) {
            const cached = MealItemPickerCache.restore(cacheKey);
            if (cached) return new Map(cached);
        }
        return new Map();
    });

    // Calcs that arrived (via restoreFromPersisted) before items finished loading.
    const pendingRef = useRef<PendingCalc[] | null>(null);

    // Filters & search (independent for each table)
    const [availableFilter, setAvailableFilter] = useState<MealItemTypeFilter>(DEFAULT_FILTER);
    const [addedFilter, setAddedFilter] = useState<MealItemTypeFilter>(DEFAULT_FILTER);
    const [availableSearch, setAvailableSearch] = useState('');
    const [addedSearch, setAddedSearch] = useState('');

    const [availableSelected, setAvailableSelected] = useState<Set<string>>(() => new Set());
    const [addedSelected, setAddedSelected] = useState<Set<string>>(() => new Set());

    // Reconcile pending calcs once items load
    useEffect(() => {
        if (!pendingRef.current || items.length === 0) return;
        const pending = pendingRef.current;
        const next = new Map<string, MealItemRow>();
        pending.forEach(({ type, id, quantity }) => {
            const key = compositeKey(type, id);
            const it = itemsByKey.get(key);
            next.set(key, {
                id,
                type,
                name: it?.name ?? '…',
                measurement: it?.measurement ?? '',
                price_per_unit: it?.price_per_unit,
                quantity,
            });
        });
        pendingRef.current = null;
        setAddedRowsMap(next);
    }, [items, itemsByKey]);

    // Reconcile existing added rows with freshly loaded item metadata (name/measurement)
    useEffect(() => {
        if (items.length === 0) return;
        setAddedRowsMap((prev) => {
            let changed = false;
            const next = new Map(prev);
            next.forEach((row, key) => {
                const it = itemsByKey.get(key);
                if (!it) return;
                if (row.name !== it.name || row.measurement !== it.measurement) {
                    changed = true;
                    next.set(key, {
                        ...row,
                        name: it.name,
                        measurement: it.measurement,
                        price_per_unit: it.price_per_unit,
                    });
                }
            });
            return changed ? next : prev;
        });
    }, [items, itemsByKey]);

    // Derived: available list (items minus added) + filter/search - optimized with early returns
    const availableRows = useMemo(() => {
        if (items.length === 0 && addedRowsMap.size === 0) return [];
        
        const visible: MealItem[] = [];
        const addedKeys = new Set(addedRowsMap.keys());
        
        for (const it of items) {
            const key = compositeKey(it.type, it.id);
            if (addedKeys.has(key)) continue;
            visible.push(it);
        }
        
        if (!availableFilter.ingredient && !availableFilter.compound && !availableSearch.trim()) {
            return visible;
        }
        
        return applyFilter(visible, availableFilter, availableSearch) as MealItem[];
    }, [items, addedRowsMap.size, availableFilter, availableSearch]);

    // Derived: added list (preserves Map insertion order) - optimized
    const addedRows = useMemo(() => {
        if (addedRowsMap.size === 0) return [];
        
        const out = Array.from(addedRowsMap.values());
        
        if (!addedFilter.ingredient && !addedFilter.compound && !addedSearch.trim()) {
            return out;
        }
        
        return applyFilter(out, addedFilter, addedSearch) as MealItemRow[];
    }, [addedRowsMap, addedFilter, addedSearch]);

    const allAddedRows = useMemo(() => Array.from(addedRowsMap.values()), [addedRowsMap]);
    const { priceByKey } = useMealItemPricing(allAddedRows);

    const totalItemsCount = allAddedRows.length;
    const totalIngredientCount = useMemo(() => allAddedRows.filter((r) => r.type === 'ingredient').length, [allAddedRows]);
    const totalCompoundCount = useMemo(() => allAddedRows.filter((r) => r.type === 'compound').length, [allAddedRows]);
    const totalCost = useMemo(() => allAddedRows.reduce((sum, r) => {
            const unit = priceByKey.get(compositeKey(r.type, r.id)) ?? 0;
            return sum + unit * (r.quantity ?? 0);
        }, 0), [allAddedRows, priceByKey]);

    useEffect(() => {
        onTotalCostChange?.(totalCost);
    }, [totalCost, onTotalCostChange]);

    // Reset available selection when the visible list changes (filter/search/items churn).
    // Selection is cleared inline inside mutation handlers, not via effects, to avoid a
    // second render pass after every batch action.
    useEffect(() => {
        setAvailableSelected((prev) => (prev.size === 0 ? prev : new Set()));
    }, [availableSearch, availableFilter, items.length]);

    useEffect(() => {
        setAddedSelected((prev) => (prev.size === 0 ? prev : new Set()));
    }, [addedSearch, addedFilter]);

    // O(1) select-all states (because selection is always scoped to current list)
    const availableAllChecked = availableRows.length > 0 && availableSelected.size === availableRows.length;
    const availableIndeterminate =
        availableSelected.size > 0 && availableSelected.size < availableRows.length;

    const addedAllChecked = addedRows.length > 0 && addedSelected.size === addedRows.length;
    const addedIndeterminate = addedSelected.size > 0 && addedSelected.size < addedRows.length;

    // ── Mutations ───────────────────────────────────────────────────────
    // Refs let mutation handlers read the latest selection/itemsByKey without
    // being recreated — keeping their identity stable for memoized children.
    const availableSelectedRef = useRef(availableSelected);
    const addedSelectedRef = useRef(addedSelected);
    const itemsByKeyRef2 = useRef(itemsByKey);
    useEffect(() => {
        availableSelectedRef.current = availableSelected;
    }, [availableSelected]);
    useEffect(() => {
        addedSelectedRef.current = addedSelected;
    }, [addedSelected]);
    useEffect(() => {
        itemsByKeyRef2.current = itemsByKey;
    }, [itemsByKey]);

    const handleAdd = useCallback((it: MealItem) => {
        const startedAt = performance.now();
        const key = compositeKey(it.type, it.id);
        setAddedRowsMap((prev) => {
            if (prev.has(key)) return prev;
            const next = new Map(prev);
            next.set(key, { ...it, quantity: 1 });
            return next;
        });
    }, []);

    const handleAddSelected = useCallback(() => {
        const sel = availableSelectedRef.current;
        if (sel.size === 0) return;
        const byKey = itemsByKeyRef2.current;
        setAddedRowsMap((prev) => {
            const next = new Map(prev);
            sel.forEach((key) => {
                if (next.has(key)) return;
                const it = byKey.get(key);
                if (!it) return;
                next.set(key, { ...it, quantity: 1 });
            });
            return next;
        });
        setAvailableSelected(EMPTY_SET);
    }, []);

    const handleRemove = useCallback((type: MealItemType, id: string) => {
        const startedAt = performance.now();
        const key = compositeKey(type, id);
        setAddedRowsMap((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Map(prev);
            next.delete(key);
            return next;
        });
        // Drop from selection if it was selected (keeps selection-set in sync
        // without a separate effect).
        setAddedSelected((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    }, []);

    const handleRemoveSelected = useCallback(() => {
        const sel = addedSelectedRef.current;
        if (sel.size === 0) return;
        setAddedRowsMap((prev) => {
            const next = new Map(prev);
            sel.forEach((key) => next.delete(key));
            return next;
        });
        setAddedSelected(EMPTY_SET);
    }, []);

    const handleRemoveAll = useCallback(() => {
        setAddedRowsMap(EMPTY_MAP);
        setAddedSelected(EMPTY_SET);
    }, []);

    const handleQtyChange = useCallback(
        (type: MealItemType, id: string, value: string) => {
            const key = compositeKey(type, id);
            const parsed = value.trim() === '' ? 0 : parseFloat(value);
            const safe = Number.isFinite(parsed) ? parsed : 0;
            setAddedRowsMap((prev) => {
                const row = prev.get(key);
                if (!row) return prev;
                const next = new Map(prev);
                next.set(key, { ...row, quantity: safe });
                return next;
            });
        },
        []
    );

    // Keep latest rows in refs so select-all handlers can stay stable.
    const availableRowsRef = useRef(availableRows);
    const addedRowsRef = useRef(addedRows);
    useEffect(() => {
        availableRowsRef.current = availableRows;
    }, [availableRows]);
    useEffect(() => {
        addedRowsRef.current = addedRows;
    }, [addedRows]);

    const handleAvailableSelectAll = useCallback(() => {
        setAvailableSelected((prev) => {
            const rows = availableRowsRef.current;
            if (rows.length === 0) return prev;
            if (prev.size === rows.length) return new Set();
            const next = new Set<string>();
            for (const r of rows) next.add(compositeKey(r.type, r.id));
            return next;
        });
    }, []);

    const handleAddedSelectAll = useCallback(() => {
        setAddedSelected((prev) => {
            const rows = addedRowsRef.current;
            if (rows.length === 0) return prev;
            if (prev.size === rows.length) return new Set();
            const next = new Set<string>();
            for (const r of rows) next.add(compositeKey(r.type, r.id));
            return next;
        });
    }, []);

    // Labels for filters
    const ingredientLabel = t('mealsProducts.filterIngredients');
    const compoundLabel = t('mealsProducts.filterSemiFinished');

    // Handle available row selection
    const handleAvailableSelectChange = useCallback(
        (key: string, checked: boolean) => {
            setAvailableSelected((prev) => {
                const next = new Set(prev);
                if (checked) next.add(key);
                else next.delete(key);
                return next;
            });
        },
        []
    );

    const handleNavigateFocus = useCallback(
        (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => {
            const editableColumns = ['quantity'];
            const currentColumnIndex = editableColumns.indexOf(currentColumnKey);

            if (direction === 'left' || direction === 'right') {
                // Only one editable column — nothing to hop to.
                return;
            }

            const targetRowIndex = direction === 'down' ? currentRowIndex + 1 : currentRowIndex - 1;
            const inputs = document.querySelectorAll(
                'input[inputMode="decimal"]'
            ) as NodeListOf<HTMLInputElement>;
            const targetRowInputs = Array.from(inputs).filter((input) => {
                const wrapper = input.closest('[data-index]');
                if (!wrapper) return false;
                return parseInt(wrapper.getAttribute('data-index') || '0', 10) === targetRowIndex;
            });
            const targetInput = targetRowInputs[currentColumnIndex];
            if (targetInput) {
                targetInput.focus();
                targetInput.select();
            }
        },
        []
    );

    // Handle added row selection
    const handleAddedSelectChange = useCallback(
        (key: string, checked: boolean) => {
            setAddedSelected((prev) => {
                const next = new Set(prev);
                if (checked) next.add(key);
                else next.delete(key);
                return next;
            });
        },
        []
    );

    // ── Imperative API ───────────────────────────────────────────────────
    const addedRowsMapRef = useRef(addedRowsMap);
    useEffect(() => {
        addedRowsMapRef.current = addedRowsMap;
    }, [addedRowsMap]);
    const itemsByKeyRef = useRef(itemsByKey);
    useEffect(() => {
        itemsByKeyRef.current = itemsByKey;
    }, [itemsByKey]);
    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        apiRef.current = {
        getCalculations: () => {
            const ingredient_calculations: { ingredient_id: string; quantity: string }[] = [];
            const compound_calculations: { compound_id: string; quantity: string }[] = [];
            addedRowsMapRef.current.forEach((row) => {
                if (row.type === 'ingredient') {
                    ingredient_calculations.push({
                        ingredient_id: row.id,
                        quantity: String(row.quantity),
                    });
                } else {
                    compound_calculations.push({
                        compound_id: row.id,
                        quantity: String(row.quantity),
                    });
                }
            });
            return { ingredient_calculations, compound_calculations };
        },
        restoreFromPersisted: (ingredientCalcs, compoundCalcs) => {
            const pending: PendingCalc[] = [
                ...ingredientCalcs.map((c) => ({
                    type: 'ingredient' as const,
                    id: c.ingredient_id,
                    quantity: parseFloat(c.quantity) || 0,
                })),
                ...compoundCalcs.map((c) => ({
                    type: 'compound' as const,
                    id: c.compound_id,
                    quantity: parseFloat(c.quantity) || 0,
                })),
            ];

            const next = new Map<string, MealItemRow>();
            pending.forEach(({ type, id, quantity }) => {
                const key = compositeKey(type, id);
                const it = itemsByKeyRef.current.get(key);
                next.set(key, {
                    id,
                    type,
                    name: it?.name ?? '…',
                    measurement: it?.measurement ?? '',
                    price_per_unit: it?.price_per_unit,
                    quantity,
                });
            });
            pendingRef.current = itemsRef.current.length > 0 ? null : pending;
            setAddedRowsMap(next);
        },
        refresh,
        };
    }, [apiRef, refresh]);

    // ── Cache persistence ───────────────────────────────────────────────
    // Save state to cache whenever it changes (survives unmount/remount).
    // Clear cache on unmount if cacheKey is provided.
    useEffect(() => {
        if (cacheKey && addedRowsMap.size > 0) {
            MealItemPickerCache.save(cacheKey, addedRowsMap);
        }
        return () => {
            // Don't clear on unmount — keep cache alive for remount.
            // User navigates away from the parent view → parent clears cache.
        };
    }, [cacheKey, addedRowsMap]);


    // ── Render ──────────────────────────────────────────────────────────
    return (
        <Stack spacing={2} sx={{ height: '100%', fontFamily: '"Inter", sans-serif', backgroundColor:"transparent" }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.5fr 4fr' },
                    gap: 2,
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: 'transparent',
                }}
            >
                {/* AVAILABLE TABLE */}
                <AvailableTable
                    rows={availableRows}
                    loading={loading}
                    filter={availableFilter}
                    onFilterChange={setAvailableFilter}
                    search={availableSearch}
                    onSearchChange={setAvailableSearch}
                    selectedKeys={availableSelected}
                    onSelectChange={handleAvailableSelectChange}
                    onSelectAll={handleAvailableSelectAll}
                    onAddItem={handleAdd}
                    onAddSelected={handleAddSelected}
                    allChecked={availableAllChecked}
                    indeterminate={availableIndeterminate}
                    ingredientLabel={ingredientLabel}
                    compoundLabel={compoundLabel}
                    tableHeight={tableHeight}
                />

                {/* ADDED TABLE */}
                <AddedTable
                    rows={addedRows}
                    filter={addedFilter}
                    onFilterChange={setAddedFilter}
                    search={addedSearch}
                    onSearchChange={setAddedSearch}
                    selectedKeys={addedSelected}
                    onSelectChange={handleAddedSelectChange}
                    onSelectAll={handleAddedSelectAll}
                    onQtyChange={handleQtyChange}
                    onRemoveItem={handleRemove}
                    onRemoveSelected={handleRemoveSelected}
                    onRemoveAll={handleRemoveAll}
                    allChecked={addedAllChecked}
                    indeterminate={addedIndeterminate}
                    priceByKey={priceByKey}
                    totalItemsCount={totalItemsCount}
                    totalIngredientCount={totalIngredientCount}
                    totalCompoundCount={totalCompoundCount}
                    totalCost={totalCost}
                    ingredientLabel={ingredientLabel}
                    compoundLabel={compoundLabel}
                    isEmpty={addedRowsMap.size === 0}
                    menuPrice={menuPrice}
                    showProfitMargin={showProfitMargin}
                    tableHeight={tableHeight}
                    onNavigateFocus={onNavigateFocus ?? handleNavigateFocus}
                />
            </Box>
        </Stack>
    );
});
