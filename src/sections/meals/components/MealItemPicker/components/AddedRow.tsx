import type { MealItemRow, MealItemType } from '../types';

import React from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Stack, Checkbox, Typography, IconButton } from '@mui/material';

import { TypeBadge } from './TypeBadge';
// import { fCurrency } from 'src/utils/format-number'; // Removed to show numbers without currency
import { compositeKey } from '../types';

interface AddedRowProps {
    row: MealItemRow;
    isSelected: boolean;
    onSelect: (key: string, checked: boolean) => void;
    onQtyChange: (type: MealItemType, id: string, value: string) => void;
    onRemove: (type: MealItemType, id: string) => void;
    pricePerUnit: number;
    ingredientLabel: string;
    compoundLabel: string;
    rowIndex: number;
    totalRows: number;
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
}

const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '0.8125rem',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    outline: 'none',
    background: 'var(--color-surface-0)',
    color: 'inherit',
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
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
    borderColor: 'var(--color-border)',
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
} as const;

const ROW_SELECTED_SX = {
    ...ROW_BASE_SX,
    bgcolor: 'var(--color-primary-soft)',
    '&:hover': { bgcolor: 'var(--color-primary-ring)' },
} as const;

const ROW_UNSELECTED_SX = {
    ...ROW_BASE_SX,
    bgcolor: 'var(--color-surface-0)',
    '&:hover': { bgcolor: 'var(--color-primary-soft)' },
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
    color: 'var(--color-text)',
    opacity: 0.6,
    pointerEvents: 'none',
    fontSize: '0.75rem',
    fontFamily: '"Inter", sans-serif',
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
    rowIndex,
    totalRows,
    onNavigateFocus,
}: AddedRowProps) {
    const totalPrice = pricePerUnit * (row.quantity ?? 0);
    const key = compositeKey(row.type, row.id);

    const [isFocused, setIsFocused] = React.useState(false);
    const [localValue, setLocalValue] = React.useState<string>('');

    // Sync local value with prop value when not focused
    React.useEffect(() => {
        if (!isFocused) {
            setLocalValue(String(row.quantity ?? 0));
        }
    }, [row.quantity, isFocused]);

    // Format number with spaces for display
    const formatNumberWithSpaces = (num: number | string | undefined | null): string => {
        if (num === undefined || num === null || num === 0) return '';
        const stringValue = String(num);

        const numericValue = parseFloat(stringValue);
        if (isNaN(numericValue)) return stringValue;

        // Check if the value has decimal places
        const hasDecimals = numericValue % 1 !== 0;

        return new Intl.NumberFormat('en-US', {
            useGrouping: true,
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: hasDecimals ? 2 : 0,
        }).format(numericValue).replace(/,/g, ' ');
    };

    const displayValue = isFocused ? localValue : formatNumberWithSpaces(localValue);

    const handleSelect = React.useCallback(
        (_: unknown, checked: boolean) => onSelect(key, checked),
        [onSelect, key]
    );

    const handleQty = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;

            // Validate: only allow numbers and at most one dot
            const dotCount = (newValue.match(/\./g) || []).length;
            const hasInvalidChars = /[^0-9.]/.test(newValue);

            if (hasInvalidChars || dotCount > 1) {
                // Filter out invalid characters and extra dots
                const firstDotIndex = newValue.indexOf('.');
                let filtered = newValue.replace(/[^0-9.]/g, '');
                if (firstDotIndex !== -1) {
                    const parts = filtered.split('.');
                    filtered = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                }
                setLocalValue(filtered);
                onQtyChange(row.type, row.id, filtered);
            } else {
                setLocalValue(newValue);
                onQtyChange(row.type, row.id, newValue);
            }
        },
        [onQtyChange, row.type, row.id]
    );

    const handleRemove = React.useCallback(
        () => onRemove(row.type, row.id),
        [onRemove, row.type, row.id]
    );

    const handleFocus = React.useCallback(() => {
        setIsFocused(true);
        setLocalValue(String(row.quantity ?? 0));
    }, [row.quantity]);

    const handleBlur = React.useCallback(() => {
        setIsFocused(false);
    }, []);

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'ArrowDown' && onNavigateFocus) {
                e.preventDefault();
                if (rowIndex < totalRows - 1) {
                    onNavigateFocus('down', rowIndex, 'quantity');
                }
            } else if (e.key === 'ArrowUp' && onNavigateFocus) {
                e.preventDefault();
                if (rowIndex > 0) {
                    onNavigateFocus('up', rowIndex, 'quantity');
                }
            } else if (e.key === 'ArrowLeft' && onNavigateFocus) {
                const input = e.currentTarget;
                const cursorPosition = input.selectionStart;
                const valueLength = input.value.length;

                // Only switch columns if cursor is at the start of the value
                if (cursorPosition === 0) {
                    e.preventDefault();
                    onNavigateFocus('left', rowIndex, 'quantity');
                }
            } else if (e.key === 'ArrowRight' && onNavigateFocus) {
                const input = e.currentTarget;
                const cursorPosition = input.selectionStart;
                const valueLength = input.value.length;

                // Only switch columns if cursor is at the end of the value
                if (cursorPosition === valueLength) {
                    e.preventDefault();
                    onNavigateFocus('right', rowIndex, 'quantity');
                }
            }
        },
        [rowIndex, totalRows, onNavigateFocus]
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
                    <Typography variant="body2" noWrap sx={NAME_TEXT_SX} fontFamily='"Inter", sans-serif'>
                        {row.name}
                    </Typography>
                    <TypeBadge
                        type={row.type}
                        ingredientLabel={ingredientLabel}
                        compoundLabel={compoundLabel}
                    />
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: '"Inter", sans-serif' }}>
                    {row.measurement || '—'}
                </Typography>
            </Box>

            <Box sx={CELL_CENTER_SX}>
                <div style={QTY_WRAPPER_STYLE}>
                    <input
                        type="text"
                        value={displayValue}
                        onChange={handleQty}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        inputMode="decimal"
                        placeholder="0"
                        style={row.measurement ? INPUT_WITH_UNIT : INPUT_NO_UNIT}
                    />
                    {row.measurement ? <span style={UNIT_STYLE}>{row.measurement}</span> : null}
                </div>
            </Box>

            <Typography variant="body2" sx={{ ...RIGHT_SX, fontFamily: '"Inter", sans-serif' }}>
                {pricePerUnit.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ ...RIGHT_SX, fontFamily: '"Inter", sans-serif' }}>
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
