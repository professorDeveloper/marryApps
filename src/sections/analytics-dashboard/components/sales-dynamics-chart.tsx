import { Box, Typography, Stack } from '@mui/material';

import type { SalesDynamicsItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SalesDynamicsChartProps {
  data: SalesDynamicsItem[];
}

export function SalesDynamicsChart({ data }: SalesDynamicsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: 'var(--color-surface-1)',
          borderRadius: 2,
          border: '1px solid var(--color-border)',
        }}
      >
        <Typography color="var(--color-text-muted)">No data available</Typography>
      </Box>
    );
  }

  const chartHeight = 320;
  const chartWidth = 850;
  const padding = { top: 40, right: 40, bottom: 50, left: 70 };

  // Revenue data
  const revenueValues = data.map((d) => parseFloat(d.revenue));
  const maxRevenue = Math.max(...revenueValues);
  const minRevenue = Math.min(...revenueValues);
  const revenueRange = maxRevenue - minRevenue || 1;

  // Checks data
  const checksValues = data.map((d) => d.checks_count);
  const maxChecks = Math.max(...checksValues);
  const minChecks = Math.min(...checksValues);
  const checksRange = maxChecks - minChecks || 1;

  // Average check data
  const avgValues = data.map((d) => parseFloat(d.average_check));
  const maxAvg = Math.max(...avgValues);
  const minAvg = Math.min(...avgValues);
  const avgRange = maxAvg - minAvg || 1;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  const getYRevenue = (value: number) => chartHeight - padding.bottom - ((value - minRevenue) / revenueRange) * (chartHeight - padding.top - padding.bottom);
  const getYChecks = (value: number) => chartHeight - padding.bottom - ((value - minChecks) / checksRange) * (chartHeight - padding.top - padding.bottom);
  const getYAvg = (value: number) => chartHeight - padding.bottom - ((value - minAvg) / avgRange) * (chartHeight - padding.top - padding.bottom);

  // Generate paths
  const revenuePoints = data.map((item, i) => `${getX(i)},${getYRevenue(parseFloat(item.revenue))}`);
  const revenuePath = `M ${revenuePoints.join(' L ')}`;

  const checksPoints = data.map((item, i) => `${getX(i)},${getYChecks(item.checks_count)}`);
  const checksPath = `M ${checksPoints.join(' L ')}`;

  const avgPoints = data.map((item, i) => `${getX(i)},${getYAvg(parseFloat(item.average_check))}`);
  const avgPath = `M ${avgPoints.join(' L ')}`;

  // Area paths for gradients
  const revenueArea = `${revenuePath} L ${getX(data.length - 1)},${chartHeight - padding.bottom} L ${getX(0)},${chartHeight - padding.bottom} Z`;
  const checksArea = `${checksPath} L ${getX(data.length - 1)},${chartHeight - padding.bottom} L ${getX(0)},${chartHeight - padding.bottom} Z`;
  const avgArea = `${avgPath} L ${getX(data.length - 1)},${chartHeight - padding.bottom} L ${getX(0)},${chartHeight - padding.bottom} Z`;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'var(--color-surface-1)',
        borderRadius: 2,
        border: '1px solid var(--color-border)',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-text-primary)', mb: 0.5 }}>
            Financial Pulses
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
            Multi-metric performance tracking
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto', position: 'relative' }}>
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="checksGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-warning-500)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-warning-500)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="avgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-danger-600)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-danger-600)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
              const y = chartHeight - padding.bottom - percent * (chartHeight - padding.top - padding.bottom);
              return (
                <line
                  key={percent}
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="4"
                  strokeWidth="1"
                  opacity={0.5}
                />
              );
            })}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
              const y = chartHeight - padding.bottom - percent * (chartHeight - padding.top - padding.bottom);
              const value = minRevenue + percent * revenueRange;
              return (
                <text
                  key={percent}
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--color-text-muted)"
                  fontWeight={500}
                >
                  {formatCurrency(value)}
                </text>
              );
            })}

            {/* Area fills */}
            <path d={revenueArea} fill="url(#revenueGradient)" />
            <path d={checksArea} fill="url(#checksGradient)" />
            <path d={avgArea} fill="url(#avgGradient)" />

            {/* Lines */}
            <path d={revenuePath} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <path d={checksPath} fill="none" stroke="var(--color-warning-500)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />
            <path d={avgPath} fill="none" stroke="var(--color-danger-600)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12,6" />

            {/* Data points - Revenue */}
            {data.map((item, i) => (
              <g key={`revenue-${i}`}>
                <circle
                  cx={getX(i)}
                  cy={getYRevenue(parseFloat(item.revenue))}
                  r={6}
                  fill="var(--color-primary)"
                  stroke="var(--color-surface-1)"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                />
                <circle
                  cx={getX(i)}
                  cy={getYRevenue(parseFloat(item.revenue))}
                  r={10}
                  fill="var(--color-primary)"
                  opacity={0.2}
                />
              </g>
            ))}

            {/* Data points - Checks */}
            {data.map((item, i) => (
              <circle
                key={`checks-${i}`}
                cx={getX(i)}
                cy={getYChecks(item.checks_count)}
                r={5}
                fill="var(--color-warning-500)"
                stroke="var(--color-surface-1)"
                strokeWidth={2}
              />
            ))}

            {/* Data points - Average Check */}
            {data.map((item, i) => (
              <circle
                key={`avg-${i}`}
                cx={getX(i)}
                cy={getYAvg(parseFloat(item.average_check))}
                r={5}
                fill="var(--color-danger-600)"
                stroke="var(--color-surface-1)"
                strokeWidth={2}
              />
            ))}

            {/* X-axis labels */}
            {data.map((item, i) => (
              <text
                key={i}
                x={getX(i)}
                y={chartHeight - padding.bottom + 25}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-text-muted)"
                fontWeight={500}
              >
                {item.label}
              </text>
            ))}
          </svg>
        </Box>

        <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 32, height: 4, bgcolor: 'var(--color-primary)', borderRadius: 2 }} />
            <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Revenue
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 32, height: 4, bgcolor: 'var(--color-warning-500)', borderRadius: 2 }} />
            <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Checks
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ width: 32, height: 4, bgcolor: 'var(--color-danger-600)', borderRadius: 2 }} />
            <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Avg Check
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
