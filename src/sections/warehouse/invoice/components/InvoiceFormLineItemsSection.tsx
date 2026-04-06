import type { InvoiceLineItemsApi, InvoiceFormLineItemsSectionProps } from '../types';
import type { ColumnDef, PickerItem, SummaryEntry } from 'src/sections/warehouse/utils/components/item-picker';

import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useEffect, useCallback, startTransition } from 'react';

import {
    formatPrice,
    ItemPickerSection,
} from 'src/sections/warehouse/utils/components/item-picker';

import {
    useIngredients,
    useTransferredItems,
} from '..';

export type { InvoiceLineItemsApi };

export const InvoiceFormLineItemsSection = React.memo(function InvoiceFormLineItemsSection({
    apiRef,
    onHasItemsChange,
    onIngredientsLoadingChange,
    onOpenIngredientDialog,
    onInvoiceCancel,
    onInvoiceSave,
    invoiceCancelDisabled,
    invoiceSaveDisabled,
    saveLabel,
}: InvoiceFormLineItemsSectionProps) {
    const { t } = useTranslation('menu');
    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();
    const {
        transferredIds,
        quantities,
        pricesPerUnit,
        prices,
        localBatchData,
        moveRight,
        removeIngredientIds,
        handleQuantityChange,
        handlePricePerUnitChange,
        handleTotalPriceChange,
        restoreFromPersisted,
    } = useTransferredItems();

    const transferredIdsRef = useRef(transferredIds);
    transferredIdsRef.current = transferredIds;

    const orderedUniqueIds = useMemo(() => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const id of transferredIds) {
            if (seen.has(id)) continue;
            seen.add(id);
            out.push(id);
        }
        return out;
    }, [transferredIds]);

    const excludedIdSet = useMemo(() => new Set(transferredIds), [transferredIds]);

    useEffect(() => {
        onIngredientsLoadingChange(ingredientsLoading);
    }, [ingredientsLoading, onIngredientsLoadingChange]);

    const hasItems = orderedUniqueIds.length > 0;
    const prevHasRef = useRef(hasItems);
    useEffect(() => {
        if (prevHasRef.current !== hasItems) {
            prevHasRef.current = hasItems;
            onHasItemsChange(hasItems);
        }
    }, [hasItems, onHasItemsChange]);

    // Build pickerItems from ingredients
    const pickerItems: PickerItem[] = useMemo(
        () => ingredients.map((ing) => ({
            id: ing.id,
            name: ing.name,
            measurement: ing.measurement,
        })),
        [ingredients]
    );

    const ingredientsById = useMemo(() => {
        const map = new Map<string, (typeof ingredients)[number]>();
        ingredients.forEach((ing) => {
            map.set(ing.id, ing);
        });
        return map;
    }, [ingredients]);

    // Build transferredItems with all required fields for columns
    const transferredItems: PickerItem[] = useMemo(() => orderedUniqueIds
            .map((rowId) => {
                const ingredient = ingredientsById.get(rowId);
                if (!ingredient) return null;

                const qty = quantities[rowId] ?? 0;
                const pricePerUnit = pricesPerUnit[rowId] ?? 0;
                const totalPrice = prices[rowId] ?? 0;

                return {
                    id: rowId,
                    name: ingredient.name,
                    measurement: ingredient.measurement,
                    quantity: qty,
                    price_per_unit: pricePerUnit,
                    total: totalPrice,
                };
            })
            .filter(Boolean) as PickerItem[], [orderedUniqueIds, quantities, pricesPerUnit, prices, ingredientsById]);

    // Define columns for ItemPickerSection
    const columns: ColumnDef[] = useMemo(
        () => [
            {
                key: 'quantity',
                header: t('warehouse.invoiceDetails.quantity'),
                width: '80px',
                editable: true,
                type: 'number',
                step: '0.01',
                min: '0',
                align: 'center',
                suffix: (item) => item.measurement || '',
            },
            {
                key: 'price_per_unit',
                header: t('warehouse.invoiceDetails.pricePerUnit'),
                width: '100px',
                editable: true,
                type: 'number',
                step: '0.01',
                min: '0',
                align: 'right',
                format: (val) => formatPrice(Number(val) || 0),
            },
            {
                key: 'total',
                header: t('warehouse.invoiceDetails.totalPrice'),
                width: '100px',
                editable: true,
                align: 'right',
                format: (val) => formatPrice(Number(val) || 0),
            },
        ],
        [t]
    );

    // Summary entries
    const summaryEntries: SummaryEntry[] = useMemo(
        () => [
            {
                label: t('warehouse.invoiceDetails.products'),
                value: transferredItems.length,
            },
            {
                label: t('warehouse.invoiceDetails.totalQty'),
                value: transferredItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0).toFixed(2),
            },
            {
                label: t('warehouse.invoiceDetails.totalAmount'),
                value: formatPrice(transferredItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0)),
            },
        ],
        [transferredItems, t]
    );

    const totalValue = useMemo(
        () => formatPrice(transferredItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0)),
        [transferredItems]
    );

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
            // Always defer: keeps pointer/keyboard feedback smooth while picker state reconciles.
            startTransition(() => {
                moveRight(ids);
            });
        },
        [moveRight]
    );

    const handleRemoveRow = useCallback(
        (id: string) => {
            removeIngredientIds([id]);
        },
        [removeIngredientIds]
    );

    const handleRemoveMany = useCallback(
        (ids: string[]) => {
            startTransition(() => {
                removeIngredientIds(ids);
            });
        },
        [removeIngredientIds]
    );

    const handleValueChange = useCallback(
        (id: string, key: string, value: string) => {
            if (key === 'quantity') {
                handleQuantityChange(id, value);
            } else if (key === 'price_per_unit') {
                handlePricePerUnitChange(id, value);
            } else if (key === 'total') {
                handleTotalPriceChange(id, value);
            }
        },
        [handleQuantityChange, handlePricePerUnitChange, handleTotalPriceChange]
    );

    apiRef.current = {
        getBatchData: () =>
            localBatchData.map((row) => ({
                ingredient_id: row.ingredient_id,
                quantity: String(row.quantity ?? 0),
                price_per_unit: String(row.price_per_unit ?? 0),
                price: String(row.price ?? 0),
            })),
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
            totalLabel={t('warehouse.invoiceDetails.totalAmount')}
            totalValue={totalValue}
            onCancel={onInvoiceCancel}
            onSave={onInvoiceSave}
            cancelDisabled={invoiceCancelDisabled}
            saveDisabled={invoiceSaveDisabled}
            saveLabel={saveLabel}
        />
    );
});
