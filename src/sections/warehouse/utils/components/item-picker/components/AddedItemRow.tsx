import type { ColumnDef, AddedItemRowProps } from '../types';

import React, { memo, useCallback } from 'react';

import { Box, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    fontSize: '0.8125rem',
    border: '1px solid var(--palette-divider, rgba(145,158,171,0.32))',
    borderRadius: 6,
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
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
    if (!itemDisplayEqual(prev.item, next.item, prev.columns)) return false;
    if (prev.onValueChange !== next.onValueChange || prev.onRemove !== next.onRemove) return false;
    if (prev.removeTitle !== next.removeTitle || prev.gridTemplate !== next.gridTemplate) return false;
    if (prev.columns !== next.columns) return false;

    return true;
}

export const AddedItemRow = memo(function AddedItemRow({
    rowIndex,
    item,
    columns,
    onValueChange,
    onRemove,
    removeTitle,
    gridTemplate,
}: AddedItemRowProps) {
    const handleRemove = useCallback(() => onRemove(item.id), [onRemove, item.id]);

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
}

const CellRenderer = memo(function CellRenderer({ col, item, onValueChange }: CellRendererProps) {
    const value = item[col.key] ?? '';

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange(item.id, col.key, e.target.value);
        },
        [onValueChange, item.id, col.key]
    );

    if (col.editable) {
        const suffix = col.suffix?.(item);

        if (suffix) {
            return (
                <div style={{ position: 'relative' }}>
                    <input
                        type={col.type ?? 'number'}
                        value={value}
                        onChange={handleChange}
                        step={col.step ?? '0.01'}
                        min={col.min ?? '0'}
                        style={{ ...INPUT_STYLE, paddingRight: 40 }}
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
                type={col.type ?? 'number'}
                value={value}
                onChange={handleChange}
                step={col.step ?? '0.01'}
                min={col.min ?? '0'}
                style={INPUT_STYLE}
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
