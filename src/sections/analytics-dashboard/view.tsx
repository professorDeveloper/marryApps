import { useState } from 'react';
import { Box, Container, Stack, CircularProgress, Alert } from '@mui/material';

import { useDashboardOverview } from './hooks/use-dashboard-overview';
import { DEFAULT_API_PARAMS } from './constants';
import { KPICards } from './components/kpi-cards';
import { SalesDynamicsChart } from './components/sales-dynamics-chart';
import { PaymentTypesPieChart } from './components/payment-types-pie-chart';
import { RevenueByCategories } from './components/revenue-by-categories';
import { DishSalesLeaderboard } from './components/dish-sales-leaderboard';
import { HallUtilization } from './components/hall-utilization';
import { OutletLeakage } from './components/outlet-leakage';

export function AnalyticsDashboardView() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const { data, isLoading, error } = useDashboardOverview({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    ...DEFAULT_API_PARAMS,
  });

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(new Date(start));
    setEndDate(new Date(end));
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            bgcolor: 'var(--color-surface-1)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 2,
          }}
        >
          Failed to load dashboard data: {error.message}
        </Alert>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="info" 
          sx={{ 
            bgcolor: 'var(--color-surface-1)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 2,
          }}
        >
          No data available
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <KPICards
          kpis={data.kpis}
          onDateRangeChange={handleDateRangeChange}
          startDate={startDate}
          endDate={endDate}
        />

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' }, 
            gap: 3 
          }}
        >
          <Box sx={{ flex: 2 }}>
            <SalesDynamicsChart data={data.sales_dynamics} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <PaymentTypesPieChart data={data.revenue_by_payment_types} />
          </Box>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 3 
          }}
        >
          <Box sx={{ flex: 1 }}>
            <RevenueByCategories data={data.revenue_by_categories} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <OutletLeakage />
          </Box>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 3 
          }}
        >
          <Box sx={{ flex: 1 }}>
            <DishSalesLeaderboard data={data.dish_sales} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <HallUtilization />
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
