import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback, startTransition } from 'react';

import { Box, Button } from '@mui/material';

import { useGetCompounds } from 'src/hooks/use-compounds';

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

export type MealCompoundCalculation = {
    compound_id: string;
    quantity: string;
};

export type MealCompoundsApi = {
    getCalculations: () => MealCompoundCalculation[];
    restoreFromPersisted: (calcs: MealCompoundCalculation[] | undefined) => void;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MealCompoundsSectionProps {
    apiRef: React.RefObject<MealCompoundsApi | null>;
    onHasItemsChange?: (hasItems: boolean) => void;
    onCancel: () => void;
    onSave: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel: string;
    metaFieldsOpen?: boolean;
    tableHeight?: string | number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MealCompoundsSection = React.memo(function MealCompoundsSection({
    apiRef,
    onHasItemsChange,
    onCancel,
    onSave,
    cancelDisabled = false,
    saveDisabled = false,
    saveLabel,
    metaFieldsOpen,
    tableHeight,
}: MealCompoundsSectionProps) {
    const { t } = useTranslation('menu');
    const { compounds, compoundsLoading } = useGetCompounds();

    const [transferredIds, setTransferredIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const hasItems = transferredIds.length > 0;
    const prevHasRef = useRef(hasItems);
    useEffect(() => {
        if (prevHasRef.current !== hasItems) {
            prevHasRef.current = hasItems;
            onHasItemsChange?.(hasItems);
        }
    }, [hasItems, onHasItemsChange]);

    const compoundsById = useMemo(() => {
        const map = new Map<string, any>();
        (compounds || []).forEach((c: any) => map.set(c.id, c));
        return map;
    }, [compounds]);

    const excludedIdSet = useMemo(() => new Set(transferredIds), [transferredIds]);

    const pickerItems: PickerItem[] = useMemo(
        () =>
            (compounds || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                measurement: c.measurement,
            })),
        [compounds]
    );

    const transferredItems: PickerItem[] = useMemo(() => {
        const seen = new Set<string>();
        const out: PickerItem[] = [];
        for (const id of transferredIds) {
            if (seen.has(id)) continue;
            seen.add(id);
            const c = compoundsById.get(id);
            if (!c) continue;
            out.push({
                id: c.id,
                name: c.name,
                measurement: c.measurement,
                quantity: quantities[id] ?? 0,
            });
        }
        return out;
    }, [transferredIds, quantities, compoundsById]);

    const columns: ColumnDef[] = useMemo(
        () => [
            {
                key: 'quantity',
                header: t('calculation.quantity'),
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
                label: t('warehouse.invoiceDetails.products'),
                value: transferredItems.length,
            },
            {
                label: t('warehouse.invoiceDetails.totalQty'),
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
            const out: MealCompoundCalculation[] = [];
            for (const id of transferredIds) {
                if (seen.has(id)) continue;
                seen.add(id);
                out.push({
                    compound_id: id,
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
                if (!c.compound_id) return;
                ids.push(c.compound_id);
                qtyMap[c.compound_id] = parseFloat(c.quantity) || 0;
            });
            setTransferredIds(ids);
            setQuantities(qtyMap);
        },
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ItemPickerSection
                items={pickerItems}
                loading={compoundsLoading}
                transferredItems={transferredItems}
                excludedIdSet={excludedIdSet}
                columns={columns}
                onValueChange={handleValueChange}
                onQuickAdd={handleQuickAdd}
                onMoveRight={handleMoveRight}
                onRemoveRow={handleRemoveRow}
                onRemoveMany={handleRemoveMany}
                summaryEntries={summaryEntries}
                totalLabel={t('calculation.total')}
                totalValue={formatPrice(totalQty)}
                metaFieldsOpen={metaFieldsOpen}
                tableHeight={tableHeight}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={cancelDisabled}
                >
                    {t('cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => void onSave()}
                    disabled={saveDisabled}
                >
                    {saveLabel}
                </Button>
            </Box>
        </Box>
    );
});
