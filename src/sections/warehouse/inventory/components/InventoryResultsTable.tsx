import type { InventoryResultsTableProps } from '../types';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Paper, Divider, Typography } from '@mui/material';

import { formatPrice } from '../utils/formatPrice';

const COL_GRID = 'minmax(140px,2fr) 60px repeat(3,1fr) repeat(4,1fr)' as const;

export const InventoryResultsTable = React.memo<InventoryResultsTableProps>(({ items }) => {
    const { t } = useTranslation('menu');

    if (items.length === 0) return null;

    return (
        <Paper sx={{ overflow: 'hidden' }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: COL_GRID,
                    px: 1.5,
                    py: 1,
                    bgcolor: 'action.hover',
                    minWidth: 900,
                }}
            >
                {[
                    t('calculation.productName'),
                    t('calculation.unit'),
                    t('calculation.systemQty'),
                    t('calculation.countedQty'),
                    t('calculation.difference'),
                    t('calculation.pricePerUnit'),
                    t('calculation.surplus'),
                    t('calculation.shortage'),
                    t('calculation.remaining'),
                ].map((label, i) => (
                    <Typography
                        key={i}
                        variant="caption"
                        sx={{ fontWeight: 700, textAlign: i > 1 ? 'right' : 'left' }}
                    >
                        {label}
                    </Typography>
                ))}
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 500, overflowY: 'auto', overflowX: 'auto' }}>
                {items.map((item) => {
                    const diff = Number(item.difference_quantity);
                    return (
                        <Box
                            key={item.inventory_item_id || item.ingredient_id}
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: COL_GRID,
                                alignItems: 'center',
                                px: 1.5,
                                py: 1,
                                borderBottom: 1,
                                borderColor: 'divider',
                                minWidth: 900,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                                {item.ingredient_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {item.ingredient_measurement ? t(`units.${item.ingredient_measurement}`, { defaultValue: item.ingredient_measurement }) : ''}
                            </Typography>
                            <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                {item.system_quantity}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                                {item.counted_quantity}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    textAlign: 'right',
                                    color: diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary',
                                }}
                            >
                                {diff}
                            </Typography>
                            <Typography variant="caption" sx={{ textAlign: 'right' }}>
                                {formatPrice(parseFloat(item.price_per_unit))}
                            </Typography>
                            <Typography variant="caption" sx={{ textAlign: 'right', color: 'success.main', fontWeight: 600 }}>
                                {formatPrice(parseFloat(item.surplus_amount))}
                            </Typography>
                            <Typography variant="caption" sx={{ textAlign: 'right', color: 'error.main', fontWeight: 600 }}>
                                {formatPrice(parseFloat(item.shortage_amount))}
                            </Typography>
                            <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                {formatPrice(parseFloat(item.remaining_amount))}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
});
