import type { IngredientReportLookup, InventoryItemsSectionProps } from '../types';
import type { ColumnDef, PickerItem, SummaryEntry } from 'src/sections/warehouse/utils/components/item-picker';

import React, { useRef, useMemo, useEffect, useCallback } from 'react';

import { Box, Button } from '@mui/material';

import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';
import { useGetInventoryStatus } from 'src/actions/ingredient-reports';

import {
    formatPrice,
    ItemPickerSection,
} from 'src/sections/warehouse/utils/components/item-picker';

import { useInventoryItems } from '../hooks/useInventoryItems';

const EMPTY_LOOKUP: IngredientReportLookup = {};
const INGREDIENT_FIELDS = ['id', 'name', 'group_id', 'measurement'];
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
    metaFieldsOpen,
    tableHeight,
}: InventoryItemsSectionProps) {
    const { data: metadata, isLoading: ingredientsLoading, mutate: refetchMetadata } = useMetadata([
        { entity: MetadataEntity.INGREDIENTS, fields: INGREDIENT_FIELDS },
    ]);
    const ingredients = useMemo(
        () => (metadata.ingredients ?? []) as Array<{
            id: string;
            name: string;
            group_id?: string;
            measurement?: string;
        }>,
        [metadata.ingredients]
    );
    const refreshIngredients = useCallback(async () => {
        await refetchMetadata();
    }, [refetchMetadata]);
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

    // Fetch inventory status for current quantities and prices
    const { reports } = useGetInventoryStatus(storageId, {
        end: date.split('T')[0], // Use only date part, not time
        limit: 1000,
    });

    const reportLookup = useMemo<IngredientReportLookup>(() => {
        if (!reports || reports.length === 0) return EMPTY_LOOKUP;
        const map: IngredientReportLookup = {};
        reports.forEach((report: any) => {
            const endQty = parseFloat(report.end_quantity) || 0;
            const endAmount = parseFloat(report.end_quantity) || 0;
            const pricePerUnit = endQty > 0 ? endAmount / endQty : 0;

            map[report.ingredient_id] = {
                systemQuantity: endQty,
                pricePerUnit,
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
            group_id: ing.group_id,
        })),
        [ingredients]
    );

    // Build transferredItems with system quantity, counted quantity, difference, and impact
    const transferredItems: PickerItem[] = useMemo(() => {
        const items = orderedUniqueIds
            .map((rowId) => {
                const ing = ingredientsById.get(rowId);
                if (!ing) return null;

                const report = reportLookup[rowId];
                const systemQty = report?.systemQuantity ?? 0;
                const counted = quantities[rowId];
                const diff = (counted ?? 0) - systemQty;
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
                    price_per_unit: pricePerUnit,
                };
            })
            .filter(Boolean) as PickerItem[];

        console.log('transferredItems recalculated:', items);
        console.log('quantities state:', quantities);
        return items;
    }, [orderedUniqueIds, ingredientsById, quantities, reportLookup]);

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
                step: '1',
                min: '0',
                align: 'center',
                suffix: (item) => item.measurement || '',
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

        console.log('Calculating summary with transferredItems:', transferredItems);

        transferredItems.forEach((item) => {
            const diff = Number(item.difference) || 0;
            const impact = Number(item.impact) || 0;
            const counted = Number(item.counted_quantity) || 0;
            const pricePerUnit = Number(item.price_per_unit) || 0;

            console.log(`Item ${item.id}: diff=${diff}, impact=${impact}, counted=${counted}, pricePerUnit=${pricePerUnit}`);

            if (diff > 0) surplus += impact;
            else if (diff < 0) shortage += Math.abs(impact);
            remaining += counted * pricePerUnit;
        });

        const result = [
            {
                label: 'Products',
                value: transferredItems.length,
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
        console.log('Summary result:', result);
        return result;
    }, [transferredItems]);

    // Calculate total value for summary panel
    const totalValue = useMemo(() => {
        const total = transferredItems.reduce((sum, item) => {
            const counted = Number(item.counted_quantity) || 0;
            const pricePerUnit = Number(item.price_per_unit) || 0;
            return sum + (counted * pricePerUnit);
        }, 0);
        return formatPrice(total);
    }, [transferredItems]);

    const handleQuickAdd = useCallback(
        (id: string) => {
            if (transferredIdsRef.current.includes(id)) return;
            moveRight([id]);
        },
        [moveRight]
    );

    const handleMoveRight = useCallback(
        (ids: string[]) => {
            moveRight(ids);
        },
        [moveRight]
    );

    const handleRemoveRow = useCallback(
        (id: string) => removeIds([id]),
        [removeIds]
    );

    const handleRemoveMany = useCallback(
        (ids: string[]) => {
            removeIds(ids);
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

    const handleNavigateFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => {
        // Inventory form only has one editable column, so horizontal navigation is not applicable
        if (direction === 'left' || direction === 'right') return;

        const targetRowIndex = direction === 'down' ? currentRowIndex + 1 : currentRowIndex - 1;
        // Find the counted quantity input in the target row
        const inputs = document.querySelectorAll('input[inputMode="decimal"]') as NodeListOf<HTMLInputElement>;
        // The counted quantity inputs are the ones with placeholder="0"
        const countedInputs = Array.from(inputs).filter(input =>
            input.getAttribute('placeholder') === '0' &&
            input.closest('[data-index]')
        );
        // Sort by data-index to get correct order
        countedInputs.sort((a, b) => {
            const indexA = parseInt(a.closest('[data-index]')?.getAttribute('data-index') || '0');
            const indexB = parseInt(b.closest('[data-index]')?.getAttribute('data-index') || '0');
            return indexA - indexB;
        });
        const targetInput = countedInputs[targetRowIndex];
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
        }
    }, []);

    // Expose API to parent
    apiRef.current = {
        getBatchData,
        restoreFromPersisted,
        refreshIngredients,
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                totalValue={totalValue}
                onNavigateFocus={handleNavigateFocus}
                metaFieldsOpen={metaFieldsOpen}
                tableHeight={tableHeight}
                filters={{ warehouse: { enabled: true }, group: { enabled: true } }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={cancelDisabled}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => void onSave()}
                    disabled={saveDisabled || isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </Box>
        </Box>
    );
});
