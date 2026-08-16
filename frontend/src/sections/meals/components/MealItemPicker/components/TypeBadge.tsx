import type { MealItemType } from '../types';

import React from 'react';

import { Chip } from '@mui/material';

interface TypeBadgeProps {
    type: MealItemType;
    ingredientLabel: string;
    compoundLabel: string;
}

const getChipSx = (type: MealItemType) => ({
    fontSize: '0.75rem',
    height: 24,
    minWidth: 40,
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    borderRadius: 1.5,
    '& .MuiChip-label': { px: 1 },
    '&.MuiChip-filled': {
        // Ingredient - warm orange tint
        ...(type === 'ingredient' && {
            bgcolor: 'rgba(255, 77, 26, 0.15)',
            color: 'rgba(255, 77, 26, 0.9)',
        }),
        // Compound - cool blue tint
        ...(type === 'compound' && {
            bgcolor: 'rgba(46, 144, 250, 0.15)',
            color: 'rgba(46, 144, 250, 0.9)',
        }),
    },
} as const);

export const TypeBadge = React.memo(function TypeBadge({
    type,
    ingredientLabel,
    compoundLabel,
}: TypeBadgeProps) {
    return (
        <Chip
            size="small"
            label={type === 'ingredient' ? ingredientLabel : compoundLabel}
            variant="filled"
            sx={getChipSx(type)}
        />
    );
});
