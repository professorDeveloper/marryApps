import type { DataTableColumn } from 'src/sections/common/data-table/types/types';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { CELL_SX } from 'src/sections/common/data-table/utils/constants';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

// ----------------------------------------------------------------------

type RatingPeriod = 'weekly' | 'monthly' | 'all_time';

interface IEmployeeRating {
  employee_id: string;
  full_name: string;
  role?: string;
  rating: number;
  orders_count?: number;
  revenue?: number;
}

interface RatingsResponse {
  data: IEmployeeRating[];
}

// ----------------------------------------------------------------------

export function KpiListView() {
  const { t } = useTranslation('menu');
  const [period, setPeriod] = useState<RatingPeriod>('monthly');

  const url = `${endpoints.staffing.employees.ratings}?period=${period}`;
  const { data } = useSWR<RatingsResponse | IEmployeeRating[]>(url, fetcher);

  const ratings: IEmployeeRating[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as RatingsResponse).data ?? [];
  }, [data]);

  const columns: DataTableColumn<IEmployeeRating>[] = useMemo(
    () => [
      {
        key: 'full_name',
        label: t('staffing.kpi.employee'),
        sortable: true,
        filterable: true,
        width: '1.5fr',
        align: 'left',
        getValue: (row: IEmployeeRating) => row.full_name,
        renderCell: ({ row }: { row: IEmployeeRating }) => <Box sx={CELL_SX}>{row.full_name}</Box>,
      },
      {
        key: 'role',
        label: t('staffing.kpi.role'),
        sortable: true,
        filterable: false,
        width: '1fr',
        align: 'left',
        getValue: (row: IEmployeeRating) => row.role ?? '-',
        renderCell: ({ row }: { row: IEmployeeRating }) => <Box sx={CELL_SX}>{row.role ?? '-'}</Box>,
      },
      {
        key: 'orders_count',
        label: t('staffing.kpi.ordersCount'),
        sortable: true,
        filterable: false,
        width: '0.8fr',
        align: 'center',
        getValue: (row: IEmployeeRating) => String(row.orders_count ?? '-'),
        renderCell: ({ row }: { row: IEmployeeRating }) => (
          <Box sx={{ ...CELL_SX, justifyContent: 'center' }}>{row.orders_count ?? '-'}</Box>
        ),
      },
      {
        key: 'revenue',
        label: t('staffing.kpi.revenue'),
        sortable: true,
        filterable: false,
        width: '1fr',
        align: 'right',
        getValue: (row: IEmployeeRating) => String(row.revenue ?? '-'),
        renderCell: ({ row }: { row: IEmployeeRating }) => (
          <Box sx={{ ...CELL_SX, justifyContent: 'flex-end' }}>
            {row.revenue != null ? row.revenue.toLocaleString() : '-'}
          </Box>
        ),
      },
      {
        key: 'rating',
        label: t('staffing.kpi.rating'),
        sortable: true,
        filterable: false,
        width: '0.8fr',
        align: 'center',
        getValue: (row: IEmployeeRating) => String(row.rating),
        renderCell: ({ row }: { row: IEmployeeRating }) => (
          <Box sx={{ ...CELL_SX, justifyContent: 'center' }}>{row.rating}</Box>
        ),
      },
    ],
    [t]
  );

  return (
    <DashboardContent
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh',
        '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
        '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
      }}
    >
      <DeductionUtilityDataTable
        persistKey="staffing-kpi-table"
        data={ratings}
        getRowId={(row: IEmployeeRating) => row.employee_id}
        columns={columns}
        defaultConfig={{
          order: ['full_name', 'role', 'orders_count', 'revenue', 'rating'],
          visibility: { full_name: true, role: true, orders_count: true, revenue: true, rating: true },
          widths: { full_name: '1.5fr', role: '1fr', orders_count: '0.8fr', revenue: '1fr', rating: '0.8fr' },
        }}
        onReset={() => {}}
        headerActions={
          <ToggleButtonGroup
            value={period}
            exclusive
            size="small"
            onChange={(_, val) => { if (val) setPeriod(val); }}
          >
            <ToggleButton value="weekly">{t('staffing.kpi.weekly')}</ToggleButton>
            <ToggleButton value="monthly">{t('staffing.kpi.monthly')}</ToggleButton>
            <ToggleButton value="all_time">{t('staffing.kpi.allTime')}</ToggleButton>
          </ToggleButtonGroup>
        }
      />
    </DashboardContent>
  );
}
