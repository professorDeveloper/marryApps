import type { AddedItemsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
    Box,
    Paper,
    Button,
    TextField,
    Typography,
    InputAdornment,
} from '@mui/material';

import { TotalCard } from '../../TotalCard';
import { AddedItemRow } from './AddedItemRow';
import { ADDED_ROW_ESTIMATE_PX } from '../constants';

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
    const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const cycleSort = useCallback((key: string) => {
        setSort((prev) => {
            if (!prev || prev.key !== key) return { key, dir: 'asc' };
            if (prev.dir === 'asc') return { key, dir: 'desc' };
            return null;
        });
    }, []);

    const sortedItems = useMemo(() => {
        if (!sort) return items;
        const factor = sort.dir === 'asc' ? 1 : -1;
        const arr = [...items];
        arr.sort((a, b) => {
            const va = (a as any)[sort.key];
            const vb = (b as any)[sort.key];
            const na = Number(va);
            const nb = Number(vb);
            const bothNumeric = !Number.isNaN(na) && !Number.isNaN(nb) && va !== '' && vb !== '';
            if (bothNumeric) return factor * (na - nb);
            return (
                factor *
                String(va ?? '').localeCompare(String(vb ?? ''), undefined, {
                    sensitivity: 'base',
                    numeric: true,
                })
            );
        });
        return arr;
    }, [items, sort]);

    const filteredRef = useRef(items);
    useEffect(() => {
        filteredRef.current = sortedItems;
    }, [sortedItems]);

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

    const removeTitle = t('warehouse.invoiceDetails.removeLine');

    const rowCount = sortedItems.length;

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

    return (
        <Paper sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: tableHeight,
            bgcolor: 'var(--surface)',
            gap: 1
        }}>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1,
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
                    bgcolor: 'var(--surface)',
                }}
            >
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    #
                </Typography>
                <Box
                    onClick={() => cycleSort('name')}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { opacity: 0.7 },
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {t('warehouse.invoiceDetails.product')}
                    </Typography>
                    {(!sort || sort.key !== 'name') ? (
                        <SwapVertIcon sx={{ fontSize: 12, opacity: 0.4 }} />
                    ) : sort.dir === 'asc' ? (
                        <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                    ) : (
                        <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                    )}
                </Box>
                {headerLabels.map((col) => (
                    <Box
                        key={col.key}
                        onClick={() => cycleSort(col.key)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            justifyContent:
                                (col.align ?? 'right') === 'right'
                                    ? 'flex-end'
                                    : (col.align ?? 'right') === 'center'
                                        ? 'center'
                                        : 'flex-start',
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': { opacity: 0.7 },
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, textAlign: col.align ?? 'right' }}
                        >
                            {col.header}
                        </Typography>
                        {(!sort || sort.key !== col.key) ? (
                            <SwapVertIcon sx={{ fontSize: 12, opacity: 0.4 }} />
                        ) : sort.dir === 'asc' ? (
                            <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                        ) : (
                            <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                        )}
                    </Box>
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
                    mb: 2,
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
                            const item = sortedItems[vi.index];
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
                        py: 0,
                        bgcolor: 'transparent',
                    }}
                >
                    {summaryEntries?.map((entry, index) => {
                        const colors = [
                            'rgba(76, 175, 80, 0.9)',
                            'rgba(244, 67, 54, 0.9)',
                            'rgba(183, 28, 28, 0.9)',
                        ];
                        return (
                            <TotalCard
                                key={entry.label}
                                totalLabel={entry.label}
                                totalValue={String(entry.value)}
                                color={colors[index] ?? 'rgba(46, 144, 250, 0.9)'}
                            />
                        );
                    })}
                    {totalLabel && totalValue && (
                        <TotalCard
                            totalLabel={totalLabel}
                            totalValue={String(totalValue)}
                            color="rgba(46, 144, 250, 0.9)"
                        />
                    )}
                </Box>
            )}
        </Paper>
    );
});
