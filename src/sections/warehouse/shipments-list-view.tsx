import type { Shipment, ShipmentFilters, ShipmentBatchApiResponse } from 'src/types/shipments';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Table,
  Button,
  Dialog,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useShipmentsAPI } from 'src/hooks/use-shipments-api';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

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
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

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
    setDraftFilters((prev) => ({
      ...prev,
      search: debouncedSearchQuery,
    }));
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
      const cleanedFilters = cleanFilters(filters as Record<string, unknown>);
      const response = await getShipments(cleanedFilters as ShipmentFilters);
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

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      offset: 0,
    }));
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
        label: t('deductions.number', 'Number'),
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
        label: t('deductions.date', 'Date'),
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
        label: t('deductions.storage', 'Storage'),
        sortable: true,
        filter: { type: 'multi' as const, options: Object.values(storagesMap) },
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
        label: t('invoices.name', 'Supplier'),
        sortable: true,
        filter: { type: 'multi' as const, options: Object.values(suppliersMap) },
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
        label: t('invoices.status', 'Status'),
        sortable: true,
        filter: { type: 'multi' as const, options: ['active', 'draft', 'deleted'] },
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: Shipment) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '').toLowerCase();
          let bgColor = '#E2E3E5';
          let textColor = '#383D41';
          if (status === 'active') { bgColor = '#D4EDDA'; textColor = '#155724'; }
          if (status === 'deleted') { bgColor = '#F8D7DA'; textColor = '#721C24'; }
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1
            }}>
              <Box
                sx={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: bgColor,
                  color: textColor,
                }}
              >
                {status}
              </Box>
            </Box>
          );
        },
      },
      {
        key: 'total_amount',
        label: t('invoices.totalAmount', 'Total amount'),
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
        label: t('invoices.paidAmount', 'Paid amount'),
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
        label: t('common.actions', 'Actions'),
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
          searchValue={searchQuery}
          onSearchChange={(value: string) => {
            setSearchQuery(value);
          }}
          onSortChange={(sort) => {
            setDraftFilters((prev) => ({
              ...prev,
              sort_by: sort.key ?? undefined,
              sort_order: (sort.dir as 'asc' | 'desc' | undefined) ?? undefined,
              offset: 0,
            }));
          }}
          onFiltersChange={(fs: Record<string, any>) => {
            const storageName = (fs.storage_id?.value as string[])?.[0];
            const supplierName = (fs.supplier_id?.value as string[])?.[0];
            setDraftFilters((prev) => ({
              ...prev,
              storage_id: storageName ? reverseMap(storagesMap, storageName) : '',
              supplier_id: supplierName ? reverseMap(suppliersMap, supplierName) : '',
              offset: 0,
            }));
          }}
          showPeriodPicker
          periodPickerProps={{
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
            }
          }}
          showPeriodButtons
          periodButtonProps={{
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
                case 'week':
                  const weekStart = new Date(now);
                  weekStart.setDate(now.getDate() - now.getDay());
                  startDate = toUtcDayBoundary(dayjs(weekStart));
                  endDate = toUtcDayBoundary(dayjs(), true);
                  break;
                case 'month':
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  startDate = toUtcDayBoundary(dayjs(monthStart));
                  endDate = toUtcDayBoundary(dayjs(), true);
                  break;
                case 'year':
                  const yearStart = new Date(now.getFullYear(), 0, 1);
                  startDate = toUtcDayBoundary(dayjs(yearStart));
                  endDate = toUtcDayBoundary(dayjs(), true);
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
              href={paths.warehouse.shipments.new}
              size="small"
            >
              {t('common.add', 'Add')}
            </Button>
          }
        />
      </DashboardContent>

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
