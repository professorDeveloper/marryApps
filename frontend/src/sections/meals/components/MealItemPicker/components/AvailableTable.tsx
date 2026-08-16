import type { MealItem, MealItemTypeFilter } from '../types';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';

import Add from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Paper,
    Stack,
    Button,
    Tooltip,
    Checkbox,
    TextField,
    IconButton,
    Typography,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import { compositeKey } from '../types';
import { AvailableRow } from './AvailableRow';
import { TypeFilterToggle } from './TypeFilterToggle';

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
    onAddNewItem?: () => void;
    allChecked: boolean;
    indeterminate: boolean;
    ingredientLabel: string;
    compoundLabel: string;
    tableHeight?: string | number;
    metaFieldsOpen?: boolean;
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
    onAddNewItem,
    allChecked,
    indeterminate,
    ingredientLabel,
    compoundLabel,
    tableHeight,
    metaFieldsOpen,
}: AvailableTableProps) {
    const renderStartedAtRef = React.useRef<number>(performance.now());
    renderStartedAtRef.current = performance.now();
    const { t } = useTranslation('menu');
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const [isSearchFocused, setIsSearchFocused] = React.useState(false);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => AVAILABLE_ROW_ESTIMATE_PX,
        overscan: 6,
    });

    // Keep the keyboard highlight within bounds whenever the visible rows change.
    React.useEffect(() => {
        setHighlightedIndex((prev) => {
            if (rows.length === 0) return -1;
            if (prev < 0) return 0;
            return Math.min(prev, rows.length - 1);
        });
    }, [rows]);

    // Keep the keyboard-highlighted row scrolled into view.
    React.useEffect(() => {
        if (highlightedIndex >= 0) {
            virtualizer.scrollToIndex(highlightedIndex, { align: 'auto' });
        }
    }, [highlightedIndex, virtualizer]);

    const handleRowActivate = React.useCallback(
        (item: MealItem) => {
            onAddItem(item);
            onSearchChange('');
            setHighlightedIndex(0);
        },
        [onAddItem, onSearchChange]
    );

    const handleSearchKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (rows.length === 0) return;
                setHighlightedIndex((prev) => Math.min(prev < 0 ? 0 : prev + 1, rows.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (rows.length === 0) return;
                setHighlightedIndex((prev) => Math.max((prev < 0 ? 0 : prev) - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = rows[highlightedIndex];
                if (item) handleRowActivate(item);
            }
        },
        [rows, highlightedIndex, handleRowActivate]
    );

    const calculatedHeight = metaFieldsOpen !== undefined 
        ? (metaFieldsOpen ? 'calc(100vh - 320px)' : 'calc(100vh - 200px)')
        : tableHeight;

    React.useLayoutEffect(() => {
        const durationMs = performance.now() - renderStartedAtRef.current;
        if (durationMs < 80) return;
    });

    return (
        <Paper 
        variant="outlined"
        elevation={2}
        sx={{ p: 2, 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column',
         height: calculatedHeight, 
         borderColor: 'var(--color-border)', 
         bgcolor: 'var(--color-surface-1)', 
         fontFamily: '"Inter", sans-serif',
         boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
         }}>
            <Stack
                direction={{ xs: 'column' }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch' }}
                sx={{ mb: 2, flexShrink: 1 }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif' }}>
                        {t('mealsProducts.availableItems', 'Available Items')}
                    </Typography>
                    {onAddNewItem && (
                        <Tooltip title={t('ingredients.add')}>
                            <IconButton
                                size="small"
                                onClick={onAddNewItem}
                                disabled={loading}
                                color="primary"
                            >
                                <Add />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
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
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'var(--color-surface-1)',
                        },
                    }}
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
                sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', WebkitOverflowScrolling: 'touch' }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : rows.length === 0 ? (
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
                            const item = rows[vi.index];
                            const key = compositeKey(item.type, item.id);
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
                                    <AvailableRow
                                        item={item}
                                        isSelected={selectedKeys.has(key)}
                                        isHighlighted={isSearchFocused && vi.index === highlightedIndex}
                                        onSelect={onSelectChange}
                                        onAdd={handleRowActivate}
                                        ingredientLabel={ingredientLabel}
                                        compoundLabel={compoundLabel}
                                    />
                                </div>
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
