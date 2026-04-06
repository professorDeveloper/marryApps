import type { AvailableIngredientRowProps } from '../types';

import { memo, useCallback } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Box, Typography, IconButton } from '@mui/material';

function areEqual(prev: AvailableIngredientRowProps, next: AvailableIngredientRowProps) {
    return (
        prev.ingredient === next.ingredient &&
        prev.onQuickAdd === next.onQuickAdd &&
        prev.quickAddTitle === next.quickAddTitle
    );
}

export const AvailableIngredientRow = memo(function AvailableIngredientRow({
    ingredient,
    onQuickAdd,
    quickAddTitle,
}: AvailableIngredientRowProps) {
    const { id, name, measurement } = ingredient;

    const handleQuick = useCallback(() => onQuickAdd?.(id), [onQuickAdd, id]);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
                contentVisibility: 'auto',
            }}
        >
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap>
                    {name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {measurement}
                </Typography>
            </Box>
            {onQuickAdd ? (
                <IconButton size="small" onClick={handleQuick} sx={{ ml: 1 }} title={quickAddTitle}>
                    <AddIcon fontSize="small" />
                </IconButton>
            ) : null}
        </Box>
    );
}, areEqual);
