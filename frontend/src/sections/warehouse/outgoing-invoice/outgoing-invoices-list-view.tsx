import type {
  OutgoingInvoice,
  OutgoingInvoiceFilters,
  OutgoingInvoiceBatchApiResponse,
} from 'src/types/outgoing-invoices';

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

import { useOutgoingInvoicesAPI } from 'src/hooks/use-outgoing-invoices-api';
import {
  useStoragesList,
  useDeductionGroups,
  useIngredientsList,
} from 'src/hooks/use-reference-data';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

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

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (value?: string): dayjs.Dayjs | null =>
  value ? dayjs(value) : null;

const filterSelectSx = {
  minWidth: 150,
  '& .MuiInputBase-root': {
    height: 36,
    fontSize: 13.5,
    backgroundColor: 'var(--bg2)',
    borderRadius: '6px',
    fontFamily: 'var(--font-sans)',
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
  '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
  '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--brand)',
    boxShadow: '0 0 0 2px var(--accent-soft)',
  },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

export function OutgoingInvoicesListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const noDataText = t('noDataAvailable');

  const { getOutgoingInvoices, getOutgoingInvoiceById, deleteOutgoingInvoice } = useOutgoingInvoicesAPI();

  // Shared reference data (SWR-deduped across views/mounts)
  const { storagesMap } = useStoragesList();
  const { groupsMap } = useDeductionGroups();
  const { ingredientsMap } = useIngredientsList();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OutgoingInvoice[]>([]);
  const [total, setTotal] = useState(0);

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
    setDraftFilters((prev) =>
      prev.search === debouncedSearchQuery ? prev : { ...prev, search: debouncedSearchQuery }
    );
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

  const loadOutgoingInvoices = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setLoading(true);
      try {
        const cleanedFilters = cleanFilters(filters as Record<string, unknown>);
        const response = await getOutgoingInvoices(cleanedFilters as OutgoingInvoiceFilters);
        setRows(response.data);
        setTotal(response.total);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters, getOutgoingInvoices]
  );

  useEffect(() => {
    loadOutgoingInvoices();
  }, [loadOutgoingInvoices]);

  useEffect(() => {
    // Keep the previous object when nothing changed so `loadOutgoingInvoices`
    // isn't recreated (its effect would re-fetch the list for no reason).
    setFilters((prev) => {
      const next = { ...prev, ...draftFilters, offset: 0 };
      const changed = (Object.keys(next) as Array<keyof OutgoingInvoiceFilters>).some(
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
        label: t('deductions.date'),
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
        label: t('deductions.storage'),
        sortable: true,
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
        label: t('outgoingInvoices.group'),
        sortable: true,
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
        label: t('deductions.status'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: OutgoingInvoice) => row?.status || '',
        renderCell: ({ row }: { row: OutgoingInvoice }) => {
          const status = String(row?.status ?? '');
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
        label: t('outgoingInvoices.totalAmount'),
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
        label: t('common.actions'),
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
                <MenuItem value="">{t('common.all')}</MenuItem>
                {Object.entries(storagesMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label={t('outgoingInvoices.group')}
                value={draftFilters.group_id}
                onChange={(e) => setDraftFilters((p) => ({ ...p, group_id: e.target.value, offset: 0 }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {Object.entries(groupsMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label={t('deductions.status')}
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value, offset: 0 }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {['active', 'draft', 'cancelled'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
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
              component={RouterLink}
              href={paths.warehouse.outgoingInvoices.new}
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
              await deleteOutgoingInvoice(deleteId);
              setDeleteId(null);
              await loadOutgoingInvoices({ silent: true });
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
        title={t('overview.warehouse.expensesInvoices')}
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
                      <TableCell>{t('deductions.number')}</TableCell>
                      <TableCell>{t('deductions.date')}</TableCell>
                      <TableCell>{t('deductions.status')}</TableCell>
                      <TableCell>{t('deductions.storage')}</TableCell>
                      <TableCell>{t('outgoingInvoices.group')}</TableCell>
                      <TableCell>{t('deductions.description')}</TableCell>
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
                      { field: 'price_per_unit', headerName: t('outgoingInvoices.pricePerUnit'), width: 150 },
                      { field: 'total_amount', headerName: t('outgoingInvoices.total'), width: 150 },
                      { field: 'stock_before', headerName: t('outgoingInvoices.stockBefore'), width: 120 },
                      { field: 'stock_after', headerName: t('outgoingInvoices.stockAfter'), width: 120 },
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
                  <strong>{t('outgoingInvoices.total')}:</strong> {totalAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />
    </>
  );
}
