import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback, startTransition } from 'react';

import { useIngredients } from 'src/sections/warehouse/invoice/hooks/useIngredients';
import {
    formatPrice,
    type ColumnDef,
    type PickerItem,
    ItemPickerSection,
    type SummaryEntry,
} from 'src/sections/warehouse/utils/components/item-picker';

// ---------------------------------------------------------------------------
// Public API exposed via ref
// ---------------------------------------------------------------------------

export type MealIngredientCalculation = {
    ingredient_id: string;
    quantity: string;
};

export type MealIngredientsApi = {
    getCalculations: () => MealIngredientCalculation[];
    restoreFromPersisted: (calcs: MealIngredientCalculation[] | undefined) => void;
    refreshIngredients: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MealIngredientsSectionProps {
    apiRef: React.RefObject<MealIngredientsApi | null>;
    onHasItemsChange?: (hasItems: boolean) => void;
    onIngredientsLoadingChange?: (loading: boolean) => void;
    onCancel: () => void;
    onSave: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MealIngredientsSection = React.memo(function MealIngredientsSection({
    apiRef,
    onHasItemsChange,
    onIngredientsLoadingChange,
    onCancel,
    onSave,
    cancelDisabled = false,
    saveDisabled = false,
    saveLabel,
}: MealIngredientsSectionProps) {
    const { t } = useTranslation('menu');
    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();

    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        onIngredientsLoadingChange?.(ingredientsLoading);
    }, [ingredientsLoading, onIngredientsLoadingChange]);

    const hasItems = transferredIds.length > 0;
    const prevHasRef = useRef(hasItems);
    useEffect(() => {
        if (prevHasRef.current !== hasItems) {
            prevHasRef.current = hasItems;
            onHasItemsChange?.(hasItems);
        }
    }, [hasItems, onHasItemsChange]);

    const ingredientsById = useMemo(() => {
        const map = new Map<string, (typeof ingredients)[number]>();
        ingredients.forEach((ing) => map.set(ing.id, ing));
        return map;
    }, [ingredients]);

    const excludedIdSet = useMemo(() => new Set(transferredIds), [transferredIds]);

    const pickerItems: PickerItem[] = useMemo(
        () =>
            ingredients.map((ing) => ({
                id: ing.id,
                name: ing.name,
                measurement: ing.measurement,
            })),
        [ingredients]
    );

    const transferredItems: PickerItem[] = useMemo(() => {
        const seen = new Set<string>();
        const out: PickerItem[] = [];
        for (const id of transferredIds) {
            if (seen.has(id)) continue;
            seen.add(id);
            const ing = ingredientsById.get(id);
            if (!ing) continue;
            out.push({
                id: ing.id,
                name: ing.name,
                measurement: ing.measurement,
                quantity: quantities[id] ?? 0,
            });
        }
        return out;
    }, [transferredIds, quantities, ingredientsById]);

    const columns: ColumnDef[] = useMemo(
        () => [
            {
                key: 'quantity',
                header: t('calculation.quantity', 'Quantity'),
                width: 'minmax(120px, auto)',
                editable: true,
                type: 'number' as const,
                step: '0.01',
                min: '0',
                align: 'center' as const,
                suffix: (item: PickerItem) => item.measurement ?? '',
            },
        ],
        [t]
    );

    const totalQty = useMemo(() => {
        let sum = 0;
        for (const id of transferredIds) {
            sum += quantities[id] ?? 0;
        }
        return sum;
    }, [transferredIds, quantities]);

    const summaryEntries: SummaryEntry[] = useMemo(
        () => [
            {
                label: t('warehouse.invoiceDetails.products', 'Products'),
                value: transferredItems.length,
            },
            {
                label: t('warehouse.invoiceDetails.totalQty', 'Total Qty'),
                value: formatPrice(totalQty),
            },
        ],
        [t, transferredItems.length, totalQty]
    );

    const handleQuickAdd = useCallback(
        (id: string) => {
            if (excludedIdSet.has(id)) return;
            setTransferredIds((prev) => [...prev, id]);
            setQuantities((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
        },
        [excludedIdSet]
    );

    const handleMoveRight = useCallback((ids: string[]) => {
        if (ids.length === 0) return;
        const unique = [...new Set(ids)];
        const apply = () => {
            setTransferredIds((prev) => {
                const existing = new Set(prev);
                const toAdd = unique.filter((id) => !existing.has(id));
                return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
            });
            setQuantities((prev) => {
                const next = { ...prev };
                unique.forEach((id) => {
                    if (next[id] == null) next[id] = 1;
                });
                return next;
            });
        };
        startTransition(apply);
    }, []);

    const handleRemoveRow = useCallback((id: string) => {
        setTransferredIds((prev) => prev.filter((x) => x !== id));
        setQuantities((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const handleRemoveMany = useCallback((ids: string[]) => {
        const removeSet = new Set(ids);
        const apply = () => {
            setTransferredIds((prev) => prev.filter((x) => !removeSet.has(x)));
            setQuantities((prev) => {
                const next = { ...prev };
                ids.forEach((id) => delete next[id]);
                return next;
            });
        };
        startTransition(apply);
    }, []);

    const handleValueChange = useCallback((id: string, key: string, value: string) => {
        if (key !== 'quantity') return;
        const parsed = value.trim() === '' ? 0 : parseFloat(value);
        setQuantities((prev) => ({
            ...prev,
            [id]: Number.isFinite(parsed) ? parsed : 0,
        }));
    }, []);

    apiRef.current = {
        getCalculations: () => {
            const seen = new Set<string>();
            const out: MealIngredientCalculation[] = [];
            for (const id of transferredIds) {
                if (seen.has(id)) continue;
                seen.add(id);
                out.push({
                    ingredient_id: id,
                    quantity: String(quantities[id] ?? 0),
                });
            }
            return out;
        },
        restoreFromPersisted: (calcs) => {
            if (!calcs || calcs.length === 0) {
                setTransferredIds([]);
                setQuantities({});
                return;
            }
            const ids: string[] = [];
            const qtyMap: Record<string, number> = {};
            calcs.forEach((c) => {
                if (!c.ingredient_id) return;
                ids.push(c.ingredient_id);
                qtyMap[c.ingredient_id] = parseFloat(c.quantity) || 0;
            });
            setTransferredIds(ids);
            setQuantities(qtyMap);
        },
        refreshIngredients,
    };

    return (
        <ItemPickerSection
            items={pickerItems}
            loading={ingredientsLoading}
            transferredItems={transferredItems}
            excludedIdSet={excludedIdSet}
            columns={columns}
            onValueChange={handleValueChange}
            onQuickAdd={handleQuickAdd}
            onMoveRight={handleMoveRight}
            onRemoveRow={handleRemoveRow}
            onRemoveMany={handleRemoveMany}
            summaryEntries={summaryEntries}
            totalLabel={t('calculation.total', 'Total')}
            totalValue={formatPrice(totalQty)}
            onCancel={onCancel}
            onSave={onSave}
            cancelDisabled={cancelDisabled}
            saveDisabled={saveDisabled}
            saveLabel={saveLabel}
        />
    );
});
