import type { GridColDef } from '@mui/x-data-grid';
import type { OrderEntity } from 'src/types/orders';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Chip,
  Stack,
  Button,
  Dialog,
  TextField,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { useOrdersAPI } from 'src/hooks/use-orders-api';
import { paths } from 'src/routes/paths';
import { useGetCafeTables } from 'src/actions/cafe-tables';

import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { Iconify } from 'src/iconify';

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

const toISOFromLocal = (value: string): string | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.toISOString();
};

export function OrdersManagementView() {
  const { t } = useTranslation('menu');

  const { tables } = useGetCafeTables();
  const { getOrders, activateOrder, rescheduleOrder } = useOrdersAPI();

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleOrderId, setRescheduleOrderId] = useState('');
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [rescheduleComment, setRescheduleComment] = useState('');

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

  const handleActivate = useCallback(
    async (orderId: string) => {
      const updated = await activateOrder(orderId);
      if (updated) {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
      }
    },
    [activateOrder]
  );

  const openRescheduleDialog = useCallback((order: OrderEntity) => {
    setRescheduleOrderId(order.id);
    setRescheduleAt(order.scheduled_at ? dayjs(order.scheduled_at).format('YYYY-MM-DDTHH:mm') : '');
    setRescheduleComment(order.comment || '');
    setRescheduleOpen(true);
  }, []);

  const handleReschedule = useCallback(async () => {
    const iso = toISOFromLocal(rescheduleAt);
    if (!rescheduleOrderId || !iso) {
      return;
    }

    const updated = await rescheduleOrder(rescheduleOrderId, {
      scheduled_at: iso,
      comment: rescheduleComment || undefined,
    });

    if (updated) {
      setOrders((prev) => prev.map((order) => (order.id === rescheduleOrderId ? updated : order)));
      setRescheduleOpen(false);
      setRescheduleOrderId('');
      setRescheduleAt('');
      setRescheduleComment('');
    }
  }, [rescheduleAt, rescheduleComment, rescheduleOrderId, rescheduleOrder]);

  const tableMap = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  const columns = useMemo<GridColDef[]>(
    () => [
      // {
      //   field: 'id',
      //   headerName: 'ID',
      //   minWidth: 220,
      //   flex: 1,
      // },
      {
        field: 'order_type',
        headerName: t('order.type', 'Type'),
        flex: 1,
        width: 130,
        valueGetter: (_value, row) => row.order_type || 'dine_in',
      },
      {
        field: 'status',
        headerName: t('order.status', 'Status'),
        flex: 1,
        width: 130,
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
        flex: 0.5,
        minWidth: 170,
        valueGetter: (_value, row) => (row.scheduled_at ? dayjs(row.scheduled_at).format('DD.MM.YYYY HH:mm') : '-'),
      },
      // {
      //   type: 'actions',
      //   field: 'actions',
      //   headerName: t('actions', 'Actions'),
      //   width: 140,
      //   sortable: false,
      //   filterable: false,
      //   disableColumnMenu: true,
      //   getActions: (params) => {
      //     const order = params.row as OrderEntity;
      //     const status = String(order.status || '');
      //     const actions: React.ReactNode[] = [];

      //     if (status === 'reserved' || status === 'rescheduled') {
      //       actions.push(
      //         <CustomGridActionsCellItem
      //           key="activate"
      //           icon={<Iconify icon="solar:play-circle-bold" />}
      //           label="Activate"
      //           onClick={() => handleActivate(order.id)}
      //         />
      //       );
      //     }

      //     actions.push(
      //       <CustomGridActionsCellItem
      //         key="reschedule"
      //         icon={<Iconify icon="solar:calendar-date-bold" />}
      //         label="Reschedule"
      //         onClick={() => openRescheduleDialog(order)}
      //       />
      //     );

      //     return actions as any;
      //   },
      // },
    ],
    [t, handleActivate, openRescheduleDialog, tableMap]
  );

  return (
    <>
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

      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('order.reschedule', 'Reschedule order')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label={t('order.scheduledAt', 'Scheduled at')}
              value={rescheduleAt}
              onChange={(event) => setRescheduleAt(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('comment', 'Comment')}
              value={rescheduleComment}
              onChange={(event) => setRescheduleComment(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={() => setRescheduleOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleReschedule}>
            {t('order.reschedule', 'Reschedule')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default OrdersManagementView;
