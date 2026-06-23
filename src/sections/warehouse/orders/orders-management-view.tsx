import type { OrderEntity } from 'src/types/orders';
import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Chip, Button, MenuItem, TextField } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useOrdersAPI } from 'src/hooks/use-orders-api';
import { useTimeFilter } from 'src/hooks/use-time-filter';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCafeTables } from 'src/actions/cafe-tables';

import { Iconify } from 'src/components/iconify';

import { DataTable, FILTER_SELECT_SX } from 'src/sections/common/data-table';

// Date utility functions
const getTodayUtcBoundary = (endOfDay = false): string => {
    const now = dayjs();
    const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
    return boundary.toISOString().replace('.000Z', 'Z');
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
    const now = dayjs().add(1, 'day');
    const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
    return boundary.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (dateString: string): dayjs.Dayjs | null => {
    if (!dateString) return null;
    return dayjs(dateString);
};

const statusColorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error' | 'primary'> = {
  reserved: 'warning',
  rescheduled: 'warning',
  open: 'info',
  cooking: 'primary',
  ready: 'success',
  served: 'success',
  paid: 'success',
  cancelled: 'error',
};

const filterSelectSx = {
  ...FILTER_SELECT_SX,
  '& .MuiInputLabel-root': { display: 'block' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

const tableLabel = (table: any): string => {
  if (!table) return '-';
  return `#${table.number} (${table.capacity})`;
};

export function OrdersManagementView() {
  const { t } = useTranslation('menu');

  const { tables } = useGetCafeTables();
  const { getOrders } = useOrdersAPI();

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const { startDate, endDate, activePeriod: activeRange, setDates, applyRange, reset: resetTimeFilter } = useTimeFilter();
  const [sortState, setSortState] = useState<{ key: string | null; dir: string | null }>({ key: null, dir: null });

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        order_type: orderType || undefined,
        status: status || undefined,
        from: startDate ? startDate.format('YYYY-MM-DD') : undefined,
        to: endDate ? endDate.format('YYYY-MM-DD') : undefined,
        sort_by: sortState.key || undefined,
        sort_order: (sortState.dir === 'asc' || sortState.dir === 'desc') ? sortState.dir : undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });
      setOrders(response.data);
      setRowCount(response.total || response.data.length);
    } finally {
      setLoading(false);
    }
  }, [getOrders, orderType, status, startDate, endDate, sortState, rowsPerPage, page]);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  const tableMap = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  const columns = useMemo<DataTableColumn<OrderEntity>[]>(
    () => [
      {
        key: 'order_type',
        label: t('order.type'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => row.order_type || 'dine_in',
      },
      {
        key: 'status',
        label: t('order.status'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => row.status || 'open',
        renderCell: ({ value }: { value: unknown }) => {
          const rowStatus = String(value || 'open');
          return (
            <Chip
              size="small"
              label={rowStatus}
              color={statusColorMap[rowStatus] || 'default'}
              sx={{ textTransform: 'capitalize', m: 1 }}
            />
          );
        },
      },
      {
        key: 'table_id',
        label: t('order.table'),
        sortable: true,
        width: '1.5fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => (row.table_id ? tableLabel(tableMap.get(row.table_id)) : '-'),
      },
      {
        key: 'scheduled_at',
        label: t('order.scheduledAt'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => (row.scheduled_at ? dayjs(row.scheduled_at).format('DD.MM.YYYY HH:mm') : '-'),
      },
    ],
    [t, tableMap]
  );

  const defaultConfig: DataTableDefaultConfig = useMemo(
    () => ({
      order: ['order_type', 'status', 'table_id', 'scheduled_at'],
      visibility: {
        order_type: true,
        status: true,
        table_id: true,
        scheduled_at: true,
      },
      widths: {
        order_type: '1fr',
        status: '1fr',
        table_id: '1.5fr',
        scheduled_at: '1.2fr',
      },
    }),
    []
  );

  const handleReset = useCallback(() => {
    setSearchQuery('');
    setPage(0);
    setRowsPerPage(20);
    resetTimeFilter();
  }, [resetTimeFilter]);


  return (
    <DashboardContent
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
        '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
      }}
    >
     

      <DataTable<OrderEntity>
        persistKey="warehouse-orders-management"
        data={orders}
        getRowId={(row: OrderEntity) => String(row.id)}
        columns={columns}
        defaultConfig={defaultConfig}
        onReset={handleReset}
        search={{ value: searchQuery, onChange: setSearchQuery }}
        onSortChange={(sort) => {
          setSortState({ key: sort.key, dir: sort.dir });
        }}
        toolbarActions={
          <TextField
            select size="small" 
            label={t('order.status')}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={filterSelectSx}
          >
            <MenuItem value="">All</MenuItem>
            {Object.keys(statusColorMap).map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </TextField>
        }
        pagination={{
          page,
          rowsPerPage,
          totalCount: rowCount,
          rowsPerPageOptions: [20, 50, 100],
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => { setRowsPerPage(newRowsPerPage); setPage(0); },
        }}
        periodFilter={{
          startDate: startDate ? startDate.toDate() : null,
          endDate: endDate ? endDate.toDate() : null,
          onStartDateChange: (date: Date | null) => { setDates(date ? dayjs(date) : null, endDate, 'day'); setPage(0); },
          onEndDateChange: (date: Date | null) => { setDates(startDate, date ? dayjs(date) : null, 'day'); setPage(0); },
          activePeriod: activeRange,
          onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => { applyRange(period); setPage(0); },
        }}
        emptyTitle="No orders found"
        emptySubtitle="Try adjusting filters or check back later."
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.cashbooks.orders.new}
            size="small"
          >
            {t('common.add')}
          </Button>
        }
      />
    </DashboardContent>
  );
}

export default OrdersManagementView;
