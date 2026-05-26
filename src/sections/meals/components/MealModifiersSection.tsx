import { useTranslation } from 'react-i18next';
import React, { useMemo, useState, useCallback, useEffect, startTransition } from 'react';

import { Box, Button } from '@mui/material';

import { useGetModifiers } from 'src/actions/modifiers';
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

export type MealModifierIds = string[];

export type MealModifiersApi = {
    getModifierIds: () => string[];
    restoreFromPersisted: (modifierIds: string[] | undefined) => void;
    refreshModifiers: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MealModifiersSectionProps {
    apiRef: React.RefObject<MealModifiersApi | null>;
    isVisible?: boolean;
    metaFieldsOpen?: boolean;
    tableHeight?: string | number;
    onCancel?: () => void;
    onSave?: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MealModifiersSection = React.memo(function MealModifiersSection({
    apiRef,
    isVisible = true,
    metaFieldsOpen,
    tableHeight,
    onCancel,
    onSave,
    cancelDisabled,
    saveDisabled,
    saveLabel,
}: MealModifiersSectionProps) {
    const { t } = useTranslation('menu');
    const { modifiers, modifiersLoading, modifiersValidating } = useGetModifiers(undefined, {
        limit: 1000,
    });

    const [transferredIds, setTransferredIds] = useState<string[]>([]);

    const modifiersById = useMemo(() => {
        const map = new Map<string, (typeof modifiers)[number]>();
        modifiers?.forEach((mod) => map.set(mod.id, mod));
        return map;
    }, [modifiers]);

    const excludedIdSet = useMemo(() => new Set(transferredIds), [transferredIds]);

    const pickerItems: PickerItem[] = useMemo(
        () =>
            (modifiers || []).map((mod) => ({
                id: mod.id,
                name: mod.name,
                code: mod.code,
                description: mod.description,
                is_active: mod.is_active,
                measurement: mod.is_active ? t('mealsProducts.status') : t('mealsProducts.status'),
            })),
        [modifiers, t]
    );

    const transferredItems: PickerItem[] = useMemo(() => {
        const seen = new Set<string>();
        const out: PickerItem[] = [];
        for (const id of transferredIds) {
            if (seen.has(id)) continue;
            seen.add(id);
            const mod = modifiersById.get(id);
            if (!mod) continue;
            out.push({
                id: mod.id,
                name: mod.name,
                code: mod.code,
                description: mod.description,
                is_active: mod.is_active,
                measurement: mod.is_active ? t('mealsProducts.status') : t('mealsProducts.status'),
            });
        }
        return out;
    }, [transferredIds, modifiersById, t]);

    // No editable columns for modifiers - they are binary attached/detached
    const columns: ColumnDef[] = useMemo(
        () => [
            {
                key: 'code',
                header: t('modifiers.code'),
                width: 'minmax(150px, auto)',
                align: 'left',
            },
        ],
        [t]
    );

    const summaryEntries: SummaryEntry[] = useMemo(
        () => [
            {
                label: t('mealsProducts.totalModifiers'),
                value: transferredItems.length,
            },
        ],
        [t, transferredItems.length]
    );

    const handleQuickAdd = useCallback(
        (id: string) => {
            if (excludedIdSet.has(id)) return;
            setTransferredIds((prev) => [...prev, id]);
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
        };
        startTransition(apply);
    }, []);

    const handleRemoveRow = useCallback((id: string) => {
        setTransferredIds((prev) => prev.filter((x) => x !== id));
    }, []);

    const handleRemoveMany = useCallback((ids: string[]) => {
        const removeSet = new Set(ids);
        const apply = () => {
            setTransferredIds((prev) => prev.filter((x) => !removeSet.has(x)));
        };
        startTransition(apply);
    }, []);

    // Imperative API
    apiRef.current = {
        getModifierIds: () => {
            const seen = new Set<string>();
            const out: string[] = [];
            for (const id of transferredIds) {
                if (seen.has(id)) continue;
                seen.add(id);
                out.push(id);
            }
            return out;
        },
        restoreFromPersisted: (modifierIds) => {
            if (!modifierIds || modifierIds.length === 0) {
                setTransferredIds([]);
                return;
            }
            setTransferredIds(modifierIds);
        },
        refreshModifiers: async () => {
            // The useGetModifiers hook handles its own caching/revalidation
        },
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <ItemPickerSection
                items={pickerItems}
                loading={modifiersLoading || modifiersValidating}
                transferredItems={transferredItems}
                excludedIdSet={excludedIdSet}
                columns={columns}
                onValueChange={() => {}} // No editable values for modifiers
                onQuickAdd={handleQuickAdd}
                onMoveRight={handleMoveRight}
                onRemoveRow={handleRemoveRow}
                onRemoveMany={handleRemoveMany}
                summaryEntries={summaryEntries}
                totalLabel={t('mealsProducts.totalModifiers')}
                totalValue={formatPrice(transferredItems.length)}
                metaFieldsOpen={metaFieldsOpen}
                tableHeight={tableHeight}
            />
            {/* {onCancel && onSave && (
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
                        {saveLabel ?? t('common.save')}
                    </Button>
                </Box>
            )} */}
        </Box>
    );
});
