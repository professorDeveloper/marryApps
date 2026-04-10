import React from 'react';
import { Box, Checkbox, Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TypeBadge } from './TypeBadge';
// import { fCurrency } from 'src/utils/format-number'; // Removed to show numbers without currency
import { compositeKey } from '../types';
import type { MealItemRow, MealItemType } from '../types';

interface AddedRowProps {
    row: MealItemRow;
    isSelected: boolean;
    onSelect: (key: string, checked: boolean) => void;
    onQtyChange: (type: MealItemType, id: string, value: string) => void;
    onRemove: (type: MealItemType, id: string) => void;
    pricePerUnit: number;
    ingredientLabel: string;
    compoundLabel: string;
}

const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '0.8125rem',
    border: '1px solid var(--palette-divider, rgba(145,158,171,0.32))',
    borderRadius: 8,
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
};
const INPUT_WITH_UNIT: React.CSSProperties = { ...INPUT_STYLE, paddingRight: 52 };
const INPUT_NO_UNIT: React.CSSProperties = { ...INPUT_STYLE, paddingRight: 8 };

const ROW_BASE_SX = {
    display: 'grid',
    gridTemplateColumns: '48px 1fr 170px 140px 160px 56px',
    alignItems: 'center',
    columnGap: 1,
    px: 1,
    py: 0.5,
    borderBottom: 1,
    borderColor: 'divider',
    boxSizing: 'border-box',
} as const;

const ROW_SELECTED_SX = {
    ...ROW_BASE_SX,
    bgcolor: 'action.selected',
    '&:hover': { bgcolor: 'action.selected' },
} as const;

const ROW_UNSELECTED_SX = {
    ...ROW_BASE_SX,
    bgcolor: 'background.paper',
    '&:hover': { bgcolor: 'action.hover' },
} as const;

const CELL_CENTER_SX = { display: 'flex', justifyContent: 'center' } as const;
const NAME_CELL_SX = { minWidth: 0 } as const;
const NAME_STACK_SX = { minWidth: 0 } as const;
const NAME_TEXT_SX = { minWidth: 0 } as const;
const RIGHT_SX = { textAlign: 'right' } as const;
const QTY_WRAPPER_STYLE: React.CSSProperties = { position: 'relative', width: 140 };
const UNIT_STYLE: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'gray',
    pointerEvents: 'none',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
};

export const AddedRow = React.memo(function AddedRow({
    row,
    isSelected,
    onSelect,
    onQtyChange,
    onRemove,
    pricePerUnit,
    ingredientLabel,
    compoundLabel,
}: AddedRowProps) {
    const totalPrice = pricePerUnit * (row.quantity ?? 0);
    const key = compositeKey(row.type, row.id);

    const handleSelect = React.useCallback(
        (_: unknown, checked: boolean) => onSelect(key, checked),
        [onSelect, key]
    );
    const handleQty = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onQtyChange(row.type, row.id, e.target.value),
        [onQtyChange, row.type, row.id]
    );
    const handleRemove = React.useCallback(
        () => onRemove(row.type, row.id),
        [onRemove, row.type, row.id]
    );

    return (
        <Box sx={isSelected ? ROW_SELECTED_SX : ROW_UNSELECTED_SX}>
            <Box sx={CELL_CENTER_SX}>
                <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={handleSelect}
                    inputProps={{ 'aria-label': 'select added row' }}
                />
            </Box>

            <Box sx={NAME_CELL_SX}>
                <Stack direction="row" spacing={1} alignItems="center" sx={NAME_STACK_SX}>
                    <Typography variant="body2" noWrap sx={NAME_TEXT_SX}>
                        {row.name}
                    </Typography>
                    <TypeBadge
                        type={row.type}
                        ingredientLabel={ingredientLabel}
                        compoundLabel={compoundLabel}
                    />
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {row.measurement || '—'}
                </Typography>
            </Box>

            <Box sx={CELL_CENTER_SX}>
                <div style={QTY_WRAPPER_STYLE}>
                    <input
                        type="number"
                        value={row.quantity ?? 0}
                        onChange={handleQty}
                        step="0.01"
                        min="0"
                        style={row.measurement ? INPUT_WITH_UNIT : INPUT_NO_UNIT}
                    />
                    {row.measurement ? <span style={UNIT_STYLE}>{row.measurement}</span> : null}
                </div>
            </Box>

            <Typography variant="body2" sx={RIGHT_SX}>
                {pricePerUnit.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={RIGHT_SX}>
                {totalPrice.toFixed(2)}
            </Typography>

            <Box sx={CELL_CENTER_SX}>
                <IconButton size="small" color="error" onClick={handleRemove} aria-label="remove">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );
});
