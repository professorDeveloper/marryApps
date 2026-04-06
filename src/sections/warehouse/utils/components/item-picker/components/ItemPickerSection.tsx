import type { ItemPickerSectionProps } from '../types';

import React, { useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { SummaryPanel } from './SummaryPanel';
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

    // Actions
    onCancel,
    onSave,
    cancelDisabled,
    saveDisabled,
    saveLabel,
}: ItemPickerSectionProps) {
    const [rightSearchTerm, setRightSearchTerm] = useState('');

    const gridTemplate = useMemo(() => buildGridTemplate(columns), [columns]);

    const filteredTransferred = useMemo(() => {
        if (!rightSearchTerm) return transferredItems;
        const query = rightSearchTerm.toLowerCase();
        return transferredItems.filter((item) =>
            item.name.toLowerCase().includes(query)
        );
    }, [transferredItems, rightSearchTerm]);

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '9fr 3fr' },
                gap: 2,
            }}
        >
            {/* Left: Available + Added panels */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '2fr 7fr' },
                    gap: 2,
                }}
            >
                <AvailableItemsPanel
                    items={items}
                    loading={loading}
                    excludedIdSet={excludedIdSet}
                    onMoveRight={onMoveRight}
                    onQuickAdd={onQuickAdd}
                    onAddNewItem={onAddNewItem}
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
                />
            </Box>

            {/* Right: Summary sidebar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SummaryPanel
                    entries={summaryEntries}
                    totalLabel={totalLabel}
                    totalValue={totalValue}
                    onCancel={onCancel}
                    onSave={onSave}
                    cancelDisabled={cancelDisabled}
                    saveDisabled={saveDisabled}
                    saveLabel={saveLabel}
                />
            </Box>
        </Box>
    );
});
