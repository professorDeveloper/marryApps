import type { MealItemType, MealItemTypeFilter } from '../types';

import React from 'react';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';

interface TypeFilterToggleProps {
    value: MealItemTypeFilter;
    onChange: (next: MealItemTypeFilter) => void;
    ingredientLabel: string;
    compoundLabel: string;
}

export const TypeFilterToggle = React.memo(function TypeFilterToggle({
    value,
    onChange,
    ingredientLabel,
    compoundLabel,
}: TypeFilterToggleProps) {
    const selected: MealItemType[] = [];
    if (value.ingredient) selected.push('ingredient');
    if (value.compound) selected.push('compound');

    return (
        <ToggleButtonGroup
            size="small"
            value={selected}
            onChange={(_, next: MealItemType[]) => {
                // Ensure at least one filter is always selected
                if (next.length === 0) return;
                onChange({
                    ingredient: next.includes('ingredient'),
                    compound: next.includes('compound'),
                });
            }}
            aria-label="type filter"
            sx={{minWidth:300}}
        >
            <ToggleButton value="ingredient" sx={{ width: '50%' }}>
                {ingredientLabel}
            </ToggleButton>
            <ToggleButton value="compound" sx={{ width: '50%' }}>
                {compoundLabel}
            </ToggleButton>
        </ToggleButtonGroup>
    );
});
