import type { SummaryPanelProps } from '../types';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Paper, Button, Divider, Typography } from '@mui/material';

export const SummaryPanel = React.memo<SummaryPanelProps>(
    ({
        entries,
        totalLabel,
        totalValue,
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
                    {t('warehouse.invoiceDetails.summary', 'Summary')}
                </Typography>

                {entries.map((entry) => (
                    <Box
                        key={entry.label}
                        sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {entry.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.value}
                        </Typography>
                    </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" color="text.secondary">
                    {totalLabel}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {totalValue}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {onCancel && (
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={onCancel}
                            disabled={cancelDisabled}
                        >
                            {t('cancel')}
                        </Button>
                    )}
                    {onSave && (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => void onSave()}
                            disabled={saveDisabled}
                            sx={{
                                backgroundColor: '#FB6633',
                                color: 'white',
                                '&:hover': { backgroundColor: '#d9534f' },
                            }}
                        >
                            {saveLabel ?? t('common.save', 'Save')}
                        </Button>
                    )}
                </Box>
            </Paper>
        );
    }
);
