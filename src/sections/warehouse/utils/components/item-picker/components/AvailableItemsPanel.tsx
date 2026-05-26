import type { AvailableItemsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';

import Add from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Box,
    Paper,
    Button,
    Tooltip,
    Checkbox,
    MenuItem,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import { AvailableItemRow } from './AvailableItemRow';
import { LIST_MAX_HEIGHT, AVAILABLE_ROW_ESTIMATE_PX } from '../constants';

export const AvailableItemsPanel = React.memo<AvailableItemsPanelProps>(({
    items,
    loading = false,
    excludedIdSet,
    onMoveRight,
    onAddNewItem,
    metaFieldsOpen,
    tableHeight,
    filters,
    warehouseOptions,
    groupOptions,
    selectedWarehouseId,
    onWarehouseChange,
    selectedGroupId,
    onGroupChange,
    warehouseAllowedIdSet,
    warehouseFilterLoading,
}) => {
    const renderStartedAtRef = useRef<number>(performance.now());
    renderStartedAtRef.current = performance.now();
    const { t } = useTranslation('menu');
    const commitSeqRef = useRef(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('asc');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedCountRef = useRef(0);
    const filteredCountRef = useRef(0);

    const filtered = useMemo(
        () => {
            const query = searchTerm.trim().toLowerCase();
            const next = items.filter((item) => {
                if (excludedIdSet.has(item.id)) return false;
                if (warehouseAllowedIdSet && !warehouseAllowedIdSet.has(item.id)) return false;
                if (!query) return true;
                return item.name.toLowerCase().includes(query);
            });
            if (!sortDir) return next;
            const factor = sortDir === 'asc' ? 1 : -1;
            return next.sort(
                (a, b) =>
                    factor *
                    a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
            );
        },
        [items, excludedIdSet, searchTerm, warehouseAllowedIdSet, sortDir]
    );

    const cycleSort = useCallback(() => {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
    }, []);

    useEffect(() => {
        filteredCountRef.current = filtered.length;
    }, [filtered.length]);

    useEffect(() => {
        selectedCountRef.current = selectedItems.size;
    }, [selectedItems.size]);

    useEffect(() => {
        if (!searchTerm) return;
        setSelectedItems((prev) => (prev.size === 0 ? prev : new Set()));
    }, [searchTerm, items.length, excludedIdSet.size]);

    useEffect(() => {
        setSelectedItems((prev) => {
            if (prev.size === 0) return prev;
            let changed = false;
            const next = new Set<string>();
            prev.forEach((id) => {
                if (!excludedIdSet.has(id)) {
                    next.add(id);
                } else {
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [excludedIdSet]);

    const handleRowActivate = useCallback(
        (itemId: string) => {
            onMoveRight([itemId]);
        },
        [onMoveRight]
    );

    const handleToggleSelect = useCallback((itemId: string) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (filtered.length != selectedItems.size) {
            setSelectedItems(new Set(filtered.map(item => item.id)));
        }
        else {
            setSelectedItems(new Set());
        }
    }, [filtered, selectedItems]);

    const handleDeselectAll = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => AVAILABLE_ROW_ESTIMATE_PX,
        // Fixed estimate — do not attach measureElement (avoids sync layout thrash).
        overscan: 8,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const isAllSelected = filtered.length > 0 && filtered.length === selectedItems.size;

    useLayoutEffect(() => {
        const seq = ++commitSeqRef.current;
    });

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
            // maxHeight: calculatedMaxHeight,
            height: typeof tableHeight === 'number' ? tableHeight + 42 : 'auto',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'var(--surface)',
            position: 'relative',
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.availableIngredients')}
                </Typography>
                {onAddNewItem && (
                    <Tooltip title={t('ingredients.add')}>
                        <IconButton
                            size="small"
                            onClick={onAddNewItem}
                            disabled={loading}
                            color='primary'
                        >
                            <Add />
                        </IconButton>
                    </Tooltip>
                )}

            </Box>

            {(filters?.warehouse?.enabled || filters?.group?.enabled) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    {filters?.warehouse?.enabled && (
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label={t('warehouse.invoiceDetails.filterWarehouse')}
                            value={selectedWarehouseId ?? ''}
                            onChange={(e) => onWarehouseChange?.(e.target.value)}
                            InputProps={
                                warehouseFilterLoading
                                    ? {
                                        endAdornment: (
                                            <InputAdornment position="end" sx={{ mr: 2 }}>
                                                <CircularProgress size={14} />
                                            </InputAdornment>
                                        ),
                                    }
                                    : undefined
                            }
                            sx={{ flex: 1 }}
                        >
                            <MenuItem value="">
                                <em>{t('warehouse.invoiceDetails.filterAll')}</em>
                            </MenuItem>
                            {(warehouseOptions ?? []).map((opt) => (
                                <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                            ))}
                        </TextField>
                    )}
                    {filters?.group?.enabled && (
                        <TextField
                            select
                            size="small"
                            fullWidth
                            label={t('warehouse.invoiceDetails.filterGroup')}
                            value={selectedGroupId ?? ''}
                            onChange={(e) => onGroupChange?.(e.target.value)}
                            sx={{ flex: 1 }}
                        >
                            <MenuItem value="">
                                <em>{t('warehouse.invoiceDetails.filterAll')}</em>
                            </MenuItem>
                            {(groupOptions ?? []).map((opt) => (
                                <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                            ))}
                        </TextField>
                    )}
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                <Tooltip title={isAllSelected ? t('warehouse.invoiceDetails.deselectAll') : t('warehouse.invoiceDetails.selectAll')}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                            size='medium'
                            onChange={isAllSelected ? handleDeselectAll : handleSelectAll}
                            disabled={loading || filtered.length === 0}
                            indeterminate={selectedItems.size > 0 && selectedItems.size < filtered.length}
                            checked={isAllSelected}
                        />
                    </Box>
                </Tooltip>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                        border: '1px solid',
                        borderColor: 'var(--border)',
                        borderRadius: 1,
                        px: 1,
                        '&:focus-within': {
                            borderColor: 'var(--accent)',
                            outline: 'none',
                        },
                    }}
                >
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            border: 'none',
                            outline: 'none',
                            flex: 1,
                            fontSize: '0.875rem',
                            padding: '8px 0',
                            fontFamily: 'inherit',
                            backgroundColor: 'transparent',
                        }}
                    />
                    <SearchIcon sx={{ fontSize: 20, color: 'action.active' }} />
                </Box>

                <Tooltip
                    title={
                        sortDir === 'asc'
                            ? t('warehouse.invoiceDetails.sortAsc') ?? 'A → Z'
                            : sortDir === 'desc'
                                ? t('warehouse.invoiceDetails.sortDesc') ?? 'Z → A'
                                : t('warehouse.invoiceDetails.sortNone') ?? 'Unsorted'
                    }
                >
                    <IconButton size="small" onClick={cycleSort}>
                        {sortDir === 'asc' ? (
                            <ArrowUpwardIcon fontSize="small" />
                        ) : sortDir === 'desc' ? (
                            <ArrowDownwardIcon fontSize="small" />
                        ) : (
                            <SortByAlphaIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>

            </Box>

            <Box
                ref={scrollRef}
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    minHeight: 0,
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={26} />
                    </Box>
                ) : filtered.length > 0 ? (
                    <div
                        style={{
                            height: rowVirtualizer.getTotalSize(),
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualRows.map((vi) => {
                            const item = filtered[vi.index];
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
                                    <AvailableItemRow
                                        item={item}
                                        isSelected={selectedItems.has(item.id)}
                                        onToggleSelect={handleToggleSelect}
                                        onRowActivate={handleRowActivate}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t('noData')}
                    </Typography>
                )}
            </Box>

            {selectedItems.size > 0 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        zIndex: 1,
                    }}
                >
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            if (selectedItems.size > 0) {
                                onMoveRight(Array.from(selectedItems));
                                setSelectedItems(new Set());
                            }
                        }} sx={{
                            boxShadow: 2,
                        }}
                    >
                        {t('mealsProducts.addSelected')} ({selectedItems.size})
                    </Button>
                </Box>
            )}
        </Paper>
    );
});
