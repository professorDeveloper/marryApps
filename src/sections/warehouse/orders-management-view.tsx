import type { OrderEntity } from 'src/types/orders';
import type { DataTableColumn, DataTableDefaultConfig } from './deduction/components/utility-data-table/types/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Chip, Button } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useOrdersAPI } from 'src/hooks/use-orders-api';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCafeTables } from 'src/actions/cafe-tables';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';

// Date utility functions
const getTodayUtcBoundary = (endOfDay = false): string => {
    const now = dayjs();
    const date = new Date(
        Date.UTC(
            now.year(),
            now.month(),
            now.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0,
            0
        )
    );
    return date.toISOString().replace('.000Z', 'Z');
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
    const now = dayjs().add(1, 'day');
    const date = new Date(
        Date.UTC(
            now.year(),
            now.month(),
            now.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0,
            0
        )
    );
    return date.toISOString().replace('.000Z', 'Z');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [sortState, setSortState] = useState<{ key: string | null; dir: string | null }>({ key: null, dir: null });

  // Set default date range on component mount
  useEffect(() => {
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
  }, []);

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        order_type: orderType || undefined,
        status: status || undefined,
        start_date: startDate ? startDate.toISOString() : undefined,
        end_date: endDate ? endDate.toISOString() : undefined,
        sort_by: sortState.key || undefined,
        sort_order: (sortState.dir === 'asc' || sortState.dir === 'desc') ? sortState.dir : undefined,
        limit: 1000,
      });
      setOrders(response.data);
    } finally {
      setLoading(false);
    }
  }, [getOrders, orderType, status, startDate, endDate, sortState]);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  const tableMap = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  const columns = useMemo<DataTableColumn<OrderEntity>[]>(
    () => [
      {
        key: 'order_type',
        label: t('order.type', 'Type'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => row.order_type || 'dine_in',
      },
      {
        key: 'status',
        label: t('order.status', 'Status'),
        sortable: true,
        filter: { type: 'multi', options: Object.keys(statusColorMap) },
        width: '1fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => row.status || 'open',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value || 'open');
          return (
            <Chip
              size="small"
              label={status}
              color={statusColorMap[status] || 'default'}
              sx={{ textTransform: 'capitalize', m: 1 }}
            />
          );
        },
      },
      {
        key: 'table_id',
        label: t('order.table', 'Table'),
        sortable: true,
        width: '1.5fr',
        align: 'left' as const,
        getValue: (row: OrderEntity) => (row.table_id ? tableLabel(tableMap.get(row.table_id)) : '-'),
      },
      {
        key: 'scheduled_at',
        label: t('order.scheduledAt', 'Scheduled'),
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
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setActiveRange('day');
    reloadOrders();
  }, [reloadOrders]);

  // Apply range changes
  const applyRange = useCallback((range: 'day' | 'week' | 'month' | 'year') => {
    const today = dayjs();
    let nextStart = today.startOf('day');
    let nextEnd = today.endOf('day');

    switch (range) {
      case 'day':
        nextStart = today.startOf('day');
        nextEnd = today.endOf('day');
        break;
      case 'week':
        nextStart = today.startOf('week');
        nextEnd = today.endOf('day');
        break;
      case 'month':
        nextStart = today.startOf('month');
        nextEnd = today.endOf('day');
        break;
      case 'year':
        nextStart = today.startOf('year');
        nextEnd = today.endOf('day');
        break;
    }

    setActiveRange(range);
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, []);

  // TODO: API search param for orders not confirmed — currently filtered client-side
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const orderType = (order.order_type || 'dine_in').toLowerCase();
      const orderStatus = (order.status || 'open').toLowerCase();
      const tableInfo = order.table_id ? tableLabel(tableMap.get(order.table_id)).toLowerCase() : '';

      return (
        orderType.includes(query) ||
        orderStatus.includes(query) ||
        tableInfo.includes(query)
      );
    });
  }, [orders, searchQuery, tableMap]);

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
        data={filteredOrders}
        getRowId={(row: OrderEntity) => String(row.id)}
        columns={columns}
        defaultConfig={defaultConfig}
        onReset={handleReset}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSortChange={(sort) => {
          setSortState({ key: sort.key, dir: sort.dir });
        }}
        onFiltersChange={(fs: Record<string, any>) => {
          const selectedOrderType = (fs.order_type?.value as string[])?.[0];
          const selectedStatus = (fs.status?.value as string[])?.[0];
          setOrderType(selectedOrderType || '');
          setStatus(selectedStatus || '');
          // Note: reloadOrders will be triggered by the useEffect watching orderType and status changes
        }}
        showPeriodPicker
        periodPickerProps={{
          startDate: startDate ? startDate.toDate() : null,
          endDate: endDate ? endDate.toDate() : null,
          onStartDateChange: (date: Date | null) => {
            setStartDate(date ? dayjs(date) : null);
            setActiveRange('day');
          },
          onEndDateChange: (date: Date | null) => {
            setEndDate(date ? dayjs(date) : null);
            setActiveRange('day');
          }
        }}
        showPeriodButtons
        periodButtonProps={{
          activePeriod: activeRange,
          onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
            applyRange(period);
          }
        }}
        emptyTitle="No orders found"
        emptySubtitle="Try adjusting filters or check back later."
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            href={paths.warehouse.orders.new}
            size="small"
          >
            {t('common.add', 'Add')}
          </Button>
        }
      />
    </DashboardContent>
  );
}

export default OrdersManagementView;
