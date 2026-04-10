import type { MealItemType } from '../types';

import React from 'react';

import { Chip } from '@mui/material';

interface TypeBadgeProps {
    type: MealItemType;
    ingredientLabel: string;
    compoundLabel: string;
}

const CHIP_SX = {
    fontSize: '0.65rem',
    height: 16,
    minWidth: 32,
    '& .MuiChip-label': { px: 0.5 },
} as const;

export const TypeBadge = React.memo(function TypeBadge({
    type,
    ingredientLabel,
    compoundLabel,
}: TypeBadgeProps) {
    return (
        <Chip
            size="small"
            label={type === 'ingredient' ? ingredientLabel : compoundLabel}
            color={type === 'ingredient' ? 'primary' : 'secondary'}
            variant="outlined"
            sx={CHIP_SX}
        />
    );
});
