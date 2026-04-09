import React from 'react';
import { Box, Checkbox, Typography, Chip } from '@mui/material';
import { compositeKey } from '../types';
import type { MealItem } from '../types';

interface AvailableRowProps {
    item: MealItem;
    isSelected: boolean;
    onSelect: (key: string, checked: boolean) => void;
    onAdd: (item: MealItem) => void;
    ingredientLabel: string;
    compoundLabel: string;
}

const ROW_SX = {
    display: 'grid',
    gridTemplateColumns: '48px 1fr',
    alignItems: 'center',
    py: 0.75,
    m: 0,
    borderBottom: 1,
    borderColor: 'divider',
    cursor: 'pointer',
    '&:hover': { bgcolor: 'action.hover' },
    boxSizing: 'border-box',
} as const;

const CB_CELL_SX = { display: 'flex', justifyContent: 'center' } as const;
const CONTENT_CELL_SX = {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
} as const;
const TEXT_COL_SX = {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 0.5,
    flexDirection: 'column',
} as const;
const NAME_SX = { lineHeight: 1.2 } as const;
const MEAS_SX = { lineHeight: 1 } as const;
const CHIP_SX = {
    fontSize: '0.65rem',
    height: 16,
    minWidth: 32,
    '& .MuiChip-label': { px: 0.5 },
} as const;

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
        <Box onClick={handleClick} sx={ROW_SX}>
            <Box sx={CB_CELL_SX}>
                <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    onClick={stopClick}
                    inputProps={{ 'aria-label': 'select available row' }}
                />
            </Box>
            <Box sx={CONTENT_CELL_SX}>
                <Box sx={TEXT_COL_SX}>
                    <Typography variant="body2" noWrap sx={NAME_SX}>
                        {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={MEAS_SX}>
                        {item.measurement || '—'}
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={item.type === 'ingredient' ? ingredientLabel : compoundLabel}
                    color={item.type === 'ingredient' ? 'primary' : 'secondary'}
                    sx={CHIP_SX}
                />
            </Box>
        </Box>
    );
});
