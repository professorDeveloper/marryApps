import type { AddedInventoryItemsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { Box, Chip, Paper, Button, TextField, Typography, InputAdornment } from '@mui/material';

import { AddedInventoryItemRow } from './AddedInventoryItemRow';
import { LIST_MAX_HEIGHT, ROW_ESTIMATE_PX, INVENTORY_ROW_GRID } from '../constants';

export const AddedInventoryItemsPanel = React.memo<AddedInventoryItemsPanelProps>(({
    transferredItems,
    quantities,
    reportLookup,
    onQuantityChange,
    onRemoveRow,
    onRemoveMany,
    rightSearchTerm = '',
    onRightSearchChange,
}) => {
    const { t } = useTranslation('menu');

    const [batchRemoveArmed, setBatchRemoveArmed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredRef = useRef(transferredItems);
    useEffect(() => {
        filteredRef.current = transferredItems;
    }, [transferredItems]);

    useEffect(() => {
        setBatchRemoveArmed(false);
    }, [rightSearchTerm, transferredItems.length]);

    const handleToggleBatchArm = useCallback(() => setBatchRemoveArmed((v) => !v), []);

    const handleRemoveBatch = useCallback(() => {
        if (!batchRemoveArmed) return;
        const list = filteredRef.current;
        if (list.length === 0) return;
        onRemoveMany(list.map((item) => item.id));
        setBatchRemoveArmed(false);
    }, [onRemoveMany, batchRemoveArmed]);

    const removeTitle = t('warehouse.invoiceDetails.removeLine');

    const rowVirtualizer = useVirtualizer({
        count: transferredItems.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_ESTIMATE_PX,
        overscan: 10,
    });

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                        {t('warehouse.invoiceDetails.selectedItems')}
                    </Typography>
                    <Chip label={transferredItems.length} size="small" color="primary" />
                </Box>
                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={batchRemoveArmed ? handleRemoveBatch : handleToggleBatchArm}
                    disabled={transferredItems.length === 0}
                >
                    {t('warehouse.invoiceDetails.removeBatch')}
                </Button>
            </Box>

            <TextField
                size="small"
                placeholder={t('search')}
                fullWidth
                value={rightSearchTerm}
                onChange={(e) => onRightSearchChange?.(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 1 }}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: INVENTORY_ROW_GRID,
                    columnGap: 1,
                    px: 1,
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                }}
            >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.product')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('calculation.systemQty')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('calculation.countedQty')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('calculation.difference')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right' }}>
                    {t('calculation.impact')}
                </Typography>
                <Box />
            </Box>

            <Box ref={scrollRef} sx={{ maxHeight: LIST_MAX_HEIGHT, overflow: 'auto', position: 'relative' }}>
                {transferredItems.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                        <Typography variant="body2">
                            {t('warehouse.invoiceDetails.noItemsAdded')}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((vi) => {
                            const item = transferredItems[vi.index];
                            const report = reportLookup[item.id];
                            const hasReport = !!report;
                            const systemQty = report?.systemQuantity;
                            const counted = quantities[item.id];
                            const diff = (systemQty !== undefined && counted !== undefined)
                                ? counted - systemQty
                                : undefined;
                            const impact = (diff !== undefined && report)
                                ? diff * report.pricePerUnit
                                : undefined;

                            return (
                                <Box
                                    key={item.id}
                                    data-index={vi.index}
                                    ref={rowVirtualizer.measureElement}
                                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                                >
                                    <AddedInventoryItemRow
                                        rowIndex={vi.index}
                                        id={item.id}
                                        name={item.name}
                                        measurement={item.measurement}
                                        quantity={quantities[item.id] ?? ''}
                                        hasReport={hasReport}
                                        systemQuantity={systemQty}
                                        difference={diff}
                                        impact={impact}
                                        onQuantityChange={onQuantityChange}
                                        onRemoveRow={onRemoveRow}
                                        removeTitle={removeTitle}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Paper>
    );
});
