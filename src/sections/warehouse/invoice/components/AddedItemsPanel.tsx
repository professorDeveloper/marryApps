import type { AddedItemsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import {
    Box,
    Paper,
    Button,
    TextField,
    Typography,
    InputAdornment,
} from '@mui/material';

import { AddedInvoiceItemRow } from './AddedInvoiceItemRow';
import { LIST_MAX_HEIGHT, ADDED_ROW_ESTIMATE_PX, ADDED_INVOICE_ROW_GRID } from '../constants';

export const AddedItemsPanel = React.memo<AddedItemsPanelProps>(({
    transferredItems,
    quantities,
    pricesPerUnit,
    prices,
    onQuantityChange,
    onPricePerUnitChange,
    onTotalPriceChange,
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

    const handleToggleBatchArm = useCallback(() => {
        setBatchRemoveArmed((v) => !v);
    }, []);

    const handleRemoveBatch = useCallback(() => {
        if (!batchRemoveArmed) return;
        const list = filteredRef.current;
        if (list.length === 0) return;
        onRemoveMany(list.map((item: { id: string }) => item.id));
        setBatchRemoveArmed(false);
    }, [onRemoveMany, batchRemoveArmed]);

    const removeTitle = t('warehouse.invoiceDetails.removeLine', 'Remove line');

    const rowCount = transferredItems.length;

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ADDED_ROW_ESTIMATE_PX,
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();

    const headerLabels = useMemo(
        () => ({
            product: t('warehouse.invoiceDetails.product'),
            qty: t('warehouse.invoiceDetails.quantity'),
            unit: t('warehouse.invoiceDetails.unitPrice'),
            total: t('warehouse.invoiceDetails.totalPrice'),
        }),
        [t]
    );

    return (
        <Paper sx={{ p: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.selectedItems', 'Added to Invoice')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    <Button
                        size="small"
                        variant={batchRemoveArmed ? 'contained' : 'text'}
                        color={batchRemoveArmed ? 'error' : 'inherit'}
                        onClick={handleToggleBatchArm}
                        disabled={transferredItems.length === 0}
                    >
                        {batchRemoveArmed
                            ? t('warehouse.invoiceDetails.deselectAll', 'Deselect All')
                            : t('warehouse.invoiceDetails.selectAll', 'Select All')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteSweepIcon />}
                        onClick={handleRemoveBatch}
                        disabled={!batchRemoveArmed || transferredItems.length === 0}
                    >
                        {t('warehouse.invoiceDetails.removeBatch', 'Remove batch')}
                    </Button>
                </Box>
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
                    gridTemplateColumns: ADDED_INVOICE_ROW_GRID,
                    columnGap: 1,
                    alignItems: 'center',
                    px: 1,
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                }}
            >
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    #
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {headerLabels.product}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right' }}>
                    {headerLabels.qty}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right' }}>
                    {headerLabels.unit}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right' }}>
                    {headerLabels.total}
                </Typography>
                <Box />
            </Box>

            <Box
                ref={scrollRef}
                sx={{
                    maxHeight: LIST_MAX_HEIGHT,
                    overflow: 'auto',
                    position: 'relative',
                }}
            >
                {rowCount === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                        <Typography variant="body2">
                            {t('warehouse.invoiceDetails.noItemsAdded', 'No items added')}
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            height: rowVirtualizer.getTotalSize(),
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualRows.map((vi) => {
                            const item = transferredItems[vi.index];
                            return (
                                <Box
                                    key={item.id}
                                    data-index={vi.index}
                                    ref={rowVirtualizer.measureElement}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${vi.start}px)`,
                                    }}
                                >
                                    <AddedInvoiceItemRow
                                        rowIndex={vi.index}
                                        id={item.id}
                                        name={item.name}
                                        measurement={item.measurement}
                                        quantity={quantities[item.id] ?? ''}
                                        pricePerUnit={pricesPerUnit[item.id] ?? ''}
                                        price={prices[item.id] ?? ''}
                                        onQuantityChange={onQuantityChange}
                                        onPricePerUnitChange={onPricePerUnitChange}
                                        onTotalPriceChange={onTotalPriceChange}
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
