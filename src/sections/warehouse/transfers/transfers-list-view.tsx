import type { GridPaginationModel } from '@mui/x-data-grid';
import type { Transfer } from 'src/types/transfers';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import {
  Chip,
  Table,
  Dialog,
  TableRow,
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
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';
import { useBranchesDetail, useIngredientsList, useDeductionGroups } from 'src/hooks/use-reference-data';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { RenderCell } from 'src/components/RenderCell';
import { GenericViewModal } from 'src/components/generic-view-view';

import { FILTER_SELECT_SX } from 'src/sections/common/data-table';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

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

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const filterSelectSx = FILTER_SELECT_SX;

export function TransfersListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const { getTransfers, getTransferById, deleteTransfer } = useTransfersAPI();
  const { branchesMap, storagesMap } = useBranchesDetail();
  const { groupsMap } = useDeductionGroups();
  const { ingredientsMap } = useIngredientsList();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Transfer[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState('0');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<Transfer | null>(null);
  const { rowsPerPage } = usePaginationRows();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: rowsPerPage,
  });

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: rowsPerPage }));
  }, [rowsPerPage]);
  const [draftFilters, setDraftFilters] = useState({
    status: '',
    date_from: getTodayUtcBoundary(),
    date_to: getTodayUtcBoundary(true),
    from_storage_id: '',
    to_storage_id: '',
    act_group_id: '',
    ingredient_id: '',
    from_branch_id: '',
    to_branch_id: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year' | undefined>('day'); // Match the initial date range
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Sync startDate/endDate with draftFilters
  useEffect(() => {
    setStartDate(toPickerDate(draftFilters.date_from)?.toDate() || null);
    setEndDate(toPickerDate(draftFilters.date_to)?.toDate() || null);
  }, [draftFilters.date_from, draftFilters.date_to]);

  // Reset page when search or filters change
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchQuery, draftFilters]);

  const handleFiltersChange = useCallback(
    (filterState: Record<string, { type: 'text' | 'multi'; value: string | string[] }>) => {
      const getFilterValue = (key: string): string => {
        const v = filterState[key]?.value;
        return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
      };

      setDraftFilters((prev) => ({
        ...prev,
        from_storage_id: getFilterValue('from_storage_id'),
        to_storage_id: getFilterValue('to_storage_id'),
        act_group_id: getFilterValue('act_group_id'),
        status: getFilterValue('status'),
        from_branch_id: getFilterValue('from_branch_id'),
        to_branch_id: getFilterValue('to_branch_id'),
      }));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    []
  );

  const openViewModal = useCallback(
    async (transferId: string) => {
      setViewOpen(true);
      setViewLoading(true);
      try {
        const details = await getTransferById(transferId);
        setViewData(details);
      } finally {
        setViewLoading(false);
      }
    },
    [getTransferById]
  );

  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    try {
      const transfersData = await getTransfers({
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
        status: draftFilters.status || undefined,
        date_from: draftFilters.date_from || undefined,
        date_to: draftFilters.date_to || undefined,
        from_storage_id: draftFilters.from_storage_id || undefined,
        to_storage_id: draftFilters.to_storage_id || undefined,
        act_group_id: draftFilters.act_group_id || undefined,
        ingredient_id: draftFilters.ingredient_id || undefined,
        expand: 'items',
      });

      setRows(transfersData.items);
      setRowCount(transfersData.pagination?.total || 0);
      setTotalAmount(transfersData.totalAmount || '0');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [getTransfers, paginationModel.page, paginationModel.pageSize, draftFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    // Status filter
    if (draftFilters.status && row.status !== draftFilters.status) {
      return false;
    }

    // TODO: from_branch_id and to_branch_id are not yet supported by the backend API
    // They are filtered client-side (limited to the current loaded page)
    if (draftFilters.from_branch_id && row.from_branch_id !== draftFilters.from_branch_id) {
      return false;
    }

    if (draftFilters.to_branch_id && row.to_branch_id !== draftFilters.to_branch_id) {
      return false;
    }

    // Search filter
    if (debouncedSearchQuery) {
      const searchLower = debouncedSearchQuery.toLowerCase();
      const searchableText = [
        row.number,
        row.total_amount,
        row.status,
        branchesMap[row.from_branch_id],
        branchesMap[row.to_branch_id],
        storagesMap[row.from_storage_id],
        storagesMap[row.to_storage_id],
        groupsMap[row.act_group_id],
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    // Date filter
    if (draftFilters.date_from && row.date) {
      const rowDate = dayjs(row.date);
      const fromDate = dayjs(draftFilters.date_from);
      if (rowDate.isBefore(fromDate)) {
        return false;
      }
    }

    if (draftFilters.date_to && row.date) {
      const rowDate = dayjs(row.date);
      const toDate = dayjs(draftFilters.date_to);
      if (rowDate.isAfter(toDate)) {
        return false;
      }
    }

    return true;
  }), [rows, draftFilters, debouncedSearchQuery, branchesMap, storagesMap, groupsMap]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteTransfer(deleteId);
    setOpenConfirm(false);
    setDeleteId(null);
    await loadData({ silent: true });
  }, [deleteId, deleteTransfer, loadData]);

  const filtersValue = useMemo(() => {
    const result: Record<string, { type: 'multi'; value: string[] }> = {};
    if (draftFilters.from_storage_id) result.from_storage_id = { type: 'multi', value: [draftFilters.from_storage_id] };
    if (draftFilters.to_storage_id) result.to_storage_id = { type: 'multi', value: [draftFilters.to_storage_id] };
    if (draftFilters.act_group_id) result.act_group_id = { type: 'multi', value: [draftFilters.act_group_id] };
    if (draftFilters.status) result.status = { type: 'multi', value: [draftFilters.status] };
    if (draftFilters.from_branch_id) result.from_branch_id = { type: 'multi', value: [draftFilters.from_branch_id] };
    if (draftFilters.to_branch_id) result.to_branch_id = { type: 'multi', value: [draftFilters.to_branch_id] };
    return result;
  }, [draftFilters]);

  const columns = useMemo(
    () => [
      {
        key: 'number',
        label: t('deductions.number'),
        sortable: true,
        width: '0.6fr',
        align: 'left' as const,
        getValue: (row: Transfer) =>
          row?.number ?? t('common.notFound'),
        renderCell: ({ row }: { row: Transfer }) => (
          <RenderCell label={String(row?.number || t('common.notFound'))} />
        ),
      },
      {
        key: 'from_branch_id',
        label: t('warehouse.fromBranch'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.from_branch_id) return t('common.notFound');
          return branchesMap[row.from_branch_id] || t('common.notFound');
        },
        renderCell: ({ row }: { row: Transfer }) => {
          const value = !row.from_branch_id ? t('common.notFound') : 
                     branchesMap[row.from_branch_id] || t('common.notFound');
          return <RenderCell label={value} />;
        },
      },
      {
        key: 'to_branch_id',
        label: t('warehouse.toBranch'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.to_branch_id) return t('common.notFound');
          return branchesMap[row.to_branch_id] || t('common.notFound');
        },
        renderCell: ({ row }: { row: Transfer }) => {
          const value = !row.to_branch_id ? t('common.notFound') : 
                     branchesMap[row.to_branch_id] || t('common.notFound');
          return <RenderCell label={value} />;
        },
      },
      {
        key: 'from_storage_id',
        label: t('warehouse.fromStorage'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.from_storage_id) return t('common.notFound');
          return storagesMap[row.from_storage_id] || t('common.notFound');
        },
        renderCell: ({ row }: { row: Transfer }) => {
          const value = !row.from_storage_id ? t('common.notFound') : 
                     storagesMap[row.from_storage_id] || t('common.notFound');
          return <RenderCell label={value} />;
        },
      },
      {
        key: 'to_storage_id',
        label: t('warehouse.toStorage'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.to_storage_id) return t('common.notFound');
          return storagesMap[row.to_storage_id] || t('common.notFound');
        },
        renderCell: ({ row }: { row: Transfer }) => {
          const value = !row.to_storage_id ? t('common.notFound') : 
                     storagesMap[row.to_storage_id] || t('common.notFound');
          return <RenderCell label={value} />;
        },
      },
      {
        key: 'act_group_id',
        label: t('deductions.group'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.act_group_id) return t('common.notFound');
          return groupsMap[row.act_group_id] || t('common.notFound');
        },
        renderCell: ({ row }: { row: Transfer }) => {
          const value = !row.act_group_id ? t('common.notFound') : 
                     groupsMap[row.act_group_id] || t('common.notFound');
          return <RenderCell label={value} />;
        },
      },
      {
        key: 'status',
        label: t('invoices.status'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: Transfer) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '');
          if (!status) return t('common.notFound');
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
        label: t('deductions.balance'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: Transfer) => {
          if (!row.total_amount) return 0;
          return Number(row.total_amount);
        },
        renderCell: ({ value }: { value: unknown }) => {
          const num = Number(value ?? 0);
          const displayValue = !num && num !== 0 ? t('common.notFound') : num.toLocaleString();
          return <RenderCell label={displayValue} />;
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'date',
        label: t('deductions.date'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.date) return '';
          try {
            return new Date(row.date).toLocaleDateString();
          } catch {
            return '';
          }
        },
        renderCell: ({ row }: { row: Transfer }) => {
          let dateValue = '';
          if (row.date) {
            try {
              dateValue = new Date(row.date).toLocaleDateString();
            } catch {
              dateValue = '-';
            }
          }
          return <RenderCell label={dateValue || '-'} />;
        },
      },
      {
        key: 'actions',
        label: t('common.actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: Transfer }) => (
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
                router.push(paths.warehouse.transfers.edit(row.id));
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
                setOpenConfirm(true);
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
    [branchesMap, groupsMap, storagesMap, t, router]
  );

  const handleRowClick = useCallback(
    (row: Transfer) => openViewModal(String(row.id)),
    [openViewModal]
  );

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
          persistKey="warehouse-transfers"
          data={filteredRows}
          getRowId={(row: Transfer) => String(row?.id)}
          columns={columns}
          search={{
            value: searchQuery,
            onChange: (value: string) => {
              setSearchQuery(value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            },
          }}
          filters={filtersValue}
          onFiltersChange={handleFiltersChange}
          pagination={{
            page: paginationModel.page,
            rowsPerPage: paginationModel.pageSize,
            totalCount: rowCount,
            rowsPerPageOptions: [10, 20, 50, 100],
            onPageChange: (p) => setPaginationModel((prev) => ({ ...prev, page: p })),
            onRowsPerPageChange: (size) => setPaginationModel({ page: 0, pageSize: size }),
          }}
          periodFilter={{
            startDate,
            endDate,
            onStartDateChange: (date: Date | null) => {
              setActivePeriod(undefined); // Reset active period when manually changing date
              setStartDate(date);
              setDraftFilters(prev => ({
                ...prev,
                date_from: date ? toUtcDayBoundary(dayjs(date), false) : ''
              }));
            },
            onEndDateChange: (date: Date | null) => {
              setActivePeriod(undefined); // Reset active period when manually changing date
              setEndDate(date);
              setDraftFilters(prev => ({
                ...prev,
                date_to: date ? toUtcDayBoundary(dayjs(date), true) : ''
              }));
            },
            activePeriod,
            onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
              setActivePeriod(period);
              const now = dayjs();
              let nextStartDate = '';
              let nextEndDate = '';

              switch (period) {
                case 'day':
                  nextStartDate = toUtcDayBoundary(now, false);
                  nextEndDate = toUtcDayBoundary(now, true);
                  break;
                case 'week': {
                  const weekStart = now.subtract(7, 'day');
                  nextStartDate = toUtcDayBoundary(weekStart, false);
                  nextEndDate = toUtcDayBoundary(now, true);
                  break;
                }
                case 'month': {
                  const monthStart = now.subtract(30, 'day');
                  nextStartDate = toUtcDayBoundary(monthStart, false);
                  nextEndDate = toUtcDayBoundary(now, true);
                  break;
                }
                case 'year': {
                  const yearStart = now.subtract(365, 'day');
                  nextStartDate = toUtcDayBoundary(yearStart, false);
                  nextEndDate = toUtcDayBoundary(now, true);
                  break;
                }
                default:
                  break;
              }

              setDraftFilters(prev => ({
                ...prev,
                date_from: nextStartDate,
                date_to: nextEndDate
              }));
              // Also sync the date picker states
              setStartDate(toPickerDate(nextStartDate)?.toDate() || null);
              setEndDate(toPickerDate(nextEndDate)?.toDate() || null);
            }
          }}
          defaultConfig={{
            order: ['number', 'from_branch_id', 'to_branch_id', 'from_storage_id', 'to_storage_id', 'act_group_id', 'status', 'total_amount', 'date', 'actions'],
            visibility: {
              number: true,
              from_branch_id: true,
              to_branch_id: true,
              from_storage_id: true,
              to_storage_id: true,
              act_group_id: true,
              status: true,
              total_amount: true,
              date: true,
              actions: true,
            },
            widths: {
              number: '0.6fr',
              from_branch_id: '1.2fr',
              to_branch_id: '1.2fr',
              from_storage_id: '1.2fr',
              to_storage_id: '1.2fr',
              act_group_id: '1fr',
              status: '0.8fr',
              total_amount: '1fr',
              date: '1fr',
              actions: '0.7fr',
            },
          }}
          onRowClick={handleRowClick}
          onReset={() => setDraftFilters({
    status: '',
    date_from: getTodayUtcBoundary(),
    date_to: getTodayUtcBoundary(true),
    from_storage_id: '',
    to_storage_id: '',
    act_group_id: '',
    ingredient_id: '',
    from_branch_id: '',
    to_branch_id: '',
  })}
          filterRow={
            <>
              <TextField select size="small" label="" slotProps={{ select: { displayEmpty: true } }}
                value={draftFilters.from_branch_id}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from_branch_id: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('warehouse.fromBranch')}</MenuItem>
                {Object.entries(branchesMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="" slotProps={{ select: { displayEmpty: true } }}
                value={draftFilters.to_branch_id}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to_branch_id: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('warehouse.toBranch')}</MenuItem>
                {Object.entries(branchesMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="" slotProps={{ select: { displayEmpty: true } }}
                value={draftFilters.from_storage_id}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, from_storage_id: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('warehouse.fromStorage')}</MenuItem>
                {Object.entries(storagesMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="" slotProps={{ select: { displayEmpty: true } }}
                value={draftFilters.to_storage_id}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, to_storage_id: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('warehouse.toStorage')}</MenuItem>
                {Object.entries(storagesMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="" slotProps={{ select: { displayEmpty: true } }}
                value={draftFilters.act_group_id}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, act_group_id: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('deductions.group')}</MenuItem>
                {Object.entries(groupsMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="" slotProps={{ select: { displayEmpty: true } }}
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                sx={filterSelectSx}
              >
                <MenuItem value="">{t('invoices.status')}</MenuItem>
                {['active', 'draft', 'deleted'].map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </>
          }
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              component={RouterLink}
              href={paths.warehouse.transfers.new}
              size="small"
            >
              {t('common.add')}
            </Button>
          }
        />
      </DashboardContent>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
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
        title={t('overview.warehouse.transfers')}
        data={viewData}
        loading={viewLoading}
        position="right"
        slideDirection="left"
        maxWidth="lg"
        renderContent={(transfer: Transfer | null) => {
          if (!transfer) return null;

          const items = transfer.items || [];
          const total = Number(transfer.total_amount || 0);

          return (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('deductions.number')}</TableCell>
                      <TableCell>{t('deductions.date')}</TableCell>
                      <TableCell>{t('deductions.status')}</TableCell>
                      <TableCell>{t('warehouse.fromBranch')}</TableCell>
                      <TableCell>{t('warehouse.toBranch')}</TableCell>
                      <TableCell>{t('warehouse.fromStorage')}</TableCell>
                      <TableCell>{t('warehouse.toStorage')}</TableCell>
                      <TableCell>{t('deductions.group')}</TableCell>
                      <TableCell>{t('deductions.description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{transfer.number}</TableCell>
                      <TableCell>{transfer.date ? new Date(transfer.date).toLocaleString() : '-'}</TableCell>
                      <TableCell>{transfer.status}</TableCell>
                      <TableCell>{branchesMap[transfer.from_branch_id] || transfer.from_branch_id}</TableCell>
                      <TableCell>{branchesMap[transfer.to_branch_id] || transfer.to_branch_id}</TableCell>
                      <TableCell>{storagesMap[transfer.from_storage_id] || transfer.from_storage_id}</TableCell>
                      <TableCell>{storagesMap[transfer.to_storage_id] || transfer.to_storage_id}</TableCell>
                      <TableCell>{groupsMap[transfer.act_group_id] || transfer.act_group_id}</TableCell>
                      <TableCell>{transfer.description || '-'}</TableCell>
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
                      { field: 'price', headerName: t('shipments.pricePerUnit'), width: 150 },
                      { field: 'total_amount', headerName: t('shipments.total'), width: 150 },
                      { field: 'stock_qty_before', headerName: t('shipments.stockBefore'), width: 120 },
                      { field: 'stock_qty_after', headerName: t('shipments.stockAfter'), width: 120 },
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
                  <strong>{t('deductions.balance')}:</strong> {total.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />
    </>
  );
}
