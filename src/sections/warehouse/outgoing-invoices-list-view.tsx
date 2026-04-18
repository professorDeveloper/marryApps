import type {
  OutgoingInvoice,
  OutgoingInvoiceFilters,
  OutgoingInvoiceBatchApiResponse,
} from 'src/types/outgoing-invoices';

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
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useOutgoingInvoicesAPI } from 'src/hooks/use-outgoing-invoices-api';

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

const initialFilters: OutgoingInvoiceFilters = {
  start_date: getTodayUtcBoundary(),
  end_date: getTodayUtcBoundary(true),
  storage_id: '',
  group_id: '',
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

export function OutgoingInvoicesListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

  const { getOutgoingInvoices, getOutgoingInvoiceById, deleteOutgoingInvoice } = useOutgoingInvoicesAPI();
  const { getStorages } = useStorageAPI();
  const { getDeductionGroups } = useDeductionsAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OutgoingInvoice[]>([]);
  const [total, setTotal] = useState(0);

  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState<OutgoingInvoiceFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<OutgoingInvoiceFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<OutgoingInvoiceBatchApiResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const isStoragesEmpty = Object.keys(storagesMap).length === 0;
  const isGroupsEmpty = Object.keys(groupsMap).length === 0;

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

  const openViewModal = useCallback(async (outgoingInvoiceId: string) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const details = await getOutgoingInvoiceById(outgoingInvoiceId);
      setViewData(details);
    } finally {
      setViewLoading(false);
    }
  }, [getOutgoingInvoiceById]);

  const loadBaseData = useCallback(async () => {
    const [storagesData, groupsData, ingredientsData] = await Promise.all([
      getStorages(),
      getDeductionGroups(),
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

    setGroupsMap(
      (groupsData || []).reduce(
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
  }, [getStorages, getDeductionGroups]);

  const loadOutgoingInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const cleanedFilters = cleanFilters(filters as Record<string, unknown>);
      const response = await getOutgoingInvoices(cleanedFilters as OutgoingInvoiceFilters);
      setRows(response.data);
      setTotal(response.total);
    } finally {
      setLoading(false);
    }
  }, [filters, getOutgoingInvoices]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadOutgoingInvoices();
  }, [loadOutgoingInvoices]);

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
        getValue: (row: OutgoingInvoice) => row?.number ?? '',
        renderCell: ({ row }: { row: OutgoingInvoice }) => (
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
        getValue: (row: OutgoingInvoice) =>
          row?.date ? new Date(row.date).toLocaleDateString() : '',
        renderCell: ({ row }: { row: OutgoingInvoice }) => {
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
        getValue: (row: OutgoingInvoice) =>
          storagesMap[row.storage_id] || row.storage_id || '',
        renderCell: ({ row }: { row: OutgoingInvoice }) => {
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
        key: 'group_id',
        label: t('outgoingInvoices.group', 'Group'),
        sortable: true,
        filter: { type: 'multi' as const, options: Object.values(groupsMap) },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: OutgoingInvoice) =>
          groupsMap[row.group_id] || row.group_id || '',
        renderCell: ({ row }: { row: OutgoingInvoice }) => {
          const value = groupsMap[row.group_id] || row.group_id || '-';
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
        label: t('deductions.status', 'Status'),
        sortable: true,
        filter: { type: 'multi' as const, options: ['active', 'draft', 'cancelled'] },
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: OutgoingInvoice) => row?.status || '',
        renderCell: ({ row }: { row: OutgoingInvoice }) => {
          const status = row?.status || '-';
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
              {status}
            </Box>
          );
        },
      },
      {
        key: 'total_amount',
        label: t('outgoingInvoices.totalAmount', 'Total amount'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: OutgoingInvoice) => Number(row?.total_amount || 0),
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
        renderCell: ({ row }: { row: OutgoingInvoice }) => (
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
                router.push(paths.warehouse.outgoingInvoices.edit(String(row.id)));
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
    [storagesMap, groupsMap, t, router, openViewModal]
  );

  const startDateValue = useMemo(() => toPickerDate(draftFilters.start_date), [draftFilters.start_date]);
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
          persistKey="warehouse-outgoing-invoices"
          data={rows}
          getRowId={(row: OutgoingInvoice) => String(row?.id)}
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
            const groupName = (fs.group_id?.value as string[])?.[0];
            const statusValue = (fs.status?.value as string[])?.[0];
            setDraftFilters((prev) => ({
              ...prev,
              storage_id: storageName ? reverseMap(storagesMap, storageName) : '',
              group_id: groupName ? reverseMap(groupsMap, groupName) : '',
              status: statusValue || '',
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
            order: ['number', 'date', 'storage_id', 'group_id', 'status', 'total_amount', 'actions'],
            visibility: {
              number: true,
              date: true,
              storage_id: true,
              group_id: true,
              status: true,
              total_amount: true,
              actions: true,
            },
            widths: {
              number: '0.6fr',
              date: '1fr',
              storage_id: '1.2fr',
              group_id: '1.2fr',
              status: '0.8fr',
              total_amount: '1fr',
              actions: '0.7fr',
            },
          }}
          onReset={handleResetFilters}
          onRowClick={(row: OutgoingInvoice) => openViewModal(String(row.id))}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              href={paths.warehouse.outgoingInvoices.new}
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
              await deleteOutgoingInvoice(deleteId);
              setDeleteId(null);
              await loadOutgoingInvoices();
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
        title={t('overview.warehouse.expensesInvoices', 'Expenses invoices')}
        data={viewData}
        loading={viewLoading}
        position="right"
        slideDirection="left"
        maxWidth="lg"
        renderContent={(payload: OutgoingInvoiceBatchApiResponse | null) => {
          const outgoingInvoice = payload?.data?.invoice;
          const items = payload?.data?.items || [];
          if (!outgoingInvoice) return null;

          const totalAmount = Number(outgoingInvoice.total_amount || 0);

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
                      <TableCell>{t('outgoingInvoices.group', 'Group')}</TableCell>
                      <TableCell>{t('deductions.description', 'Description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{outgoingInvoice.number}</TableCell>
                      <TableCell>{new Date(outgoingInvoice.date).toLocaleString()}</TableCell>
                      <TableCell>{outgoingInvoice.status}</TableCell>
                      <TableCell>{storagesMap[outgoingInvoice.storage_id] || outgoingInvoice.storage_id}</TableCell>
                      <TableCell>{groupsMap[outgoingInvoice.group_id] || outgoingInvoice.group_id}</TableCell>
                      <TableCell>{outgoingInvoice.description || '-'}</TableCell>
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
                      <TableCell>{t('outgoingInvoices.pricePerUnit', 'Price / Unit')}</TableCell>
                      <TableCell>{t('outgoingInvoices.total', 'Total')}</TableCell>
                      <TableCell>{t('outgoingInvoices.stockBefore', 'Stock Before')}</TableCell>
                      <TableCell>{t('outgoingInvoices.stockAfter', 'Stock After')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id || `${item.ingredient_id}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{ingredientsMap[item.ingredient_id] || item.ingredient_id}</TableCell>
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
                  <strong>{t('outgoingInvoices.total', 'Total')}:</strong> {totalAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />
    </>
  );
}
