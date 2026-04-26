import type { InventorySummaryPanelProps } from '../types';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Paper, Button, Divider, Typography, CircularProgress } from '@mui/material';

import { formatPrice } from '../utils/formatPrice';

export const InventorySummaryPanel = React.memo<InventorySummaryPanelProps>(({
    itemCount,
    reportLookup,
    quantities,
    transferredIds,
    onCancel,
    onSave,
    cancelDisabled,
    saveDisabled,
    isSaving,
}) => {
    const { t } = useTranslation('menu');

    const totals = useMemo(() => {
        let shortage = 0;
        let surplus = 0;
        let remaining = 0;

        const seen = new Set<string>();
        transferredIds.forEach((id) => {
            if (seen.has(id)) return;
            seen.add(id);
            const report = reportLookup[id];
            if (!report) return;
            const counted = quantities[id];
            if (counted === undefined) return;
            const diff = counted - report.systemQuantity;
            const impact = diff * report.pricePerUnit;
            if (diff > 0) {
                surplus += impact;
            } else if (diff < 0) {
                shortage += Math.abs(impact);
            }
            remaining += counted * report.pricePerUnit;
        });

        return { shortage, surplus, remaining };
    }, [reportLookup, quantities, transferredIds]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('warehouse.invoiceDetails.summary', 'Summary')}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('warehouse.invoiceDetails.products', 'Products')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {itemCount}
                </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('inventory.surplus', 'Surplus')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatPrice(totals.surplus)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('inventory.shortage', 'Shortage')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatPrice(totals.shortage)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                    {t('inventory.remaining', 'Remaining')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(totals.remaining)}
                </Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onCancel}
                    disabled={cancelDisabled}
                >
                    {t('cancel')}
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => void onSave()}
                    disabled={saveDisabled || isSaving}
                >
                    {isSaving ? (
                        <CircularProgress size={18} sx={{ color: 'white' }} />
                    ) : (
                        t('common.save', 'Save')
                    )}
                </Button>
            </Box>
        </Paper>
    );
});
