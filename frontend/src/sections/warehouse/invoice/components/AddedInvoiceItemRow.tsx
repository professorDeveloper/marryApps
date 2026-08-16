import type { AddedInvoiceItemRowProps } from '../types';

import { useTranslation } from 'react-i18next';
import React, { memo, useCallback } from 'react';

import { Box, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { ADDED_INVOICE_ROW_GRID } from '../constants';

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
};

function areEqual(prev: AddedInvoiceItemRowProps, next: AddedInvoiceItemRowProps) {
    return (
        prev.id === next.id &&
        prev.rowIndex === next.rowIndex &&
        prev.name === next.name &&
        prev.measurement === next.measurement &&
        prev.quantity === next.quantity &&
        prev.pricePerUnit === next.pricePerUnit &&
        prev.price === next.price &&
        prev.onQuantityChange === next.onQuantityChange &&
        prev.onPricePerUnitChange === next.onPricePerUnitChange &&
        prev.onTotalPriceChange === next.onTotalPriceChange &&
        prev.onRemoveRow === next.onRemoveRow &&
        prev.removeTitle === next.removeTitle
    );
}

export const AddedInvoiceItemRow = memo(function AddedInvoiceItemRow({
    rowIndex,
    id,
    name,
    measurement,
    quantity,
    pricePerUnit,
    price,
    onQuantityChange,
    onPricePerUnitChange,
    onTotalPriceChange,
    onRemoveRow,
    removeTitle,
}: AddedInvoiceItemRowProps) {
    const { t } = useTranslation('menu');
    const handleQty = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onQuantityChange(id, e.target.value),
        [onQuantityChange, id]
    );
    const handlePpu = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onPricePerUnitChange(id, e.target.value),
        [onPricePerUnitChange, id]
    );
    const handleTotal = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onTotalPriceChange(id, e.target.value),
        [onTotalPriceChange, id]
    );
    const handleRemove = useCallback(() => onRemoveRow(id), [onRemoveRow, id]);

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: ADDED_INVOICE_ROW_GRID,
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
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {rowIndex + 1}
            </Typography>

            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {name}
                </Typography>

            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <div style={{ position: "relative", width: "200px" }}>
                    <input
                        type="number"
                        value={quantity}
                        onChange={handleQty}
                        step="0.01"
                        min="0"
                        style={{
                            ...INPUT_STYLE,
                            width: "100%",
                            paddingRight: "40px", // space for suffix
                        }}
                    />

                    <span
                        style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "gray",
                            pointerEvents: "none", // important!
                        }}
                    >
                        {measurement ? t(`units.${measurement}`, { defaultValue: measurement }) : ''}
                    </span>
                </div>
            </Box>

            <input
                type="number"
                value={pricePerUnit}
                onChange={handlePpu}
                step="0.01"
                min="0"
                style={INPUT_STYLE}
            />

            <input
                type="number"
                value={price}
                onChange={handleTotal}
                step="0.01"
                min="0"
                style={INPUT_STYLE}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <IconButton size="small" color="error" onClick={handleRemove} title={removeTitle}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );
}, areEqual);
