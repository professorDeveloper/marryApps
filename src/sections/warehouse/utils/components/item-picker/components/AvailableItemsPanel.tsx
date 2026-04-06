import type { AvailableItemsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Add from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Box,
    Paper,
    Button,
    Tooltip,
    Checkbox,
    Typography,
    IconButton,
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
}) => {
    const { t } = useTranslation('menu');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(
        () =>
            items.filter(
                (item) =>
                    !excludedIdSet.has(item.id) &&
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [items, excludedIdSet, searchTerm]
    );

    useEffect(() => {
        setSelectedItems(new Set());
    }, [searchTerm, items, excludedIdSet]);

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
    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.availableIngredients', 'Available Items')}
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
                        borderColor: 'divider',
                        borderRadius: 1,
                        px: 1,
                        '&:focus-within': {
                            borderColor: 'primary.main',
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

            </Box>

            <Box
                ref={scrollRef}
                sx={{
                    maxHeight: LIST_MAX_HEIGHT,
                    overflow: 'auto',
                    position: 'relative',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={26} />
                    </Box>
                ) : filtered.length > 0 ? (
                    <Box
                        sx={{
                            height: rowVirtualizer.getTotalSize(),
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualRows.map((vi) => {
                            const item = filtered[vi.index];
                            return (
                                <Box
                                    key={item.id}
                                    data-index={vi.index}
                                    sx={{
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
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t('noData')}
                    </Typography>
                )}
            </Box>

            <Button
                fullWidth
                variant="contained"
                endIcon={<ChevronRightIcon />}
                onClick={() => {
                    if (selectedItems.size > 0) {
                        onMoveRight(Array.from(selectedItems));
                        setSelectedItems(new Set());
                    }
                }}
                disabled={loading || selectedItems.size === 0}
                sx={{ mt: 1.5 }}
            >
                {t('warehouse.invoiceDetails.addSelected')} ({selectedItems.size})
            </Button>
        </Paper>
    );
});
