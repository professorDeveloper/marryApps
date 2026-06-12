import type { MealItemTypeFilter } from '../types';

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
                border: '1px solid var(--border)',
                borderRadius: 2,
                p: 0.5,
                '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 1.5,
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    padding: '6px 12px',
                    minHeight: 28,
                    textTransform: 'none',
                    transition: 'all 0.2s ease-in-out',
                    // Ingredient button - very light orange tint
                    '&[value="ingredient"]': {
                        bgcolor: 'var(--accent-soft)',
                        color: 'rgba(255, 77, 26, 0.7)',
                        '&:hover:not(.Mui-selected)': {
                            bgcolor: 'var(--accent-soft)',
                            transform: 'translateY(-1px)',
                        },
                    },
                    // Compound button - very light blue tint  
                    '&[value="compound"]': {
                        bgcolor: 'rgba(46, 144, 250, 0.08)',
                        color: 'rgba(46, 144, 250, 0.7)',
                        '&:hover:not(.Mui-selected)': {
                            bgcolor: 'rgba(46, 144, 250, 0.12)',
                            transform: 'translateY(-1px)',
                        },
                    },
                    '&.Mui-selected': {
                        // Ingredient selected - strong orange
                        '&[aria-pressed="true"][value="ingredient"]': {
                            bgcolor: 'var(--accent-soft)',
                            color: 'var(--accent-fg)',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: 'var(--accent-soft)',
                                transform: 'translateY(-1px)',
                                boxShadow: 'none',
                            },
                        },
                        // Compound selected - strong blue
                        '&[aria-pressed="true"][value="compound"]': {
                            bgcolor: 'rgba(46, 144, 250, 0.4)',
                            color: 'var(--accent-fg)',
                            boxShadow: '0 2px 8px rgba(46, 144, 250, 0.4)',
                            '&:hover': {
                                bgcolor: 'rgba(46, 144, 250, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(46, 144, 250, 0.5)',
                            },
                        },
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
