import type { GridColDef } from '@mui/x-data-grid';
import type { Shipment, ShipmentFilters, ShipmentBatchApiResponse } from 'src/types/shipments';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import {
  Box,
  Table,
  Button,
  Dialog,
  TableRow,
  TextField,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useShipmentsAPI } from 'src/hooks/use-shipments-api';

import { useRouter } from 'src/routes/hooks';

import { fetcher, endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

const getTodayUtcBoundary = (endOfDay = false): string => {
  const now = dayjs();
  const date = new Date(
    Date.UTC(
      now.year(),
      now.month(),
      now.date(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0
    )
  );

  return date.toISOString().replace('.000Z', 'Z');
};

const initialFilters: ShipmentFilters = {
  start_date: getTodayUtcBoundary(),
  end_date: getTodayUtcBoundary(true),
  storage_id: '',
  supplier_id: '',
  status: '',
  limit: 20,
  offset: 0,
};

interface Ingredient {
  id: string;
  name: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const date = new Date(
    Date.UTC(
      value.year(),
      value.month(),
      value.date(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0
    )
  );

  return date.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (value?: string): dayjs.Dayjs | null =>
  value ? dayjs(value.slice(0, 10)) : null;

export function ShipmentsListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();

  const { getShipments, getShipmentById, deleteShipment } = useShipmentsAPI();
  const { getStorages } = useStorageAPI();
  const { getSuppliers } = useSupplierAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);

  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [suppliersMap, setSuppliersMap] = useState<Record<string, string>>({});
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState<ShipmentFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<ShipmentFilters>(initialFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<ShipmentBatchApiResponse | null>(null);

  const openViewModal = useCallback(
    async (shipmentId: string) => {
      setViewOpen(true);
      setViewLoading(true);
      try {
        const details = await getShipmentById(shipmentId);
        setViewData(details);
      } finally {
        setViewLoading(false);
      }
    },
    [getShipmentById]
  );

  const loadBaseData = useCallback(async () => {
    const [storagesData, suppliersData, ingredientsData] = await Promise.all([
      getStorages(),
      getSuppliers(),
      fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list).catch(() => ({
        status: 'error',
        message: 'failed',
        data: [],
        code: 500,
      })),
    ]);

    setStoragesMap(
      (storagesData || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      )
    );

    setSuppliersMap(
      (suppliersData || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      )
    );

    setIngredientsMap(
      (ingredientsData.data || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      )
    );
  }, [getStorages, getSuppliers]);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getShipments(filters);
      setRows(response.data);
      setTotal(response.total);
    } finally {
      setLoading(false);
    }
  }, [filters, getShipments]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // Auto-apply filters when draftFilters changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      offset: 0,
    }));
  }, [draftFilters]);

  const handleApplyFilters = useCallback(() => {
    // This function is now handled automatically by the useEffect above
  }, []);

  const handleResetFilters = useCallback(() => {
    setDraftFilters(initialFilters);
  }, []);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'number',
        headerName: t('deductions.number', 'Number'),
        width: 90,
      },
      {
        field: 'date',
        headerName: t('deductions.date', 'Date'),
        width: 130,
        renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
      },
      {
        field: 'storage_id',
        headerName: t('deductions.storage', 'Storage'),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => storagesMap[params.row.storage_id] || params.row.storage_id,
      },
      {
        field: 'supplier_id',
        headerName: t('invoices.name', 'Supplier'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => suppliersMap[params.row.supplier_id] || params.row.supplier_id,
      },
      {
        field: 'status',
        headerName: t('invoices.status', 'Status'),
        width: 120,
        renderCell: (params) => {
          const status = params.row.status?.toLowerCase();
          let color = 'default';
          if (status === 'draft') color = 'default';
          if (status === 'active') color = 'success';
          if (status === 'deleted') color = 'error';
          return (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 700,
                marginTop: '10px',
                marginBottom: '10px',
                backgroundColor:
                  color === 'warning'
                    ? '#FFF3CD'
                    : color === 'success'
                      ? '#D4EDDA'
                      : color === 'error'
                        ? '#F8D7DA'
                        : '#E2E3E5',
                color:
                  color === 'warning'
                    ? '#856404'
                    : color === 'success'
                      ? '#155724'
                      : color === 'error'
                        ? '#721C24'
                        : '#383D41',
              }}
            >
              {status}
            </span>
          );
        },
      },
      {
        field: 'total_amount',
        headerName: t('invoices.totalAmount', 'Total amount'),
        width: 140,
        renderCell: (params) => Number(params.row.total_amount || 0).toLocaleString(),
      },
      {
        field: 'paid_amount',
        headerName: t('invoices.paidAmount', 'Paid amount'),
        width: 130,
        renderCell: (params) => Number(params.row.paid_amount || 0).toLocaleString(),
      },
      // {
      //   field: 'description',
      //   headerName: t('deductions.description', 'Description'),
      //   flex: 1,
      //   minWidth: 220,
      // },
      {
        type: 'actions',
        field: 'actions',
        headerName: t('common.actions', 'Actions'),
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            key="edit"
            icon={<Iconify icon="solar:pen-bold" />}
            label={t('common.edit', 'Edit')}
            onClick={() => router.push(paths.warehouse.shipments.edit(String(params.row.id)))}
          />,
          <CustomGridActionsCellItem
            key="delete"
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            label={t('common.delete', 'Delete')}
            style={{ color: '#FB6633' }}
            onClick={() => setDeleteId(params.row.id)}
          />,
        ],
      },
    ],
    [storagesMap, suppliersMap, t, router]
  );

  const startDateValue = useMemo(
    () => toPickerDate(draftFilters.start_date),
    [draftFilters.start_date]
  );
  const endDateValue = useMemo(() => toPickerDate(draftFilters.end_date), [draftFilters.end_date]);

  return (
    <>
      <GenericTableView
        data={rows}
        columns={columns}
        loading={loading}
        onRowClick={(rowId) => openViewModal(String(rowId))}
        renderFilters={() => (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            <DatePicker
              label={t('ingredientReports.startDate', 'Start date')}
              value={startDateValue}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  start_date: value ? toUtcDayBoundary(value) : '',
                }))
              }
              format="DD.MM.YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  inputProps: { readOnly: true },
                  sx: { cursor: 'pointer' },
                },
              }}
            />
            <DatePicker
              label={t('ingredientReports.endDate', 'End date')}
              value={endDateValue}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  end_date: value ? toUtcDayBoundary(value, true) : '',
                }))
              }
              format="DD.MM.YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  inputProps: { readOnly: true },
                  sx: { cursor: 'pointer' },
                },
              }}
            />
            <TextField
              select
              size="small"
              label={t('deductions.storage', 'Storage')}
              SelectProps={{ native: true }}
              value={draftFilters.storage_id || ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  storage_id: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('ingredientReports.all', 'All')}</option>
              {Object.entries(storagesMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t('invoices.name', 'Supplier')}
              SelectProps={{ native: true }}
              value={draftFilters.supplier_id || ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  supplier_id: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('ingredientReports.all', 'All')}</option>
              {Object.entries(suppliersMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t('deductions.status', 'Status')}
              SelectProps={{ native: true }}
              value={draftFilters.status || ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            >
              <option value="">{t('ingredientReports.all', 'All')}</option>
              <option value="active">{t('deductions.active', 'Active')}</option>
              <option value="draft">{t('common.draft', 'Draft')}</option>
              <option value="cancelled">{t('deductions.canceled', 'Canceled')}</option>
            </TextField>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={handleResetFilters}
                sx={{ flex: 1 }}
              >
                {t('ingredientReports.reset', 'Reset')}
              </Button>
            </Box>
          </Box>
        )}
        breadcrumbs={{
          heading: t('overview.warehouse.shipments', 'Shipments'),
          links: [
            { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
            { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
            { name: t('overview.warehouse.shipments', 'Shipments') },
          ],
        }}
        addButton={{
          label: t('common.add', 'Add'),
          href: paths.warehouse.shipments.new,
        }}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle', 'Confirm delete')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage', 'Are you sure?')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deleteId) return;
              await deleteShipment(deleteId);
              setDeleteId(null);
              await loadShipments();
            }}
          >
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <GenericViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        title={t('overview.warehouse.shipments', 'Shipments')}
        data={viewData}
        loading={viewLoading}
        position="right"
        slideDirection="left"
        maxWidth="lg"
        renderContent={(payload: ShipmentBatchApiResponse | null) => {
          const shipment = payload?.data?.shipment;
          const items = payload?.data?.items || [];
          if (!shipment) return null;

          const totalAmount = Number(shipment.total_amount || 0);
          const paidAmount = Number(shipment.paid_amount || 0);
          const balance = totalAmount - paidAmount;

          return (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('deductions.number', 'Number')}</TableCell>
                      <TableCell>{t('deductions.date', 'Date')}</TableCell>
                      <TableCell>{t('deductions.status', 'Status')}</TableCell>
                      <TableCell>{t('deductions.storage', 'Storage')}</TableCell>
                      <TableCell>{t('invoices.name', 'Supplier')}</TableCell>
                      <TableCell>{t('deductions.description', 'Description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{shipment.number}</TableCell>
                      <TableCell>{new Date(shipment.date).toLocaleString()}</TableCell>
                      <TableCell>{shipment.status}</TableCell>
                      <TableCell>
                        {storagesMap[shipment.storage_id] || shipment.storage_id}
                      </TableCell>
                      <TableCell>
                        {suppliersMap[shipment.supplier_id] || shipment.supplier_id}
                      </TableCell>
                      <TableCell>{shipment.description || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{t('warehouse.ingredient', 'Ingredient')}</TableCell>
                      <TableCell>{t('calculation.quantity', 'Qty')}</TableCell>
                      <TableCell>{t('shipments.pricePerUnit', 'Price / Unit')}</TableCell>
                      <TableCell>{t('shipments.total', 'Total')}</TableCell>
                      <TableCell>{t('shipments.stockBefore', 'Stock Before')}</TableCell>
                      <TableCell>{t('shipments.stockAfter', 'Stock After')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id || `${item.ingredient_id}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {ingredientsMap[item.ingredient_id] || item.ingredient_id}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price_per_unit}</TableCell>
                        <TableCell>{item.total_amount}</TableCell>
                        <TableCell>{item.stock_before}</TableCell>
                        <TableCell>{item.stock_after}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                <Typography variant="body2">
                  <strong>{t('shipments.total', 'Total')}:</strong> {totalAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('shipments.paid', 'Paid')}:</strong> {paidAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('deductions.balance', 'Balance')}:</strong> {balance.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />
    </>
  );
}
