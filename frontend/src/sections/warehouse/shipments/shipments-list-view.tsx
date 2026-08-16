import type { Shipment, ShipmentFilters, ShipmentBatchApiResponse } from 'src/types/shipments';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Chip,
  Table,
  Button,
  Dialog,
  MenuItem,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useShipmentsAPI } from 'src/hooks/use-shipments-api';
import {
  useStoragesList,
  useSuppliersList,
  useIngredientsList,
} from 'src/hooks/use-reference-data';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { FILTER_SELECT_SX } from 'src/sections/common/data-table';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

const getTodayUtcBoundary = (endOfDay = false): string => {
  const now = dayjs();
  const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

// Remove empty-string UUID params before sending to API (backend 500s on invalid UUID format)
const cleanFilters = (filters: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );

// Reverse lookup: find ID (key) from name (value) in a map
const reverseMap = (map: Record<string, string>, name: string): string =>
  Object.entries(map).find(([, v]) => v === name)?.[0] ?? '';

const initialFilters: ShipmentFilters = {
  start_date: getTodayUtcBoundary(),
  end_date: getTodayUtcBoundary(true),
  storage_id: '',
  supplier_id: '',
  status: '',
  limit: 1000,
  offset: 0,
  sort_by: undefined,
  sort_order: undefined,
};

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const filterSelectSx = {
  ...FILTER_SELECT_SX,
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

const toPickerDate = (value?: string): dayjs.Dayjs | null =>
  value ? dayjs(value) : null;

export function ShipmentsListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const noDataText = t('noDataAvailable');

  const { getShipments, getShipmentById, deleteShipment } = useShipmentsAPI();

  // Shared reference data (SWR-deduped across views/mounts)
  const { storagesMap } = useStoragesList();
  const { suppliersMap } = useSuppliersList();
  const { ingredientsMap } = useIngredientsList();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<ShipmentFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<ShipmentFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<ShipmentBatchApiResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const isStoragesEmpty = Object.keys(storagesMap).length === 0;
  const isSuppliersEmpty = Object.keys(suppliersMap).length === 0;

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Update draftFilters with search
  useEffect(() => {
    setDraftFilters((prev) =>
      prev.search === debouncedSearchQuery ? prev : { ...prev, search: debouncedSearchQuery }
    );
  }, [debouncedSearchQuery]);

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

  const loadShipments = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setLoading(true);
      try {
        const cleanedFilters = cleanFilters(filters as Record<string, unknown>);
        const response = await getShipments(cleanedFilters as ShipmentFilters);
        setRows(response.data);
        setTotal(response.total);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters, getShipments]
  );

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  useEffect(() => {
    // Keep the previous object when nothing changed so `loadShipments`
    // isn't recreated (its effect would re-fetch the list for no reason).
    setFilters((prev) => {
      const next = { ...prev, ...draftFilters, offset: 0 };
      const changed = (Object.keys(next) as Array<keyof ShipmentFilters>).some(
        (key) => next[key] !== prev[key]
      );
      return changed ? next : prev;
    });
  }, [draftFilters]);

  const handleResetFilters = useCallback(() => {
    setDraftFilters(initialFilters);
    setSearchQuery('');
    setActivePeriod('day');
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'number',
        label: t('deductions.number'),
        sortable: true,
        width: '0.6fr',
        align: 'left' as const,
        getValue: (row: Shipment) => row?.number ?? '',
        renderCell: ({ row }: { row: Shipment }) => (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            py: 1.5, 
            px: 1,
            color: 'text.primary',
            fontSize: '0.875rem',
            fontWeight: 400
          }}>
            {row?.number || '-'}
          </Box>
        ),
      },
      {
        key: 'date',
        label: t('deductions.date'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: Shipment) =>
          row?.date ? new Date(row.date).toLocaleDateString() : '',
        renderCell: ({ row }: { row: Shipment }) => {
          const dateValue = row?.date ? new Date(row.date).toLocaleDateString() : '-';
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {dateValue}
            </Box>
          );
        },
      },
      {
        key: 'storage_id',
        label: t('deductions.storage'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Shipment) =>
          storagesMap[row.storage_id] || row.storage_id || '',
        renderCell: ({ row }: { row: Shipment }) => {
          const value = storagesMap[row.storage_id] || row.storage_id || '-';
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {value}
            </Box>
          );
        },
      },
      {
        key: 'supplier_id',
        label: t('invoices.supplier'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Shipment) =>
          suppliersMap[row.supplier_id] || row.supplier_id || '',
        renderCell: ({ row }: { row: Shipment }) => {
          const value = suppliersMap[row.supplier_id] || row.supplier_id || '-';
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {value}
            </Box>
          );
        },
      },
      {
        key: 'status',
        label: t('invoices.status'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: Shipment) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '');
          return (
            <Chip
              size="small"
              label={formatStatusLabel(status)}
              color={getStatusColor(status)}
              sx={{ textTransform: 'capitalize' }}
            />
          );
        },
      },
      {
        key: 'total_amount',
        label: t('invoices.totalAmount'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: Shipment) => Number(row?.total_amount || 0),
        renderCell: ({ value }: { value: unknown }) => {
          const numValue = Number(value ?? 0).toLocaleString();
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {numValue}
            </Box>
          );
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'paid_amount',
        label: t('invoices.paidAmount'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: Shipment) => Number(row?.paid_amount || 0),
        renderCell: ({ value }: { value: unknown }) => {
          const numValue = Number(value ?? 0).toLocaleString();
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {numValue}
            </Box>
          );
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'actions',
        label: t('common.actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: Shipment }) => (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center', 
            py: 1.5, 
            px: 1
          }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                router.push(paths.warehouse.shipments.edit(String(row.id)));
              }}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                }
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(row.id);
              }}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                  color: 'error.dark'
                }
              }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [storagesMap, suppliersMap, t, router, openViewModal]
  );

  const startDateValue = useMemo(
    () => toPickerDate(draftFilters.start_date),
    [draftFilters.start_date]
  );
  const endDateValue = useMemo(() => toPickerDate(draftFilters.end_date), [draftFilters.end_date]);

  return (
    <>
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
          persistKey="warehouse-shipments"
          data={rows}
          getRowId={(row: Shipment) => String(row?.id)}
          columns={columns}
          search={{
            value: searchQuery,
            onChange: (value: string) => {
              setSearchQuery(value);
            },
          }}
          onSortChange={(sort) => {
            setDraftFilters((prev) => ({
              ...prev,
              sort_by: sort.key ?? undefined,
              sort_order: (sort.dir as 'asc' | 'desc' | undefined) ?? undefined,
              offset: 0,
            }));
          }}
          toolbarActions={
            <>
              <TextField
                select size="small" label={t('deductions.storage')}
                value={draftFilters.storage_id}
                onChange={(e) => setDraftFilters((p) => ({ ...p, storage_id: e.target.value, offset: 0 }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">All</MenuItem>
                {Object.entries(storagesMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label={t('invoices.supplier')}
                value={draftFilters.supplier_id}
                onChange={(e) => setDraftFilters((p) => ({ ...p, supplier_id: e.target.value, offset: 0 }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">All</MenuItem>
                {Object.entries(suppliersMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label={t('invoices.status')}
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value, offset: 0 }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">All</MenuItem>
                {['active', 'draft', 'deleted'].map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                ))}
              </TextField>
            </>
          }
          periodFilter={{
            startDate: startDateValue ? startDateValue.toDate() : null,
            endDate: endDateValue ? endDateValue.toDate() : null,
            onStartDateChange: (date: Date | null) => {
              setDraftFilters((prev) => ({
                ...prev,
                start_date: date ? toUtcDayBoundary(dayjs(date)) : '',
              }));
            },
            onEndDateChange: (date: Date | null) => {
              setDraftFilters((prev) => ({
                ...prev,
                end_date: date ? toUtcDayBoundary(dayjs(date), true) : '',
              }));
            },
            activePeriod,
            onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
              setActivePeriod(period);
              const now = new Date();
              let startDate = '';
              let endDate = '';

              switch (period) {
                case 'day':
                  startDate = toUtcDayBoundary(dayjs());
                  endDate = toUtcDayBoundary(dayjs(), true);
                  break;
                case 'week': {
                  const weekStart = new Date(now);
                  weekStart.setDate(now.getDate() - now.getDay());
                  startDate = toUtcDayBoundary(dayjs(weekStart));
                  endDate = toUtcDayBoundary(dayjs(), true);
                  break;
                }
                case 'month': {
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  startDate = toUtcDayBoundary(dayjs(monthStart));
                  endDate = toUtcDayBoundary(dayjs(), true);
                  break;
                }
                case 'year': {
                  const yearStart = new Date(now.getFullYear(), 0, 1);
                  startDate = toUtcDayBoundary(dayjs(yearStart));
                  endDate = toUtcDayBoundary(dayjs(), true);
                  break;
                }
                default:
                  break;
              }

              setDraftFilters((prev) => ({
                ...prev,
                start_date: startDate,
                end_date: endDate,
              }));
            }
          }}
          defaultConfig={{
            order: ['number', 'date', 'storage_id', 'supplier_id', 'status', 'total_amount', 'paid_amount', 'actions'],
            visibility: {
              number: true,
              date: true,
              storage_id: true,
              supplier_id: true,
              status: true,
              total_amount: true,
              paid_amount: true,
              actions: true,
            },
            widths: {
              number: '0.6fr',
              date: '1fr',
              storage_id: '1.2fr',
              supplier_id: '1.2fr',
              status: '0.8fr',
              total_amount: '1fr',
              paid_amount: '1fr',
              actions: '0.7fr',
            },
          }}
          onReset={handleResetFilters}
          onRowClick={(row: Shipment) => openViewModal(String(row.id))}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              component={RouterLink}
              href={paths.warehouse.shipments.new}
              size="small"
            >
              {t('common.add')}
            </Button>
          }
        />
      </DashboardContent>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!deleteId) return;
              await deleteShipment(deleteId);
              setDeleteId(null);
              await loadShipments({ silent: true });
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <GenericViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        title={t('overview.warehouse.shipments')}
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
                      <TableCell>{t('deductions.number')}</TableCell>
                      <TableCell>{t('deductions.date')}</TableCell>
                      <TableCell>{t('deductions.status')}</TableCell>
                      <TableCell>{t('deductions.storage')}</TableCell>
                      <TableCell>{t('invoices.supplier')}</TableCell>
                      <TableCell>{t('deductions.description')}</TableCell>
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

              {items.length === 0 ? (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noData')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={items.map((item, index) => ({ ...item, rowIndex: index + 1 }))}
                    getRowId={(row) => row.id || String(row.rowIndex)}
                    columns={[
                      { field: 'rowIndex', headerName: '#', width: 50 },
                      { field: 'ingredient_id', headerName: t('warehouse.ingredient'), flex: 1, renderCell: (params: any) => ingredientsMap[params.value] || params.value },
                      { field: 'quantity', headerName: t('calculation.quantity'), width: 100 },
                      { field: 'price_per_unit', headerName: t('shipments.pricePerUnit'), width: 150 },
                      { field: 'total_amount', headerName: t('shipments.total'), width: 150 },
                      { field: 'stock_before', headerName: t('shipments.stockBefore'), width: 120 },
                      { field: 'stock_after', headerName: t('shipments.stockAfter'), width: 120 },
                    ]}
                    autoHeight
                    disableRowSelectionOnClick
                    disableColumnFilter
                    disableColumnMenu
                    disableColumnSelector
                    disableDensitySelector
                    hideFooterSelectedRowCount
                    pagination
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 50 },
                      },
                    }}
                    sx={{
                      '& .MuiDataGrid-toolbarContainer, & .MuiDataGrid-toolbarContainer button': {
                        display: 'none !important',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'background.paper',
                      },
                      '& .MuiDataGrid-menuIcon': {
                        display: 'none !important',
                      },
                      '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
                        outline: 'none !important',
                      },
                      '& .MuiDataGrid-columnSeparator': {
                        display: 'none',
                      },
                    }}
                    slots={{
                      toolbar: () => null,
                      columnMenu: () => null,
                    }}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                <Typography variant="body2">
                  <strong>{t('shipments.total')}:</strong> {totalAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('shipments.paid')}:</strong> {paidAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('deductions.balance')}:</strong> {balance.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />
    </>
  );
}
