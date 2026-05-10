import type { MealItem } from '../types';

import React from 'react';

import { Chip, Checkbox, Typography } from '@mui/material';

import { compositeKey } from '../types';

interface AvailableRowProps {
    item: MealItem;
    isSelected: boolean;
    onSelect: (key: string, checked: boolean) => void;
    onAdd: (item: MealItem) => void;
    ingredientLabel: string;
    compoundLabel: string;
}

const CB_CELL_STYLE: React.CSSProperties = { display: 'flex', justifyContent: 'center' };
const CONTENT_CELL_STYLE: React.CSSProperties = { minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 };
const TEXT_COL_STYLE: React.CSSProperties = {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4,
    flexDirection: 'column',
};
const NAME_STYLE: React.CSSProperties = { lineHeight: 1.2 };
const MEAS_STYLE: React.CSSProperties = { lineHeight: 1 };
const getChipSx = (type: 'ingredient' | 'compound') => ({
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

export const AvailableRow = React.memo(function AvailableRow({
    item,
    isSelected,
    onSelect,
    onAdd,
    ingredientLabel,
    compoundLabel,
}: AvailableRowProps) {
    const key = compositeKey(item.type, item.id);

    const handleClick = React.useCallback(() => onAdd(item), [onAdd, item]);
    const handleCheckboxChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            onSelect(key, e.target.checked);
        },
        [onSelect, key]
    );
    const stopClick = React.useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

    return (
        <div onClick={handleClick} className="meal-picker-available-row">
            <div style={CB_CELL_STYLE}>
                <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    onClick={stopClick}
                    inputProps={{ 'aria-label': 'select available row' }}
                />
            </div>
            <div style={CONTENT_CELL_STYLE}>
                <div style={TEXT_COL_STYLE}>
                    <Typography variant="body2" noWrap style={NAME_STYLE} fontFamily='"Inter", sans-serif'>
                        {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap style={MEAS_STYLE} fontFamily='"Inter", sans-serif'>
                        {item.measurement || '—'}
                    </Typography>
                </div>
                <Chip
                    size="small"
                    label={item.type === 'ingredient' ? ingredientLabel : compoundLabel}
                    variant="filled"
                    sx={getChipSx(item.type)}
                />
            </div>
        </div>
    );
});
