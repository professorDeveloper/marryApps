import type { GridColDef } from '@mui/x-data-grid';
import type { OrderEntity } from 'src/types/orders';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@mui/material';

import { useOrdersAPI } from 'src/hooks/use-orders-api';
import { paths } from 'src/routes/paths';
import { useGetCafeTables } from 'src/actions/cafe-tables';

import { GenericTableView } from 'src/components/generic-table-view';

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

  const reloadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders();
      setOrders(response.data);
    } finally {
      setLoading(false);
    }
  }, [getOrders]);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  const tableMap = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'order_type',
        headerName: t('order.type', 'Type'),
        width: 130,
        flex: 1,
        valueGetter: (_value, row) => row.order_type || 'dine_in',
      },
      {
        field: 'status',
        headerName: t('order.status', 'Status'),
        width: 130,
        flex: 1,
        renderCell: (params) => {
          const status = String(params.row.status || 'open');
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
        field: 'table_id',
        headerName: t('order.table', 'Table'),
        minWidth: 190,
        flex: 1,
        valueGetter: (_value, row) => (row.table_id ? tableLabel(tableMap.get(row.table_id)) : '-'),
      },
      {
        field: 'scheduled_at',
        headerName: t('order.scheduledAt', 'Scheduled'),
        minWidth: 170,
        flex: 1,
        valueGetter: (_value, row) => (row.scheduled_at ? dayjs(row.scheduled_at).format('DD.MM.YYYY HH:mm') : '-'),
      },
    ],
    [t, tableMap]
  );

  return (
    <GenericTableView
      data={orders}
      loading={loading}
      columns={columns}
      hideCheckboxes
      hideFilters
      breadcrumbs={{
        heading: t('overview.warehouse.orders', 'Order Management'),
        links: [
          { name: t('app', 'App'), href: paths.menu.root },
          { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
          { name: t('overview.warehouse.orders', 'Order Management') },
        ],
      }}
      addButton={{
        label: t('order.create', 'Create order'),
        href: paths.warehouse.orders.new,
      }}
    />
  );
}

export default OrdersManagementView;
