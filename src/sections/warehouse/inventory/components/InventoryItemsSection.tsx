import type { IngredientReportLookup, InventoryItemsSectionProps } from '../types';
import type { ColumnDef, PickerItem, SummaryEntry } from 'src/sections/warehouse/utils/components/item-picker';

import React, { useRef, useMemo, useEffect, useCallback, startTransition } from 'react';

import { useGetIngredientReports } from 'src/actions/ingredient-reports';

import { useIngredients } from 'src/sections/warehouse/invoice';
import {
    formatPrice,
    ItemPickerSection,
} from 'src/sections/warehouse/utils/components/item-picker';

import { useInventoryItems } from '../hooks/useInventoryItems';

const EMPTY_LOOKUP: IngredientReportLookup = {};
export const InventoryItemsSection = React.memo(function InventoryItemsSection({
    apiRef,
    storageId,
    date,
    onHasItemsChange,
    onIngredientsLoadingChange,
    onOpenIngredientDialog,
    onCancel,
    onSave,
    cancelDisabled,
    saveDisabled,
    isSaving,
}: InventoryItemsSectionProps) {
    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();
    const {
        transferredIds,
        quantities,
        excludedIdSet,
        handleQuantityChange,
        moveRight,
        removeIds,
        restoreFromPersisted,
        getBatchData,
    } = useInventoryItems();

    // Fetch ingredient reports for system quantities and prices
    const reportParams = useMemo(() => {
        if (!storageId || !date) return undefined;
        return {
            storage_id: storageId,
            start: date,
            end: date,
            limit: 500,
            offset: 0,
        };
    }, [storageId, date]);

    const { reports } = useGetIngredientReports(reportParams);

    const reportLookup = useMemo<IngredientReportLookup>(() => {
        if (!reports || reports.length === 0) return EMPTY_LOOKUP;
        const map: IngredientReportLookup = {};
        reports.forEach((r) => {
            map[r.ingredient_id] = {
                systemQuantity: parseFloat(r.end_qty) || 0,
                pricePerUnit: parseFloat(r.cost_end) || 0,
            };
        });
        return map;
    }, [reports]);

    // Ref for stable handleQuickAdd
    const transferredIdsRef = useRef(transferredIds);
    transferredIdsRef.current = transferredIds;

    useEffect(() => {
        onIngredientsLoadingChange(ingredientsLoading);
    }, [ingredientsLoading, onIngredientsLoadingChange]);

    const orderedUniqueIds = useMemo(() => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const rowId of transferredIds) {
            if (seen.has(rowId)) continue;
            seen.add(rowId);
            out.push(rowId);
        }
        return out;
    }, [transferredIds]);

    const hasItems = orderedUniqueIds.length > 0;
    const prevHasRef = useRef(hasItems);
    useEffect(() => {
        if (prevHasRef.current !== hasItems) {
            prevHasRef.current = hasItems;
            onHasItemsChange(hasItems);
        }
    }, [hasItems, onHasItemsChange]);

    // Also notify on mount if items were restored
    useEffect(() => {
        onHasItemsChange(hasItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ingredientsById = useMemo(() => {
        const map = new Map<string, (typeof ingredients)[number]>();
        ingredients.forEach((ing) => map.set(ing.id, ing));
        return map;
    }, [ingredients]);

    // Build pickerItems from ingredients
    const pickerItems: PickerItem[] = useMemo(
        () => ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            measurement: ing.measurement,
        })),
        [ingredients]
    );

    // Build transferredItems with system quantity, counted quantity, difference, and impact
    const transferredItems: PickerItem[] = useMemo(() => orderedUniqueIds
            .map((rowId) => {
                const ing = ingredientsById.get(rowId);
                if (!ing) return null;

                const report = reportLookup[rowId];
                const systemQty = report?.systemQuantity ?? 0;
                const counted = quantities[rowId] ?? 0;
                const diff = counted - systemQty;
                const pricePerUnit = report?.pricePerUnit ?? 0;
                const impact = diff * pricePerUnit;

                return {
                    id: rowId,
                    name: ing.name,
                    measurement: ing.measurement,
                    system_quantity: systemQty,
                    counted_quantity: counted,
                    difference: diff,
                    impact,
                };
            })
            .filter(Boolean) as PickerItem[], [orderedUniqueIds, ingredientsById, quantities, reportLookup]);

    // Define columns for ItemPickerSection
    const columns: ColumnDef[] = useMemo(
        () => [
            {
                key: 'system_quantity',
                header: 'System Qty',
                width: '100px',
                editable: false,
                align: 'center',
                format: (val) => String(val ?? '—'),
            },
            {
                key: 'counted_quantity',
                header: 'Counted Qty',
                width: '100px',
                editable: true,
                type: 'number',
                step: '0.01',
                min: '0',
                align: 'center',
            },
            {
                key: 'difference',
                header: 'Difference',
                width: '100px',
                editable: false,
                align: 'center',
                format: (val) => String(val ?? '—'),
                colorFn: (item) => {
                    const diff = Number(item.difference) || 0;
                    return diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : undefined;
                },
            },
            {
                key: 'impact',
                header: 'Impact',
                width: '100px',
                editable: false,
                align: 'right',
                format: (val) => formatPrice(Number(val) || 0),
                colorFn: (item) => {
                    const impact = Number(item.impact) || 0;
                    return impact > 0 ? 'success.main' : impact < 0 ? 'error.main' : undefined;
                },
            },
        ],
        []
    );

    // Summary entries from inventory summary logic
    const summaryEntries: SummaryEntry[] = useMemo(() => {
        let shortage = 0;
        let surplus = 0;
        let remaining = 0;

        const seen = new Set<string>();
        transferredIds.forEach((id) => {
            if (seen.has(id)) return;
            seen.add(id);
            const report = reportLookup[id];
            if (!report) return;
            const counted = quantities[id];
            if (counted === undefined) return;
            const diff = counted - report.systemQuantity;
            const impact = diff * report.pricePerUnit;
            if (diff > 0) {
                surplus += impact;
            } else if (diff < 0) {
                shortage += Math.abs(impact);
            }
            remaining += counted * report.pricePerUnit;
        });

        return [
            {
                label: 'Products',
                value: orderedUniqueIds.length,
            },
            {
                label: 'Surplus',
                value: formatPrice(surplus),
            },
            {
                label: 'Shortage',
                value: formatPrice(shortage),
            },
            {
                label: 'Remaining',
                value: formatPrice(remaining),
            },
        ];
    }, [orderedUniqueIds.length, transferredIds, reportLookup, quantities]);

    const handleQuickAdd = useCallback(
        (id: string) => {
            if (transferredIdsRef.current.includes(id)) return;
            moveRight([id]);
            handleQuantityChange(id, '1');
        },
        [moveRight, handleQuantityChange]
    );

    const handleMoveRight = useCallback(
        (ids: string[]) => {
            startTransition(() => {
                moveRight(ids);
            });
        },
        [moveRight]
    );

    const handleRemoveRow = useCallback(
        (id: string) => removeIds([id]),
        [removeIds]
    );

    const handleRemoveMany = useCallback(
        (ids: string[]) => {
            startTransition(() => {
                removeIds(ids);
            });
        },
        [removeIds]
    );

    const handleValueChange = useCallback(
        (id: string, key: string, value: string) => {
            if (key === 'counted_quantity') {
                handleQuantityChange(id, value);
            }
        },
        [handleQuantityChange]
    );

    // Expose API to parent
    apiRef.current = {
        getBatchData,
        restoreFromPersisted,
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
            onAddNewItem={onOpenIngredientDialog}
            summaryEntries={summaryEntries}
            totalLabel="Total"
            totalValue=""
            onCancel={onCancel}
            onSave={onSave}
            cancelDisabled={cancelDisabled}
            saveDisabled={saveDisabled}
            saveLabel="Save"
        />
    );
});
