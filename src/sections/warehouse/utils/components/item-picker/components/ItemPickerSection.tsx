import type { ItemPickerSectionProps } from '../types';

import React, { useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';
import { useGetIngredientReports } from 'src/actions/ingredient-reports';

import { buildGridTemplate } from '../constants';
import { AddedItemsPanel } from './AddedItemsPanel';
import { AvailableItemsPanel } from './AvailableItemsPanel';

export const ItemPickerSection = React.memo(function ItemPickerSection({
    // Available
    items,
    loading = false,

    // Transferred
    transferredItems,
    excludedIdSet,

    // Columns & values
    columns,
    onValueChange,

    // Callbacks
    onQuickAdd,
    onMoveRight,
    onRemoveRow,
    onRemoveMany,
    onAddNewItem,

    // Summary
    summaryEntries,
    totalLabel,
    totalValue,

    onNavigateFocus,
    metaFieldsOpen,
    tableHeight,
    filters,
}: ItemPickerSectionProps) {
    const [rightSearchTerm, setRightSearchTerm] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');

    const warehouseEnabled = !!filters?.warehouse?.enabled;
    const groupEnabled = !!filters?.group?.enabled;
    const filtersEnabled = warehouseEnabled || groupEnabled;

    const metadataEntities = useMemo(() => {
        const list = [];
        if (warehouseEnabled) list.push(MetadataEntity.STORAGES);
        if (groupEnabled) list.push(MetadataEntity.INGREDIENT_GROUPS);
        return list;
    }, [warehouseEnabled, groupEnabled]);

    const { data: metadata } = useMetadata(metadataEntities);

    const localeSort = (a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });

    const warehouseOptions = useMemo(
        () =>
            (metadata.storages ?? [])
                .filter((s: any) => !s.is_deleted)
                .map((s) => ({ id: String(s.id), name: String(s.name ?? '') }))
                .sort(localeSort),
        [metadata.storages]
    );
    const groupOptions = useMemo(
        () =>
            (metadata.ingredient_groups ?? [])
                .filter((g: any) => !g.is_deleted)
                .map((g) => ({ id: String(g.id), name: String(g.name ?? '') }))
                .sort(localeSort),
        [metadata.ingredient_groups]
    );

    const reportsParams = useMemo(() => {
        if (!warehouseEnabled || !selectedWarehouseId) return undefined;
        const today = new Date().toISOString().slice(0, 10);
        return {
            storage_id: selectedWarehouseId,
            start: '1970-01-01',
            end: today,
            limit: 5000,
            offset: 0,
        };
    }, [warehouseEnabled, selectedWarehouseId]);

    const { reports, reportsLoading } = useGetIngredientReports(reportsParams);

    const warehouseAllowedIdSet = useMemo<Set<string> | null>(() => {
        if (!warehouseEnabled || !selectedWarehouseId) return null;
        return new Set(reports.map((r: any) => String(r.ingredient_id ?? r.id)));
    }, [warehouseEnabled, selectedWarehouseId, reports]);

    const filteredAvailableItems = useMemo(() => {
        if (!groupEnabled || !selectedGroupId) return items;
        return items.filter((item) => String((item as any).group_id ?? '') === selectedGroupId);
    }, [items, groupEnabled, selectedGroupId]);

    const gridTemplate = useMemo(() => buildGridTemplate(columns), [columns]);

    const filteredTransferred = useMemo(() => {
        if (!rightSearchTerm) return transferredItems;
        return transferredItems.filter((item) =>
            item.name.toLowerCase().includes(rightSearchTerm.toLowerCase())
        );
    }, [transferredItems, rightSearchTerm]);

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 7fr' },
                gap: 2,
            }}
        >
            <AvailableItemsPanel
                items={filteredAvailableItems}
                loading={loading}
                excludedIdSet={excludedIdSet}
                onMoveRight={onMoveRight}
                onQuickAdd={onQuickAdd}
                onAddNewItem={onAddNewItem}
                metaFieldsOpen={metaFieldsOpen}
                tableHeight={tableHeight}
                filters={filtersEnabled ? filters : undefined}
                warehouseOptions={warehouseOptions}
                groupOptions={groupOptions}
                selectedWarehouseId={selectedWarehouseId}
                onWarehouseChange={setSelectedWarehouseId}
                selectedGroupId={selectedGroupId}
                onGroupChange={setSelectedGroupId}
                warehouseAllowedIdSet={warehouseAllowedIdSet}
                warehouseFilterLoading={reportsLoading}
            />

            <AddedItemsPanel
                items={filteredTransferred}
                columns={columns}
                onValueChange={onValueChange}
                onRemoveRow={onRemoveRow}
                onRemoveMany={onRemoveMany}
                searchTerm={rightSearchTerm}
                onSearchChange={setRightSearchTerm}
                gridTemplate={gridTemplate}
                itemCount={transferredItems.length}
                onNavigateFocus={onNavigateFocus}
                summaryEntries={summaryEntries}
                totalLabel={totalLabel}
                totalValue={totalValue}
                metaFieldsOpen={metaFieldsOpen}
                tableHeight={tableHeight}
            />
        </Box>
    );
});
