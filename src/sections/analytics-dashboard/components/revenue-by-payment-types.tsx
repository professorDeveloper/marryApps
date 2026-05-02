import { Box, Typography, Stack, LinearProgress } from '@mui/material';

import type { RevenueByPaymentTypes } from '../types';
import { PAYMENT_TYPE_LABELS } from '../constants';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface RevenueByPaymentTypesProps {
  data: RevenueByPaymentTypes;
}

export function RevenueByPaymentTypes({ data }: RevenueByPaymentTypesProps) {
  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'var(--color-surface-1)',
        borderRadius: 2,
        border: '1px solid var(--color-border)',
        height: '100%',
      }}
    >
      <Stack spacing={3} height="100%">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', mb: 0.5 }}>
            Payment Types
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
            Revenue distribution
          </Typography>
        </Box>

        <Stack spacing={2.5} flex={1} justifyContent="center">
          {data.items.map((item) => {
            const percent = parseFloat(item.percent);
            const label = PAYMENT_TYPE_LABELS[item.payment_type] || item.payment_type;
            
            return (
              <Box key={item.payment_type}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {formatCurrency(parseFloat(item.revenue))}
                  </Typography>
                </Stack>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={percent} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: 'var(--color-surface-2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'var(--color-primary)',
                          borderRadius: 3,
                        },
                      }} 
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', minWidth: 40, textAlign: 'right' }}>
                    {formatPercentage(percent, false)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
        
        <Box pt={2} borderTop="1px solid var(--color-border)">
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Total
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {formatCurrency(parseFloat(data.total))}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
