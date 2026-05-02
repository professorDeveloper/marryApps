import { Box, Typography, Stack } from '@mui/material';

import { formatCurrency, formatPercentage } from '../utils/formatters';

interface OutletLeakageProps {
  data?: {
    totalLeakage: string;
    items: Array<{
      outletName: string;
      leakageAmount: string;
      percent: string;
    }>;
  };
}

const MOCK_LEAKAGE_DATA = {
  totalLeakage: '12500000.00',
  items: [
    { outletName: 'Main Hall', leakageAmount: '5000000.00', percent: '40' },
    { outletName: 'VIP Room', leakageAmount: '3750000.00', percent: '30' },
    { outletName: 'Terrace', leakageAmount: '2500000.00', percent: '20' },
    { outletName: 'Bar', leakageAmount: '1250000.00', percent: '10' },
  ],
};

export function OutletLeakage({ data = MOCK_LEAKAGE_DATA }: OutletLeakageProps) {
  const maxValue = Math.max(...data.items.map((item) => parseFloat(item.leakageAmount)));

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'var(--color-surface-1)',
        borderRadius: 2,
        border: '1px solid var(--color-border)',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', mb: 0.5 }}>
            Outlet Leakage
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
            Variance analysis by outlet
          </Typography>
        </Box>

        <Stack spacing={2}>
          {data.items.map((item) => {
            const value = parseFloat(item.leakageAmount);
            const percent = (value / maxValue) * 100;
            
            return (
              <Box key={item.outletName}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {item.outletName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--color-danger-600)', fontWeight: 600 }}>
                    {formatCurrency(value)} ({formatPercentage(parseFloat(item.percent), false)})
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    height: 6,
                    bgcolor: 'var(--color-surface-2)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${percent}%`,
                      bgcolor: 'var(--color-danger-600)',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
        
        <Box pt={2} borderTop="1px solid var(--color-border)">
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Total Leakage
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--color-danger-600)' }}>
              {formatCurrency(parseFloat(data.totalLeakage))}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
