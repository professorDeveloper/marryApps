import { Box, Typography, Stack } from '@mui/material';

import type { RevenueByPaymentTypes } from '../types';
import { PAYMENT_TYPE_LABELS } from '../constants';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface PaymentTypesPieChartProps {
  data: RevenueByPaymentTypes;
}

export function PaymentTypesPieChart({ data }: PaymentTypesPieChartProps) {
  const chartSize = 200;
  const radius = 80;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  const colors = [
    'var(--color-info-500)',
    'var(--color-warning-500)',
    'var(--color-danger-600)',
    'var(--color-primary-500)',
    'var(--color-success-500)',
    'var(--color-secondary-500)',
  ];

  function getSliceColor(angle: number) {
    const index = Math.floor((angle / 360) * colors.length);
    return colors[index % colors.length];
  }

  let currentAngle = 0;
  const slices = data.items.map((item) => {
    const percent = parseFloat(item.percent);
    const angle = (percent / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      pathData,
      percent,
      label: PAYMENT_TYPE_LABELS[item.payment_type] || item.payment_type,
      revenue: parseFloat(item.revenue),
      color: getSliceColor(startAngle),
    };
  });

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

        <Stack direction="row" spacing={3} alignItems="center" justifyContent="center" flex={1}>
          <Box sx={{ position: 'relative' }}>
            <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                  style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              ))}
            </svg>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {formatCurrency(parseFloat(data.total))}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--color-text-muted)' }}>
                Total
              </Typography>
            </Box>
          </Box>

          <Stack spacing={1.5}>
            {slices.map((slice, index) => (
              <Stack key={index} direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: slice.color,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {slice.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                      {formatPercentage(slice.percent, false)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
