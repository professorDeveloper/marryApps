import type { MealItemRow, MealItemType, MealItemTypeFilter } from './types';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';

import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Paper,
    Stack,
    Button,
    Checkbox,
    TextField,
    Typography,
    InputAdornment,
} from '@mui/material';

import { compositeKey } from './types';
import { AddedRow } from './components/AddedRow';
import { TypeFilterToggle } from './components/TypeFilterToggle';

const LIST_HEIGHT_PX = 480;
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
    totalCost: number;
    ingredientLabel: string;
    compoundLabel: string;
    isEmpty: boolean;
    menuPrice?: string;
    showProfitMargin?: boolean;
    tableHeight?: string | number;
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
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
    onRemoveAll,
    allChecked,
    indeterminate,
    priceByKey,
    totalItemsCount,
    totalCost,
    ingredientLabel,
    compoundLabel,
    isEmpty,
    onNavigateFocus,
}: AddedTableProps) {
    const { t } = useTranslation('menu');
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ADDED_ROW_ESTIMATE_PX,
        overscan: 10,
    });

    return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
            >
                <Typography variant="h6">
                    {t('mealsProducts.addedItems', 'Added Items')}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                   {/* <Box sx={{minWidth=}}> */}
                    <TypeFilterToggle
                        value={filter}
                        onChange={onFilterChange}
                        ingredientLabel={ingredientLabel}
                        compoundLabel={compoundLabel}
                    />
                    {/* </Box> */}
                    <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={onRemoveSelected}
                        disabled={selectedKeys.size === 0}
                    >
                        {t('mealsProducts.removeSelected', 'Remove Selected')}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={onRemoveAll}
                        disabled={isEmpty}
                    >
                        {t('mealsProducts.removeAll', 'Remove All')}
                    </Button>
                </Stack>
            </Stack>

            <TextField
                size="small"
                fullWidth
                placeholder={t('search', 'Search')}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
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
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
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
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {t('mealsProducts.name', 'Name')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('calculation.quantity', 'Quantity')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right' }}>
                    {t('mealsProducts.pricePerUnit', 'Price/Unit')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'right' }}>
                    {t('mealsProducts.totalPrice', 'Total')}
                </Typography>
                <Box />
            </Box>

            {/* Virtualized list */}
            <Box
                ref={scrollRef}
                sx={{ height: LIST_HEIGHT_PX, overflow: 'auto', position: 'relative' }}
            >
                {rows.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                        <Typography variant="body2" color="text.secondary">
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
                                <Box
                                    key={key}
                                    data-index={vi.index}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${vi.start}px)`,
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
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Summary */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ mt: 2 }}
            >
                <Typography variant="body2" color="text.secondary">
                    {t('mealsProducts.summaryItems', 'Items')}: {totalItemsCount}
                </Typography>
                <Typography variant="subtitle2">
                    {t('mealsProducts.summaryTotalCost', 'Total cost')}: {totalCost}
                </Typography>
            </Stack>
        </Paper>
    );
});
