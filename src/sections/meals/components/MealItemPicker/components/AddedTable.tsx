import type { MealItemRow, MealItemType, MealItemTypeFilter } from '../types';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';

import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
    Box,
    Chip,
    Paper,
    Stack,
    Button,
    Checkbox,
    TextField,
    Typography,
    InputAdornment,
} from '@mui/material';

import { AddedRow } from './AddedRow';
import { compositeKey } from '../types';
import { TypeFilterToggle } from './TypeFilterToggle';

const ADDED_ROW_ESTIMATE_PX = 56;

interface AddedTableProps {
    rows: MealItemRow[];
    filter: MealItemTypeFilter;
    onFilterChange: (next: MealItemTypeFilter) => void;
    search: string;
    onSearchChange: (value: string) => void;
    selectedKeys: Set<string>;
    onSelectChange: (key: string, checked: boolean) => void;
    onSelectAll: () => void;
    onQtyChange: (type: MealItemType, id: string, value: string) => void;
    onRemoveItem: (type: MealItemType, id: string) => void;
    onRemoveSelected: () => void;
    onRemoveAll: () => void;
    allChecked: boolean;
    indeterminate: boolean;
    priceByKey: Map<string, number>;
    totalItemsCount: number;
    totalIngredientCount: number;
    totalCompoundCount: number;
    totalCost: number;
    ingredientLabel: string;
    compoundLabel: string;
    isEmpty: boolean;
    menuPrice?: string;
    showProfitMargin?: boolean;
    tableHeight?: string | number;
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
    metaFieldsOpen?: boolean;
}

export const AddedTable = React.memo(function AddedTable({
    rows,
    filter,
    onFilterChange,
    search,
    onSearchChange,
    selectedKeys,
    onSelectChange,
    onSelectAll,
    onQtyChange,
    onRemoveItem,
    onRemoveSelected,
    onRemoveAll: _onRemoveAll,
    allChecked,
    indeterminate,
    priceByKey,
    totalItemsCount,
    totalIngredientCount,
    totalCompoundCount,
    totalCost,
    ingredientLabel,
    compoundLabel,
    isEmpty: _isEmpty,
    menuPrice: _menuPrice,
    showProfitMargin: _showProfitMargin,
    tableHeight,
    onNavigateFocus,
}: AddedTableProps) {
    const renderStartedAtRef = React.useRef<number>(performance.now());
    renderStartedAtRef.current = performance.now();
    const { t } = useTranslation('menu');
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ADDED_ROW_ESTIMATE_PX,
        overscan: 6,
    });

    React.useLayoutEffect(() => {
        const durationMs = performance.now() - renderStartedAtRef.current;
        if (durationMs < 80) return;
    });

    return (
        <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', flexDirection: 'column', height: tableHeight, borderColor: 'var(--border)', bgcolor: 'var(--surface)', fontFamily: '"Inter", sans-serif' }}>
            <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexShrink: 0 }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif' }}>
                        {t('mealsProducts.addedItems')}
                    </Typography>
                    <Chip label={totalItemsCount} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TypeFilterToggle
                        value={filter}
                        onChange={onFilterChange}
                        ingredientLabel={ingredientLabel}
                        compoundLabel={compoundLabel}
                    />
                    <Button
                        variant="text"
                        color="inherit"
                        size="small"
                        onClick={onRemoveSelected}
                        disabled={selectedKeys.size === 0}
                        startIcon={<DeleteOutlineIcon fontSize="small" />}
                        sx={{ opacity: selectedKeys.size === 0 ? 0.4 : 1 }}
                    >
                        {t('remove')}
                    </Button>
                </Stack>
            </Stack>

            <TextField
                size="small"
                fullWidth
                placeholder={t('search')}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ mb: 2, flexShrink: 0 }}
                slotProps={{
                    input: {
                        sx: { bgcolor: 'var(--surface)' },
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {/* Header row */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 170px 140px 160px 56px',
                    alignItems: 'center',
                    columnGap: 1,
                    px: 1,
                    py: 1,
                    borderBottom: 1,
                    borderColor: 'var(--border)',
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                        size="small"
                        checked={allChecked}
                        indeterminate={indeterminate}
                        onChange={onSelectAll}
                        slotProps={{ input: { 'aria-label': 'select all added' } }}
                    />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>
                    {t('mealsProducts.name')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>
                    {t('calculation.quantity')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right', fontFamily: '"Inter", sans-serif' }}>
                    {t('mealsProducts.pricePerUnit')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right', fontFamily: '"Inter", sans-serif' }}>
                    {t('mealsProducts.totalPrice')}
                </Typography>
                <Box />
            </Box>

            {/* Virtualized list */}
            <Box
                ref={scrollRef}
                sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', WebkitOverflowScrolling: 'touch' }}
            >
                {rows.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
                            —
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            height: virtualizer.getTotalSize(),
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((vi) => {
                            const row = rows[vi.index];
                            const key = compositeKey(row.type, row.id);
                            return (
                                <div
                                    key={key}
                                    data-index={vi.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translate3d(0, ${vi.start}px, 0)`,
                                        willChange: 'transform',
                                        contain: 'layout paint style',
                                    }}
                                >
                                    <AddedRow
                                        row={row}
                                        isSelected={selectedKeys.has(key)}
                                        onSelect={onSelectChange}
                                        onQtyChange={onQtyChange}
                                        onRemove={onRemoveItem}
                                        pricePerUnit={priceByKey.get(key) ?? 0}
                                        ingredientLabel={ingredientLabel}
                                        compoundLabel={compoundLabel}
                                        rowIndex={vi.index}
                                        totalRows={rows.length}
                                        onNavigateFocus={onNavigateFocus}
                                    />
                                </div>
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Summary */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1, borderTop: 1, borderColor: 'var(--border)', flexShrink: 0 }}
            >
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif', letterSpacing: '0.04em' }}>
                    {t('mealsProducts.summaryItems').toUpperCase()} <b>{totalItemsCount}</b>
                    {' · '}
                    {t('mealsProducts.filterIngredients').toUpperCase()} <b>{totalIngredientCount}</b>
                    {' · '}
                    {t('mealsProducts.filterSemiFinished').toUpperCase()} <b>{totalCompoundCount}</b>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif', letterSpacing: '0.04em' }}>
                    {t('mealsProducts.totalCost').toUpperCase()}{' '}
                    <b style={{ fontSize: '1rem', color: 'inherit' }}>{totalCost.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                    {' sum'}
                </Typography>
            </Stack>
        </Paper>
    );
});
