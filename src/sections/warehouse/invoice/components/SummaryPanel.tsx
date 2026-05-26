import type { SummaryPanelProps } from '../types';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Paper, Button, Divider, TextField, Typography } from '@mui/material';

import { formatPrice } from '../utils/formatPrice';

export const SummaryPanel = React.memo<SummaryPanelProps>(
    ({
        transferredItemsCount,
        totalQuantity,
        totalAmount,
        transferredIdsLength,
        onCancel,
        onSave,
        cancelDisabled,
        saveDisabled,
        saveLabel,
    }) => {
        const { t } = useTranslation('menu');

        return (
            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('warehouse.invoiceDetails.summary')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('warehouse.invoiceDetails.products')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {transferredItemsCount}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('warehouse.invoiceDetails.totalQty')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatPrice(totalQuantity)}
                    </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                    {t('warehouse.invoiceDetails.totalAmount')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {formatPrice(totalAmount)} UZS
                </Typography>

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('warehouse.invoiceDetails.status')}
                </Typography>
                <TextField
                    select
                    fullWidth
                    size="small"
                    SelectProps={{ native: true }}
                    defaultValue="pending"
                >
                    <option value="pending">{t('warehouse.invoices.statuses.pending')}</option>
                    <option value="completed">{t('warehouse.invoices.statuses.completed')}</option>
                </TextField>

                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button fullWidth variant="outlined" onClick={onCancel} disabled={cancelDisabled}>
                        {t('cancel')}
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => void onSave()}
                        disabled={saveDisabled || transferredIdsLength === 0}
                    >
                        {saveLabel}
                    </Button>
                </Box>
            </Paper>
        );
    }
);
