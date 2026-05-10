import type { AddedItemsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import {
    Box,
    Paper,
    Button,
    TextField,
    Typography,
    InputAdornment,
    Divider,
} from '@mui/material';

import { AddedItemRow } from './AddedItemRow';
import { LIST_MAX_HEIGHT, ADDED_ROW_ESTIMATE_PX, ADDED_LIST_MAX_HEIGHT } from '../constants';

export const AddedItemsPanel = React.memo<AddedItemsPanelProps>(({
    items,
    columns,
    onValueChange,
    onRemoveRow,
    onRemoveMany,
    searchTerm = '',
    onSearchChange,
    gridTemplate,
    itemCount,
    onNavigateFocus,
    summaryEntries,
    totalLabel,
    totalValue,
    metaFieldsOpen,
    tableHeight,
}) => {
    const renderStartedAtRef = useRef<number>(performance.now());
    renderStartedAtRef.current = performance.now();
    const { t } = useTranslation('menu');
    const commitSeqRef = useRef(0);

    const [batchRemoveArmed, setBatchRemoveArmed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredRef = useRef(items);
    useEffect(() => {
        filteredRef.current = items;
    }, [items]);

    useEffect(() => {
        setBatchRemoveArmed(false);
    }, [searchTerm, items.length]);

    const handleToggleBatchArm = useCallback(() => {
        setBatchRemoveArmed((v) => !v);
    }, []);

    const handleRemoveBatch = useCallback(() => {
        if (!batchRemoveArmed) return;
        const list = filteredRef.current;
        if (list.length === 0) return;
        onRemoveMany(list.map((item) => item.id));
        setBatchRemoveArmed(false);
    }, [onRemoveMany, batchRemoveArmed]);

    const removeTitle = t('warehouse.invoiceDetails.removeLine', 'Remove line');

    const rowCount = items.length;

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ADDED_ROW_ESTIMATE_PX,
        overscan: 8,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();

    useLayoutEffect(() => {
        const seq = ++commitSeqRef.current;
    });

    const headerLabels = useMemo(
        () => columns.map((col) => ({ key: col.key, header: col.header, align: col.align })),
        [columns]
    );

        // Calculate maxHeight based on tableHeight and metaFieldsOpen
        const calculatedMaxHeight = useMemo(() => {
            if (tableHeight) {
                // If tableHeight is provided, use it as base and adjust with metaFieldsOpen
                const baseHeight = typeof tableHeight === 'number' ? `${tableHeight}px` : tableHeight;
                if (metaFieldsOpen) {
                    return `calc(${baseHeight} - 200px)`;
                }
                return baseHeight;
            }
            // Fall back to current behavior if tableHeight not provided
            return metaFieldsOpen ? 'calc(100vh - 320px)' : LIST_MAX_HEIGHT;
        }, [tableHeight, metaFieldsOpen]);
    
    return (
            <Paper sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: calculatedMaxHeight,
                bgcolor: 'var(--color-surface-1)',


            }}>
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
                        {t('warehouse.invoiceDetails.selectedItems')}
                        {itemCount != null && (
                            <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                            >
                                {itemCount} {t('warehouse.invoiceDetails.products')}
                            </Typography>
                        )}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Button
                            size="small"
                            variant={batchRemoveArmed ? 'contained' : 'text'}
                            color={batchRemoveArmed ? 'error' : 'inherit'}
                            onClick={handleToggleBatchArm}
                            disabled={items.length === 0}
                        >
                            {batchRemoveArmed
                                ? t('warehouse.invoiceDetails.deselectAll')
                                : t('warehouse.invoiceDetails.selectAll')}
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteSweepIcon />}
                            onClick={handleRemoveBatch}
                            disabled={!batchRemoveArmed || items.length === 0}
                        >
                            {t('warehouse.invoiceDetails.removeBatch')}
                        </Button>
                    </Box>
                </Box>

                {onSearchChange && (
                    <TextField
                        size="small"
                        placeholder={t('search')}
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 1 }}
                    />
                )}

                {/* Column headers */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: gridTemplate,
                        columnGap: 1,
                        alignItems: 'center',
                        px: 1,
                        py: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'var(--color-surface-1)',
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                        #
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {t('warehouse.invoiceDetails.product')}
                    </Typography>
                    {headerLabels.map((col) => (
                        <Typography
                            key={col.key}
                            variant="caption"
                            sx={{ fontWeight: 700, textAlign: col.align ?? 'right' }}
                        >
                            {col.header}
                        </Typography>
                    ))}
                    <Box />
                </Box>

                {/* Virtualized rows */}
                <Box
                    ref={scrollRef}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        position: 'relative',
                        minHeight: 0,
                    }}
                >
                    {rowCount === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                            <Typography variant="body2">
                                {t('warehouse.invoiceDetails.noItemsAdded')}
                            </Typography>
                        </Box>
                    ) : (
                        <div
                            style={{
                                height: rowVirtualizer.getTotalSize(),
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualRows.map((vi) => {
                                const item = items[vi.index];
                                return (
                                    <div
                                        key={item.id}
                                        data-index={vi.index}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${vi.start}px)`,
                                        }}
                                    >
                                        <AddedItemRow
                                            rowIndex={vi.index}
                                            totalRows={items.length}
                                            item={item}
                                            columns={columns}
                                            onValueChange={onValueChange}
                                            onRemove={onRemoveRow}
                                            removeTitle={removeTitle}
                                            gridTemplate={gridTemplate}
                                            onNavigateFocus={onNavigateFocus}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Box>

                {/* Total Section */}
                {((summaryEntries && summaryEntries.length > 0) || (totalLabel && totalValue)) && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            px: 2,
                            py: 1,
                            bgcolor: 'background.paper',
                            borderTop: 2,
                            borderColor: 'primary.main',
                        }}
                    >
                        <Box sx={{ 
                            bgcolor: 'rgba(46, 144, 250, 0.15)',
                            p: 1, 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flex: 1,
                            minWidth: 'fit-content'
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(46, 144, 250, 0.9)' }}>
                                {summaryEntries?.[0]?.label || 'Products'}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgba(46, 144, 250, 0.9)' }}>
                                {summaryEntries?.[0]?.value || '0'}
                            </Typography>
                        </Box>
                        <Box sx={{ 
                            bgcolor: 'rgba(33, 150, 243, 0.15)',
                            p: 1, 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flex: 1,
                            minWidth: 'fit-content'
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(33, 150, 243, 0.9)' }}>
                                {summaryEntries?.[1]?.label || 'Total Qty'}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgba(33, 150, 243, 0.9)' }}>
                                {summaryEntries?.[1]?.value || '0'}
                            </Typography>
                        </Box>
                        <Box sx={{ 
                            bgcolor: 'rgba(76, 175, 80, 0.15)',
                            p: 1.5, 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            border: 1,
                            borderColor: 'rgba(76, 175, 80, 0.3)',
                            flex: 1,
                            minWidth: 'fit-content'
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(76, 175, 80, 0.9)' }}>
                                {totalLabel || 'Total Amount'}:
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'rgba(76, 175, 80, 0.9)' }}>
                                {totalValue}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>
    );
});
