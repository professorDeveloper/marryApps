import type { AddedInventoryItemRowProps } from '../types';

import React, { memo, useCallback } from 'react';

import { Box, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { INVENTORY_ROW_GRID } from '../constants';
import { formatPrice } from '../utils/formatPrice';

const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    fontSize: '0.8125rem',
    border: '1px solid var(--border)',
    borderRadius: 6,
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    textAlign: 'center',
};

function areEqual(prev: AddedInventoryItemRowProps, next: AddedInventoryItemRowProps) {
    return (
        prev.id === next.id &&
        prev.rowIndex === next.rowIndex &&
        prev.name === next.name &&
        prev.measurement === next.measurement &&
        prev.quantity === next.quantity &&
        prev.hasReport === next.hasReport &&
        prev.systemQuantity === next.systemQuantity &&
        prev.difference === next.difference &&
        prev.impact === next.impact &&
        prev.onQuantityChange === next.onQuantityChange &&
        prev.onRemoveRow === next.onRemoveRow &&
        prev.removeTitle === next.removeTitle
    );
}

export const AddedInventoryItemRow = memo(function AddedInventoryItemRow({
    id,
    name,
    measurement,
    quantity,
    hasReport,
    systemQuantity,
    difference,
    impact,
    onQuantityChange,
    onRemoveRow,
    removeTitle,
}: AddedInventoryItemRowProps) {
    const handleQty = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onQuantityChange(id, e.target.value),
        [onQuantityChange, id]
    );
    const handleRemove = useCallback(() => onRemoveRow(id), [onRemoveRow, id]);

    const hasDiff = difference !== undefined;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: INVENTORY_ROW_GRID,
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
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {measurement}
                </Typography>
            </Box>

            <Typography variant="body2" sx={{ textAlign: 'center', flexShrink: 0 }}>
                {systemQuantity ?? '—'}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <input
                    type="number"
                    value={quantity}
                    onChange={handleQty}
                    step="0.01"
                    min="0"
                    style={INPUT_STYLE}
                />
            </Box>

            <Typography
                variant="body2"
                sx={{
                    textAlign: 'center',
                    fontWeight: 600,
                    flexShrink: 0,
                    color: hasDiff
                        ? (difference! > 0 ? 'success.main' : difference! < 0 ? 'error.main' : 'text.secondary')
                        : 'text.secondary',
                }}
            >
                {hasDiff
                    ? (difference! > 0 ? `+${difference}` : difference)
                    : '—'}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    textAlign: 'right',
                    fontWeight: 600,
                    flexShrink: 0,
                    color: hasReport && impact
                        ? (impact > 0 ? 'success.main' : 'error.main')
                        : 'text.secondary',
                }}
            >
                {hasReport
                    ? (impact
                        ? (impact > 0 ? `+${formatPrice(impact)}` : formatPrice(impact))
                        : formatPrice(0))
                    : '—'}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <IconButton size="small" color="error" onClick={handleRemove} title={removeTitle}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );
}, areEqual);
