import { useTranslation } from 'react-i18next';
import React, { useMemo, useState, useCallback, useEffect, startTransition } from 'react';

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
                measurement: mod.is_active ? t('mealsProducts.status', 'Active') : t('mealsProducts.status', 'Inactive'),
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
                measurement: mod.is_active ? t('mealsProducts.status', 'Active') : t('mealsProducts.status', 'Inactive'),
            });
        }
        return out;
    }, [transferredIds, modifiersById, t]);

    // No editable columns for modifiers - they are binary attached/detached
    const columns: ColumnDef[] = useMemo(
        () => [
            {
                key: 'code',
                header: t('modifiers.code', 'Code'),
                width: 'minmax(150px, auto)',
                align: 'left',
            },
        ],
        [t]
    );

    const summaryEntries: SummaryEntry[] = useMemo(
        () => [
            {
                label: t('mealsProducts.totalModifiers', 'Total'),
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
            totalLabel={t('mealsProducts.totalModifiers', 'Total')}
            totalValue={formatPrice(transferredItems.length)}
            onCancel={onCancel}
            onSave={onSave}
            cancelDisabled={cancelDisabled}
            saveDisabled={saveDisabled}
            saveLabel={saveLabel}
            metaFieldsOpen={metaFieldsOpen}
        />
    );
});
