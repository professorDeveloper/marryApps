import type {
  SeparationAct,
  SeparationActFilters,
  SeparationActBatchApiResponse,
} from 'src/types/separation-acts';

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
  TableRow,
  MenuItem,
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

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useSeparationActsAPI } from 'src/hooks/use-separation-acts-api';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';

import { fetcher, endpoints } from 'src/lib/axios';
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

const initialFilters: SeparationActFilters = {
  start_date: getTodayUtcBoundary(),
  end_date: getTodayUtcBoundary(true),
  storage_id: '',
  group_id: '',
  ingredient_id: '',
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
  const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (value?: string): dayjs.Dayjs | null =>
  value ? dayjs(value) : null;

const filterSelectSx = {
  ...FILTER_SELECT_SX,
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

export function SeparationActsListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const noDataText = t('noDataAvailable');

  const { getSeparationActs, getSeparationActById, deleteSeparationAct } = useSeparationActsAPI();
  const { getStorages } = useStorageAPI();
  const { getDeductionGroups } = useDeductionsAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SeparationAct[]>([]);

  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState<SeparationActFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<SeparationActFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<SeparationActBatchApiResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const isStoragesEmpty = Object.keys(storagesMap).length === 0;
  const isGroupsEmpty = Object.keys(groupsMap).length === 0;
  const isIngredientsEmpty = Object.keys(ingredientsMap).length === 0;

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

  const openViewModal = useCallback(async (separationActId: string) => {
    setViewOpen(true);
    setViewLoading(true);
    try {
      const details = await getSeparationActById(separationActId);
      setViewData(details);
    } finally {
      setViewLoading(false);
    }
  }, [getSeparationActById]);

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

  const loadSeparationActs = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) setLoading(true);
      try {
        const cleanedFilters = cleanFilters(filters as Record<string, unknown>);
        const response = await getSeparationActs(cleanedFilters as SeparationActFilters);
        setRows(response.data);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters, getSeparationActs]
  );

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadSeparationActs();
  }, [loadSeparationActs]);

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
        label: t('deductions.number'),
        sortable: true,
        width: '0.6fr',
        align: 'left' as const,
        getValue: (row: SeparationAct) => row?.number ?? '',
      },
      {
        key: 'date',
        label: t('deductions.date'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: SeparationAct) =>
          row?.date ? new Date(row.date).toLocaleDateString() : '',
      },
      {
        key: 'source_ingredient_id',
        label: t('separationActs.sourceIngredient'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: SeparationAct) =>
          ingredientsMap[row.source_ingredient_id] || row.source_ingredient_id || '',
      },
      {
        key: 'storage_id',
        label: t('deductions.storage'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: SeparationAct) =>
          storagesMap[row.storage_id] || row.storage_id || '',
      },
      {
        key: 'group_id',
        label: t('outgoingInvoices.group'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: SeparationAct) =>
          groupsMap[row.group_id] || row.group_id || '',
      },
      {
        key: 'status',
        label: t('deductions.status'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: SeparationAct) => row?.status || '',
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
        label: t('outgoingInvoices.totalAmount'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: SeparationAct) => Number(row?.total_amount || 0),
        renderCell: ({ value }: { value: unknown }) =>
          Number(value ?? 0).toLocaleString(),
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'actions',
        label: t('common.actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: SeparationAct }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                router.push(paths.warehouse.separationActs.edit(String(row.id)));
              }}
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(row.id);
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [storagesMap, groupsMap, ingredientsMap, t, router, openViewModal]
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
          persistKey="warehouse-separation-acts"
          data={rows}
          getRowId={(row: SeparationAct) => String(row?.id)}
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
          onFiltersChange={(fs: Record<string, any>) => {
            const ingredientName = (fs.source_ingredient_id?.value as string[])?.[0];
            const storageName = (fs.storage_id?.value as string[])?.[0];
            const groupName = (fs.group_id?.value as string[])?.[0];
            const statusValue = (fs.status?.value as string[])?.[0];
            setDraftFilters((prev) => ({
              ...prev,
              ingredient_id: ingredientName ? reverseMap(ingredientsMap, ingredientName) : '',
              storage_id: storageName ? reverseMap(storagesMap, storageName) : '',
              group_id: groupName ? reverseMap(groupsMap, groupName) : '',
              status: statusValue || '',
              offset: 0,
            }));
          }}
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
            order: ['number', 'date', 'source_ingredient_id', 'storage_id', 'group_id', 'status', 'total_amount', 'actions'],
            visibility: {
              number: true,
              date: true,
              source_ingredient_id: true,
              storage_id: true,
              group_id: true,
              status: true,
              total_amount: true,
              actions: true,
            },
            widths: {
              number: '0.6fr',
              date: '1fr',
              source_ingredient_id: '1.2fr',
              storage_id: '1.2fr',
              group_id: '1.2fr',
              status: '0.8fr',
              total_amount: '1fr',
              actions: '0.7fr',
            },
          }}
          onReset={handleResetFilters}
          toolbarActions={
            <>
              <TextField select size="small" label={t('separationActs.sourceIngredient')}
                value={draftFilters.ingredient_id ? reverseMap(ingredientsMap, Object.values(ingredientsMap).find(v => reverseMap(ingredientsMap, v) === draftFilters.ingredient_id) || '') || draftFilters.ingredient_id : ''}
                onChange={(e) => {
                  const id = e.target.value ? Object.entries(ingredientsMap).find(([, name]) => name === e.target.value)?.[0] ?? e.target.value : '';
                  setDraftFilters((prev) => ({ ...prev, ingredient_id: id }));
                }}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {Object.entries(ingredientsMap).map(([id, name]) => (
                  <MenuItem key={id} value={name}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label={t('deductions.storage')}
                value={draftFilters.storage_id ? Object.entries(storagesMap).find(([id]) => id === draftFilters.storage_id)?.[1] ?? '' : ''}
                onChange={(e) => {
                  const id = e.target.value ? Object.entries(storagesMap).find(([, name]) => name === e.target.value)?.[0] ?? '' : '';
                  setDraftFilters((prev) => ({ ...prev, storage_id: id }));
                }}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {Object.entries(storagesMap).map(([id, name]) => (
                  <MenuItem key={id} value={name}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label={t('outgoingInvoices.group')}
                value={draftFilters.group_id ? Object.entries(groupsMap).find(([id]) => id === draftFilters.group_id)?.[1] ?? '' : ''}
                onChange={(e) => {
                  const id = e.target.value ? Object.entries(groupsMap).find(([, name]) => name === e.target.value)?.[0] ?? '' : '';
                  setDraftFilters((prev) => ({ ...prev, group_id: id }));
                }}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {Object.entries(groupsMap).map(([id, name]) => (
                  <MenuItem key={id} value={name}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label={t('deductions.status')}
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {['active', 'draft', 'cancelled'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </>
          }
          onRowClick={(row: SeparationAct) => openViewModal(String(row.id))}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              component={RouterLink}
              href={paths.warehouse.separationActs.new}
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
              await deleteSeparationAct(deleteId);
              setDeleteId(null);
              await loadSeparationActs({ silent: true });
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
        title={t('overview.warehouse.separationActs')}
        data={viewData}
        loading={viewLoading}
        position="right"
        slideDirection="left"
        maxWidth="lg"
        renderContent={(payload: SeparationActBatchApiResponse | null) => {
          const separationAct = payload?.data?.act;
          const items = payload?.data?.items || [];
          if (!separationAct) return null;

          const totalAmount = Number(separationAct.total_amount || 0);

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
                      <TableCell>{t('separationActs.sourceIngredient')}</TableCell>
                      <TableCell>{t('separationActs.sourceQuantity')}</TableCell>
                      <TableCell>{t('deductions.description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{separationAct.number}</TableCell>
                      <TableCell>{new Date(separationAct.date).toLocaleString()}</TableCell>
                      <TableCell>{separationAct.status}</TableCell>
                      <TableCell>{storagesMap[separationAct.storage_id] || separationAct.storage_id}</TableCell>
                      <TableCell>{groupsMap[separationAct.group_id] || separationAct.group_id}</TableCell>
                      <TableCell>
                        {ingredientsMap[separationAct.source_ingredient_id] || separationAct.source_ingredient_id}
                      </TableCell>
                      <TableCell>{separationAct.source_quantity}</TableCell>
                      <TableCell>{separationAct.description || '-'}</TableCell>
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
