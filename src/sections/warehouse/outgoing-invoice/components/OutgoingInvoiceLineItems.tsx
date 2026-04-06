import type { Ingredient, OutgoingInvoiceBatchItemInput } from '../types';

import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback, startTransition } from 'react';

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

export type OutgoingInvoiceLineItemsApi = {
    getBatchData: () => OutgoingInvoiceBatchItemInput[];
    restoreFromPersisted: (items: OutgoingInvoiceBatchItemInput[]) => void;
    refreshIngredients: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OutgoingInvoiceLineItemsProps {
    apiRef: React.RefObject<OutgoingInvoiceLineItemsApi | null>;
    ingredients: Ingredient[];
    ingredientsLoading: boolean;
    onRefreshIngredients: () => Promise<void>;
    onHasItemsChange: (hasItems: boolean) => void;
    onCancel: () => void;
    onSave: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OutgoingInvoiceLineItems = React.memo(function OutgoingInvoiceLineItems({
    apiRef,
    ingredients,
    ingredientsLoading,
    onRefreshIngredients,
    onHasItemsChange,
    onCancel,
    onSave,
    cancelDisabled = false,
    saveDisabled = false,
    saveLabel,
}: OutgoingInvoiceLineItemsProps) {
    const { t } = useTranslation('menu');

    // ── Internal state ─────────────────────────────────────────────────────
    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // ── Notify parent about hasItems changes ──────────────────────────────
    const hasItems = transferredIds.length > 0;
    const prevHasRef = useRef(hasItems);
    useEffect(() => {
        if (prevHasRef.current !== hasItems) {
            prevHasRef.current = hasItems;
            onHasItemsChange(hasItems);
        }
    }, [hasItems, onHasItemsChange]);

    // ── Ingredients lookup ────────────────────────────────────────────────
    const ingredientsById = useMemo(() => {
        const map = new Map<string, Ingredient>();
        ingredients.forEach((ing) => map.set(ing.id, ing));
        return map;
    }, [ingredients]);

    // ── Excluded IDs (already added) ─────────────────────────────────────
    const excludedIdSet = useMemo(() => new Set(transferredIds), [transferredIds]);

    // ── Picker items (available list) ─────────────────────────────────────
    const pickerItems: PickerItem[] = useMemo(
        () =>
            ingredients.map((ing) => ({
                id: ing.id,
                name: ing.name,
                measurement: ing.measurement,
                price_per_unit: ing.price_per_unit,
            })),
        [ingredients]
    );

    // ── Transferred items (right panel) ───────────────────────────────────
    const transferredItems: PickerItem[] = useMemo(() => {
        const seen = new Set<string>();
        const out: PickerItem[] = [];
        for (const id of transferredIds) {
            if (seen.has(id)) continue;
            seen.add(id);
            const ing = ingredientsById.get(id);
            if (!ing) continue;

            const qty = quantities[id] ?? 0;
            const pricePerUnit = parseFloat(ing.price_per_unit || '0') || 0;

            out.push({
                id: ing.id,
                name: ing.name,
                measurement: ing.measurement,
                quantity: qty,
                price_per_unit: formatPrice(pricePerUnit),
                total: formatPrice(qty * pricePerUnit),
            });
        }
        return out;
    }, [transferredIds, quantities, ingredientsById]);

    // ── Column definitions ────────────────────────────────────────────────
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
            {
                key: 'price_per_unit',
                header: t('outgoingInvoices.pricePerUnit', 'Price'),
                width: 'minmax(120px, auto)',
                editable: false,
                align: 'right' as const,
            },
            {
                key: 'total',
                header: t('calculation.totalPrice', 'Total'),
                width: 'minmax(120px, auto)',
                editable: false,
                align: 'right' as const,
            },
        ],
        [t]
    );

    // ── Summary ───────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        let totalQty = 0;
        let totalAmount = 0;
        for (const id of transferredIds) {
            const ing = ingredientsById.get(id);
            if (!ing) continue;
            const qty = quantities[id] ?? 0;
            const ppu = parseFloat(ing.price_per_unit || '0') || 0;
            totalQty += qty;
            totalAmount += qty * ppu;
        }
        return { totalQty, totalAmount };
    }, [transferredIds, quantities, ingredientsById]);

    const summaryEntries: SummaryEntry[] = useMemo(
        () => [
            {
                label: t('warehouse.invoiceDetails.products', 'Products'),
                value: transferredItems.length,
            },
            {
                label: t('warehouse.invoiceDetails.totalQty', 'Total Qty'),
                value: formatPrice(totals.totalQty),
            },
        ],
        [t, transferredItems.length, totals.totalQty]
    );

    // ── Handlers ──────────────────────────────────────────────────────────
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
        if (key === 'quantity') {
            const parsed = value.trim() === '' ? 0 : parseFloat(value);
            setQuantities((prev) => ({
                ...prev,
                [id]: Number.isFinite(parsed) ? parsed : 0,
            }));
        }
    }, []);

    // ── Expose API via ref ────────────────────────────────────────────────
    apiRef.current = {
        getBatchData: () => {
            const seen = new Set<string>();
            const batch: OutgoingInvoiceBatchItemInput[] = [];
            for (const id of transferredIds) {
                if (seen.has(id)) continue;
                seen.add(id);
                batch.push({
                    ingredient_id: id,
                    quantity: String(quantities[id] ?? 0),
                });
            }
            return batch;
        },
        restoreFromPersisted: (items) => {
            if (!items || items.length === 0) {
                setTransferredIds([]);
                setQuantities({});
                return;
            }
            const ids: string[] = [];
            const qtyMap: Record<string, number> = {};
            items.forEach((item) => {
                const ingId = item.ingredient_id;
                if (!ingId) return;
                ids.push(ingId);
                qtyMap[ingId] = parseFloat(item.quantity) || 0;
            });
            setTransferredIds(ids);
            setQuantities(qtyMap);
        },
        refreshIngredients: onRefreshIngredients,
    };

    // ── Render ────────────────────────────────────────────────────────────
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
            totalLabel={t('outgoingInvoices.totalAmount', 'Total Amount')}
            totalValue={`${formatPrice(totals.totalAmount)} UZS`}
            onCancel={onCancel}
            onSave={onSave}
            cancelDisabled={cancelDisabled}
            saveDisabled={saveDisabled}
            saveLabel={saveLabel}
        />
    );
});
