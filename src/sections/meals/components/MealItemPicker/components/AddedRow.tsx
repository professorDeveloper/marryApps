import type { MealItemRow, MealItemType } from '../types';

import React from 'react';
import { useTranslation } from 'react-i18next';

import CloseIcon from '@mui/icons-material/Close';
import { Stack, Checkbox, Typography, IconButton } from '@mui/material';

import { TypeBadge } from './TypeBadge';
// import { fCurrency } from 'src/utils/format-number'; // Removed to show numbers without currency
import { compositeKey } from '../types';

const INT_FORMATTER = new Intl.NumberFormat('en-US', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});
const DEC2_FORMATTER = new Intl.NumberFormat('en-US', {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

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
    border: '1px solid var(--border)',
    borderRadius: 8,
    outline: 'none',
    background: 'var(--bg)',
    color: 'var(--text)',
    boxSizing: 'border-box',
    fontFamily: '"Inter", sans-serif',
    transition: 'border-color 0.15s, box-shadow 0.15s',
};
const INPUT_FOCUS_STYLE: React.CSSProperties = {
    borderColor: 'var(--border-strong)',
    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.18)',
};
const INPUT_WITH_UNIT: React.CSSProperties = { ...INPUT_STYLE, paddingRight: 52 };
const INPUT_NO_UNIT: React.CSSProperties = { ...INPUT_STYLE, paddingRight: 8 };
const INPUT_WITH_UNIT_FOCUS: React.CSSProperties = { ...INPUT_WITH_UNIT, ...INPUT_FOCUS_STYLE };
const INPUT_NO_UNIT_FOCUS: React.CSSProperties = { ...INPUT_NO_UNIT, ...INPUT_FOCUS_STYLE };

const CELL_CENTER_STYLE: React.CSSProperties = { display: 'flex', justifyContent: 'center' };
const NAME_CELL_STYLE: React.CSSProperties = { minWidth: 0 };
const NAME_STACK_STYLE: React.CSSProperties = { minWidth: 0 };
const NAME_TEXT_STYLE: React.CSSProperties = { minWidth: 0 };
const RIGHT_STYLE: React.CSSProperties = { textAlign: 'right' };
const QTY_WRAPPER_STYLE: React.CSSProperties = { position: 'relative', width: 140 };
const UNIT_STYLE: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text)',
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
    const { t } = useTranslation('menu');
    const measurementLabel = row.measurement
        ? t(`units.${row.measurement}`, { defaultValue: row.measurement })
        : '';
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
    const formatNumberWithSpaces = React.useCallback((num: number | string | undefined | null): string => {
        if (num === undefined || num === null || num === 0) return '';
        const stringValue = String(num);

        const numericValue = parseFloat(stringValue);
        if (!Number.isFinite(numericValue)) return stringValue;

        // Check if the value has decimal places
        const hasDecimals = numericValue % 1 !== 0;
        const formatted = (hasDecimals ? DEC2_FORMATTER : INT_FORMATTER).format(numericValue);
        return formatted.replace(/,/g, ' ');
    }, []);

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
        <div className={`meal-picker-added-row${isSelected ? ' is-selected' : ''}`}>
            <div style={CELL_CENTER_STYLE}>
                <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={handleSelect}
                    inputProps={{ 'aria-label': 'select added row' }}
                />
            </div>

            <div style={NAME_CELL_STYLE}>
                <Stack direction="row" spacing={1} alignItems="center" sx={NAME_STACK_STYLE}>
                    <Typography variant="body2" noWrap sx={NAME_TEXT_STYLE} fontFamily='"Inter", sans-serif'>
                        {row.name}
                    </Typography>
                    <TypeBadge
                        type={row.type}
                        ingredientLabel={ingredientLabel}
                        compoundLabel={compoundLabel}
                    />
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: '"Inter", sans-serif' }}>
                    {measurementLabel || '—'}
                </Typography>
            </div>

            <div style={CELL_CENTER_STYLE}>
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
                        style={
                            row.measurement
                                ? (isFocused ? INPUT_WITH_UNIT_FOCUS : INPUT_WITH_UNIT)
                                : (isFocused ? INPUT_NO_UNIT_FOCUS : INPUT_NO_UNIT)
                        }
                    />
                    {row.measurement ? <span style={UNIT_STYLE}>{measurementLabel}</span> : null}
                </div>
            </div>

            <Typography variant="body2" style={RIGHT_STYLE} sx={{ fontFamily: '"Inter", sans-serif' }}>
                {pricePerUnit.toFixed(2)}
            </Typography>
            <Typography variant="body2" style={RIGHT_STYLE} sx={{ fontFamily: '"Inter", sans-serif' }}>
                {totalPrice.toFixed(2)}
            </Typography>

            <div style={CELL_CENTER_STYLE}>
                <IconButton size="small" color="error" onClick={handleRemove} aria-label="remove">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>
        </div>
    );
});
