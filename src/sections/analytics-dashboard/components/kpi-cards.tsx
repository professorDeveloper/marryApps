import { useState } from 'react';
import { Box, Stack, Typography, IconButton, Menu, MenuItem, Button } from '@mui/material';
import { DateRange, KeyboardArrowDown } from '@mui/icons-material';

import { fDate } from 'src/utils/format-time';

import type { DashboardKPIs } from '../types';
import { KPI_CONFIG, DATE_RANGE_PRESETS } from '../constants';
import { formatCurrency, formatNumber, formatPercentage, getTrendColor, getTrendIcon } from '../utils/formatters';

interface KPICardsProps {
  kpis: DashboardKPIs;
  onDateRangeChange: (start: string, end: string) => void;
  startDate: Date;
  endDate: Date;
}

export function KPICards({ kpis, onDateRangeChange, startDate, endDate }: KPICardsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onDateRangeChange(start.toISOString(), end.toISOString());
    handleMenuClose();
  };

  const kpiEntries = [
    { key: 'revenue' as const, kpi: kpis.revenue },
    { key: 'checks_count' as const, kpi: kpis.checks_count },
    { key: 'average_check' as const, kpi: kpis.average_check },
    { key: 'returns_count' as const, kpi: kpis.returns_count },
    { key: 'discounts_amount' as const, kpi: kpis.discounts_amount },
    { key: 'vat_amount' as const, kpi: kpis.vat_amount },
  ];

  const renderKPIValue = (key: keyof DashboardKPIs, kpi: DashboardKPIs[keyof DashboardKPIs]) => {
    const value = parseFloat(kpi.value);
    
    if (key === 'revenue' || key === 'average_check' || key === 'discounts_amount' || key === 'vat_amount') {
      return formatCurrency(value);
    }
    
    return formatNumber(value);
  };

  return (
    <Box>
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ mb: 4, pb: 2, borderBottom: '1px solid var(--color-border)' }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          INTELLIGENCE ONYX
        </Typography>
        <Button
          onClick={handleMenuOpen}
          endIcon={<KeyboardArrowDown />}
          sx={{
            bgcolor: 'var(--color-surface-2)',
            color: 'var(--color-text-primary)',
            borderRadius: 1,
            px: 2,
            py: 1,
            '&:hover': {
              bgcolor: 'var(--color-surface-3)',
            },
          }}
        >
          {fDate(startDate)} - {fDate(endDate)}
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          {DATE_RANGE_PRESETS.map((preset) => (
            <MenuItem key={preset.label} onClick={() => handlePresetClick(preset.days)}>
              {preset.label}
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: 2 
        }}
      >
        {kpiEntries.map((entry) => {
          const config = KPI_CONFIG[entry.key];
          const trendColor = getTrendColor(entry.kpi.trend);
          const trendIcon = getTrendIcon(entry.kpi.trend);
          
          return (
            <Box
              key={entry.key}
              sx={{
                p: 3,
                bgcolor: 'var(--color-surface-1)',
                borderRadius: 2,
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="h4" sx={{ fontSize: 24 }}>{config.icon}</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      textTransform: 'uppercase', 
                      fontSize: 11,
                      letterSpacing: 0.5,
                      color: 'var(--color-text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {config.label}
                  </Typography>
                </Stack>
                
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {renderKPIValue(entry.key, entry.kpi)}
                </Typography>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ color: trendColor, fontWeight: 600, fontSize: 13 }}>
                    {trendIcon} {formatPercentage(entry.kpi.change_percent)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    vs previous
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
