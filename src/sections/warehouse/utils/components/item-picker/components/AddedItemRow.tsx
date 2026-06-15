import type { ColumnDef, AddedItemRowProps } from '../types';

import React, { memo, useCallback } from 'react';

import { Box, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    padding: '7px 9px',
    fontSize: '0.9375rem',
    border: '1px solid var(--border)',
    borderRadius: 6,
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const INPUT_ERROR_STYLE: React.CSSProperties = {
    borderColor: '#d32f2f',
    backgroundColor: 'rgba(211, 47, 47, 0.06)',
};

function itemDisplayEqual(
    a: AddedItemRowProps['item'],
    b: AddedItemRowProps['item'],
    columns: ColumnDef[]
) {
    if (a === b) return true;
    if (a.id !== b.id || a.name !== b.name || a.measurement !== b.measurement) return false;
    for (const col of columns) {
        if (a[col.key] !== b[col.key]) return false;
    }
    return true;
}

function areEqual(prev: AddedItemRowProps, next: AddedItemRowProps) {
    if (prev.rowIndex !== next.rowIndex) return false;
    if (prev.totalRows !== next.totalRows) return false;
    if (!itemDisplayEqual(prev.item, next.item, prev.columns)) return false;
    if (prev.onValueChange !== next.onValueChange || prev.onRemove !== next.onRemove) return false;
    if (prev.removeTitle !== next.removeTitle || prev.gridTemplate !== next.gridTemplate) return false;
    if (prev.columns !== next.columns) return false;
    if (prev.onNavigateFocus !== next.onNavigateFocus) return false;

    return true;
}

export const AddedItemRow = memo(function AddedItemRow({
    rowIndex,
    totalRows,
    item,
    columns,
    onValueChange,
    onRemove,
    removeTitle,
    gridTemplate,
    onNavigateFocus,
}: AddedItemRowProps) {
    const handleRemove = useCallback(() => onRemove(item.id), [onRemove, item.id]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>, columnKey: string) => {
            if (e.key === 'ArrowDown' && onNavigateFocus) {
                e.preventDefault();
                if (rowIndex < totalRows - 1) {
                    onNavigateFocus('down', rowIndex, columnKey);
                }
            } else if (e.key === 'ArrowUp' && onNavigateFocus) {
                e.preventDefault();
                if (rowIndex > 0) {
                    onNavigateFocus('up', rowIndex, columnKey);
                }
            } else if (e.key === 'ArrowLeft' && onNavigateFocus) {
                const input = e.currentTarget;
                const cursorPosition = input.selectionStart;
                const valueLength = input.value.length;

                // Only switch columns if cursor is at the start of the value
                if (cursorPosition === 0) {
                    e.preventDefault();
                    onNavigateFocus('left', rowIndex, columnKey);
                }
                // Otherwise, let default behavior move cursor left within the number
            } else if (e.key === 'ArrowRight' && onNavigateFocus) {
                const input = e.currentTarget;
                const cursorPosition = input.selectionStart;
                const valueLength = input.value.length;

                // Only switch columns if cursor is at the end of the value
                if (cursorPosition === valueLength) {
                    e.preventDefault();
                    onNavigateFocus('right', rowIndex, columnKey);
                }
                // Otherwise, let default behavior move cursor right within the number
            }
        },
        [rowIndex, totalRows, onNavigateFocus]
    );

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: gridTemplate,
                columnGap: 1,
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderBottom: 1,
                borderColor: 'divider',
                boxSizing: 'border-box',
                minHeight: 48,
                bgcolor: 'background.paper',
            }}
        >
            {/* Row number */}
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {rowIndex + 1}
            </Typography>

            {/* Product name */}
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {item.name}
                </Typography>
            </Box>

            {/* Dynamic columns */}
            {columns.map((col) => (
                <CellRenderer
                    key={col.key}
                    col={col}
                    item={item}
                    onValueChange={onValueChange}
                    onKeyDown={col.editable && (col.key === 'counted_quantity' || col.key === 'quantity' || col.key === 'price_per_unit' || col.key === 'total') ? (e) => handleKeyDown(e, col.key) : undefined}
                />
            ))}

            {/* Delete button */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton size="small" color="error" onClick={handleRemove} title={removeTitle}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );
}, areEqual);

// ---------------------------------------------------------------------------
// Cell renderer — handles both editable inputs and display-only text
// ---------------------------------------------------------------------------

interface CellRendererProps {
    col: ColumnDef;
    item: AddedItemRowProps['item'];
    onValueChange: AddedItemRowProps['onValueChange'];
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const CellRenderer = memo(function CellRenderer({ col, item, onValueChange, onKeyDown }: CellRendererProps) {
    const value = item[col.key];
    const [isFocused, setIsFocused] = React.useState(false);
    const [localValue, setLocalValue] = React.useState<string>('');

    // Sync local value with prop value when not focused
    React.useEffect(() => {
        if (!isFocused) {
            setLocalValue(String(value || ''));
        }
    }, [value, isFocused]);

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

    const handleChange = useCallback(
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

                const rawValue = filtered.replace(/\s/g, '');
                onValueChange(item.id, col.key, rawValue);
            } else {
                setLocalValue(newValue);

                const rawValue = newValue.replace(/\s/g, '');
                onValueChange(item.id, col.key, rawValue);
            }
        },
        [onValueChange, item.id, col.key]
    );

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setLocalValue(String(value || ''));
    }, [value]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    if (col.editable) {
        const suffix = col.suffix?.(item);
        const inputType = col.type === 'text' ? 'text' : 'text'; // Always use text to avoid browser limits

        const numericValue = parseFloat(String(value ?? ''));
        const isInvalid = !!col.requiredPositive && !(numericValue > 0);

        if (suffix) {
            return (
                <div style={{ position: 'relative' }}>
                    <input
                        type={inputType}
                        value={displayValue}
                        onChange={handleChange}
                        onKeyDown={onKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        inputMode="decimal"
                        placeholder="0"
                        style={isInvalid ? { ...INPUT_STYLE, paddingRight: 40, ...INPUT_ERROR_STYLE } : { ...INPUT_STYLE, paddingRight: 40 }}
                    />
                    <span
                        style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'gray',
                            pointerEvents: 'none',
                            fontSize: '0.75rem',
                        }}
                    >
                        {suffix}
                    </span>
                </div>
            );
        }

        return (
            <input
                type={inputType}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={onKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                inputMode="decimal"
                placeholder="0"
                style={isInvalid ? { ...INPUT_STYLE, ...INPUT_ERROR_STYLE } : INPUT_STYLE}
            />
        );
    }

    // Display-only
    const display = col.format ? col.format(value) : String(value);
    const cellColor = col.colorFn?.(item);
    return (
        <Typography
            variant="caption"
            sx={{ textAlign: col.align ?? 'right', fontWeight: 500, color: cellColor }}
            noWrap
        >
            {display}
        </Typography>
    );
});
