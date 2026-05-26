import type { AvailableIngredientsPanelProps } from '../types';

import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Box,
    Paper,
    Button,
    TextField,
    Typography,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import { AvailableIngredientRow } from './AvailableIngredientRow';
import { LIST_MAX_HEIGHT, AVAILABLE_ROW_ESTIMATE_PX } from '../constants';

function isExcluded(id: string, excludedIdSet: Set<string> | undefined, excludedIds: string[] | undefined) {
    if (excludedIdSet) return excludedIdSet.has(id);
    return excludedIds?.includes(id) ?? false;
}

export const AvailableIngredientsPanel = React.memo<AvailableIngredientsPanelProps>(({
    ingredients,
    loading,
    excludedIds = [],
    excludedIdSet,
    onMoveRight,
    onAddNewIngredient,
    onQuickAdd,
}) => {
    const { t } = useTranslation('menu');

    const [searchTerm, setSearchTerm] = useState('');
    const [batchAddArmed, setBatchAddArmed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(
        () =>
            ingredients.filter(
                (ing) =>
                    !isExcluded(ing.id, excludedIdSet, excludedIds) &&
                    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [ingredients, excludedIdSet, excludedIds, searchTerm]
    );

    const filteredRef = useRef(filtered);
    useEffect(() => {
        filteredRef.current = filtered;
    }, [filtered]);

    useEffect(() => {
        setBatchAddArmed(false);
    }, [searchTerm, ingredients, excludedIdSet, excludedIds]);

    const handleToggleBatchArm = useCallback(() => {
        setBatchAddArmed((v) => !v);
    }, []);

    const handleAddBatch = useCallback(() => {
        if (!batchAddArmed) return;
        const list = filteredRef.current;
        if (list.length === 0) return;
        onMoveRight(list.map((ing) => ing.id));
        setBatchAddArmed(false);
    }, [onMoveRight, batchAddArmed]);

    const quickAddTitle = t('warehouse.invoiceDetails.quickAdd');

    const rowVirtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => AVAILABLE_ROW_ESTIMATE_PX,
        overscan: 12,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('warehouse.invoiceDetails.availableIngredients')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                        size="small"
                        variant={batchAddArmed ? 'contained' : 'text'}
                        onClick={handleToggleBatchArm}
                        disabled={loading || filtered.length === 0}
                    >
                        {batchAddArmed
                            ? t('warehouse.invoiceDetails.deselectAll')
                            : t('warehouse.invoiceDetails.selectAll')}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onAddNewIngredient}
                        disabled={loading}
                    >
                        {t('warehouse.add')}
                    </Button>
                </Box>
            </Box>

            <TextField
                size="small"
                placeholder={t('search')}
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 1.5 }}
            />

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
                            const ing = filtered[vi.index];
                            return (
                                <Box
                                    key={ing.id}
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
                                    <AvailableIngredientRow
                                        ingredient={ing}
                                        onQuickAdd={onQuickAdd}
                                        quickAddTitle={quickAddTitle}
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
                onClick={handleAddBatch}
                disabled={!batchAddArmed || loading || filtered.length === 0}
                sx={{ mt: 1.5 }}
            >
                {t('warehouse.invoiceDetails.addSelected')}
            </Button>
        </Paper>
    );
});
