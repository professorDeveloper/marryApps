import type { MealItemTypeFilter } from '../types';

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';

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
    const handleToggle = (
        _event: React.MouseEvent<HTMLElement>,
        next: string[],
    ) => {
        onChange({
            ingredient: next.includes('ingredient'),
            compound: next.includes('compound'),
        });
    };

    const selected = [];
    if (value.ingredient) selected.push('ingredient');
    if (value.compound) selected.push('compound');

    return (
        <ToggleButtonGroup
            value={selected}
            onChange={handleToggle}
            aria-label="type filter"
            sx={{
                minWidth: 260,
                width: '100%',
                bgcolor: 'transparent',
                border: 'none',
                '& .MuiToggleButton-root': {
                    border: '1px solid var(--color-border)',
                    borderRadius: 2,
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    bgcolor: 'var(--color-surface-0)',
                    padding: '4px 8px',
                    minHeight: 24,
                    textTransform: 'none',
                    '&.Mui-selected': {
                        bgcolor: 'var(--color-primary)',
                        color: 'var(--color-text-on-primary)',
                        borderColor: 'var(--color-primary)',
                        '&:hover': {
                            bgcolor: 'var(--color-primary-hover)',
                        },
                    },
                    '&:hover': {
                        bgcolor: 'var(--color-surface-1)',
                    },
                },
            }}
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
