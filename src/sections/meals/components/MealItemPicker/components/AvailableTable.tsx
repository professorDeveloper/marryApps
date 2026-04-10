import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TypeFilterToggle } from './TypeFilterToggle';
import { AvailableRow } from './AvailableRow';
import { compositeKey } from '../types';
import type { MealItem, MealItemTypeFilter } from '../types';

const AVAILABLE_ROW_ESTIMATE_PX = 52;

interface AvailableTableProps {
    rows: MealItem[];
    loading: boolean;
    filter: MealItemTypeFilter;
    onFilterChange: (next: MealItemTypeFilter) => void;
    search: string;
    onSearchChange: (value: string) => void;
    selectedKeys: Set<string>;
    onSelectChange: (key: string, checked: boolean) => void;
    onSelectAll: () => void;
    onAddItem: (item: MealItem) => void;
    onAddSelected: () => void;
    allChecked: boolean;
    indeterminate: boolean;
    ingredientLabel: string;
    compoundLabel: string;
}

export const AvailableTable = React.memo(function AvailableTable({
    rows,
    loading,
    filter,
    onFilterChange,
    search,
    onSearchChange,
    selectedKeys,
    onSelectChange,
    onSelectAll,
    onAddItem,
    onAddSelected,
    allChecked,
    indeterminate,
    ingredientLabel,
    compoundLabel,
}: AvailableTableProps) {
    const { t } = useTranslation('menu');
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => AVAILABLE_ROW_ESTIMATE_PX,
        overscan: 10,
    });

    return (
        <Paper variant="outlined" sx={{ p: 2, position: 'relative', display: 'flex', flexDirection: 'column', height: 740 }}>
            <Stack
                direction={{ xs: 'column' }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch' }}
                sx={{ mb: 2, flexShrink: 0 }}
            >
                <Typography variant="h6">
                    {t('mealsProducts.availableItems', 'Available Items')}
                </Typography>
                {/* <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end"> */}
                <TypeFilterToggle
                    value={filter}
                    onChange={onFilterChange}
                    ingredientLabel={ingredientLabel}
                    compoundLabel={compoundLabel}
                />

                {/* </Stack> */}
            </Stack>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexShrink: 0 }}>
                <Checkbox
                    size="small"
                    checked={allChecked}
                    indeterminate={indeterminate}
                    onChange={onSelectAll}
                    slotProps={{ input: { 'aria-label': 'select all available' } }}
                />
                <TextField
                    size="small"
                    fullWidth
                    placeholder={t('search', 'Search')}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            {/* Virtualized list */}
            <Box
                ref={scrollRef}
                sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : rows.length === 0 ? (
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
                            const item = rows[vi.index];
                            const key = compositeKey(item.type, item.id);
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
                                    <AvailableRow
                                        item={item}
                                        isSelected={selectedKeys.has(key)}
                                        onSelect={onSelectChange}
                                        onAdd={onAddItem}
                                        ingredientLabel={ingredientLabel}
                                        compoundLabel={compoundLabel}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
            {selectedKeys.size > 0 && (
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
                        onClick={onAddSelected}
                        sx={{
                            boxShadow: 2,
                        }}
                    >
                        {t('mealsProducts.addSelected', 'Add Selected')} ({selectedKeys.size})
                    </Button>
                </Box>
            )}
        </Paper>
    );
});
