import type { GridPaginationModel } from '@mui/x-data-grid';
import type { Transfer } from 'src/types/transfers';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useTransfersAPI } from 'src/hooks/use-transfers-api';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useGetWorkspacesBranches } from 'src/hooks/use-workspaces-branches';

import { fetcher, endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

interface Branch {
  id: string;
  name: string;
}

interface Storage {
  id: string;
  name: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

type BranchDetailsResponse = BackendResponse<Branch> | Branch;
type StoragesByBranchResponse = BackendResponse<Storage[]> | Storage[] | { data?: BackendResponse<Storage[]> | Storage[] };

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

export function TransfersListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const { getTransfers, deleteTransfer, getTransferGroups } = useTransfersAPI();
  const { getStorages } = useStorageAPI();
  const { getDeductionGroups } = useDeductionsAPI();
  const { workspaces } = useGetWorkspacesBranches();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Transfer[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState('0');
  const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});
  const [storagesMap, setStoragesMap] = useState<Record<string, string>>({});
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [storageOptions, setStorageOptions] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [draftFilters, setDraftFilters] = useState({
    status: '',
    date_from: getTodayUtcBoundary(),
    date_to: getTomorrowUtcBoundary(true),
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

  // Fetch filter options - build maps with ID as key and name as value for filter display
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Update branches map from workspaces
        const branchesMap = workspaces.reduce(
          (acc, w) => ({ ...acc, [w.id]: w.name }),
          {} as Record<string, string>
        );
        setBranchesMap(branchesMap);
        setBranchOptions(Object.keys(branchesMap));

        // Fetch and update storages map
        const storages = await getStorages();
        const storagesMap = storages.reduce(
          (acc, s) => ({ ...acc, [s.id]: s.name }),
          {} as Record<string, string>
        );
        setStoragesMap(storagesMap);
        setStorageOptions(Object.keys(storagesMap));

        // Fetch and update deduction groups map
        const groups = await getDeductionGroups();
        const groupsMap = groups.reduce(
          (acc, g) => ({ ...acc, [g.id]: g.name }),
          {} as Record<string, string>
        );
        setGroupsMap(groupsMap);
        setGroupOptions(Object.keys(groupsMap));
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };

    fetchFilterOptions();
  }, [workspaces, getStorages, getDeductionGroups]);

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Refetch data when filters change (including date period changes)
  useEffect(() => {
    loadData();
  }, [draftFilters]);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transfersData, groupsData, branchesData, storagesData] = await Promise.all([
        getTransfers({
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
        }),
        getTransferGroups(),
        fetcher<BackendResponse<Branch[]>>(endpoints.branches.list).catch(() => ({
          status: 'error',
          message: 'failed',
          data: [],
          code: 500,
        })),
        fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(() => ({
          status: 'error',
          message: 'failed',
          data: [],
          code: 500,
        })),
      ]);

      const baseBranchesMap = (branchesData.data || []).reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      );

      const missingBranchIds = Array.from(
        new Set(
          transfersData.items.flatMap((transfer) => [transfer.from_branch_id, transfer.to_branch_id])
        )
      ).filter((branchId) => branchId && !baseBranchesMap[branchId]);

      let resolvedBranchesMap: Record<string, string> = {};

      if (missingBranchIds.length) {
        const resolvedEntries = await Promise.all(
          missingBranchIds.map(async (branchId) => {
            try {
              const response = await fetcher<BranchDetailsResponse>(endpoints.branches.details(branchId));
              const branch = (response as BackendResponse<Branch>)?.data ?? (response as Branch);
              return [branchId, branch?.name || branchId] as const;
            } catch {
              return [branchId, branchId] as const;
            }
          })
        );

        resolvedBranchesMap = resolvedEntries.reduce(
          (acc, [branchId, branchName]) => ({ ...acc, [branchId]: branchName }),
          {} as Record<string, string>
        );
      }

      const branchIdsFromTransfers = Array.from(
        new Set(
          transfersData.items.flatMap((transfer) => [transfer.from_branch_id, transfer.to_branch_id])
        )
      ).filter(Boolean);

      const parseStoragesResponse = (response: StoragesByBranchResponse): Storage[] => {
        if (Array.isArray(response)) return response;
        if (response && 'data' in response && Array.isArray(response.data)) return response.data;
        if (
          response &&
          'data' in response &&
          response.data &&
          typeof response.data === 'object' &&
          'data' in response.data &&
          Array.isArray((response.data as BackendResponse<Storage[]>).data)
        ) {
          return (response.data as BackendResponse<Storage[]>).data;
        }
        return [];
      };

      let storagesFromBranches: Storage[] = [];
      if (branchIdsFromTransfers.length) {
        const storagesByBranchResponses = await Promise.all(
          branchIdsFromTransfers.map((branchId) =>
            fetcher<StoragesByBranchResponse>(endpoints.storage.byBranch(branchId)).catch(() => [])
          )
        );

        storagesFromBranches = storagesByBranchResponses.flatMap((response) =>
          parseStoragesResponse(response as StoragesByBranchResponse)
        );
      }

      const baseStorages = Array.isArray(storagesData.data) ? storagesData.data : [];
      const storagesMapMerged = [...baseStorages, ...storagesFromBranches].reduce(
        (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
        {} as Record<string, string>
      );

      setRows(transfersData.items);
      setRowCount(transfersData.pagination?.total || 0);
      setTotalAmount(transfersData.totalAmount || '0');
      setGroupsMap(
        (groupsData || []).reduce(
          (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
          {} as Record<string, string>
        )
      );
      setBranchesMap(
        {
          ...baseBranchesMap,
          ...resolvedBranchesMap,
        }
      );
      setStoragesMap(
        storagesMapMerged
      );
    } finally {
      setLoading(false);
    }
  }, [getTransferGroups, getTransfers, paginationModel.page, paginationModel.pageSize, draftFilters]);

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
    await loadData();
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
        label: t('deductions.number', 'Number'),
        sortable: true,
        width: '0.6fr',
        align: 'left' as const,
        getValue: (row: Transfer) =>
          row?.number ?? t('common.notFound', 'Not found'),
      },
      {
        key: 'from_branch_id',
        label: t('warehouse.branch', 'From branch'),
        sortable: true,
        filter: {
          type: 'multi' as const,
          options: branchOptions,
          getOptionLabel: (id: string) => branchesMap[id] || id,
        },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.from_branch_id) return t('common.notFound', 'Not found');
          return branchesMap[row.from_branch_id] || t('common.notFound', 'Not found');
        },
      },
      {
        key: 'to_branch_id',
        label: t('warehouse.branch', 'To branch'),
        sortable: true,
        filter: {
          type: 'multi' as const,
          options: branchOptions,
          getOptionLabel: (id: string) => branchesMap[id] || id,
        },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.to_branch_id) return t('common.notFound', 'Not found');
          return branchesMap[row.to_branch_id] || t('common.notFound', 'Not found');
        },
      },
      {
        key: 'from_storage_id',
        label: t('deductions.storage', 'From storage'),
        sortable: true,
        filter: {
          type: 'multi' as const,
          options: storageOptions,
          getOptionLabel: (id: string) => storagesMap[id] || id,
        },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.from_storage_id) return t('common.notFound', 'Not found');
          return storagesMap[row.from_storage_id] || t('common.notFound', 'Not found');
        },
      },
      {
        key: 'to_storage_id',
        label: t('warehouse.storage', 'To storage'),
        sortable: true,
        filter: {
          type: 'multi' as const,
          options: storageOptions,
          getOptionLabel: (id: string) => storagesMap[id] || id,
        },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.to_storage_id) return t('common.notFound', 'Not found');
          return storagesMap[row.to_storage_id] || t('common.notFound', 'Not found');
        },
      },
      {
        key: 'act_group_id',
        label: t('deductions.group', 'Group'),
        sortable: true,
        filter: {
          type: 'multi' as const,
          options: groupOptions,
          getOptionLabel: (id: string) => groupsMap[id] || id,
        },
        width: '1fr',
        align: 'left' as const,
        getValue: (row: Transfer) => {
          if (!row.act_group_id) return t('common.notFound', 'Not found');
          return groupsMap[row.act_group_id] || t('common.notFound', 'Not found');
        },
      },
      {
        key: 'status',
        label: t('invoices.status', 'Status'),
        sortable: true,
        filter: { type: 'multi' as const, options: ['active', 'draft', 'deleted'] },
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: Transfer) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '').toLowerCase();
          if (!status) return t('common.notFound', 'Not found');
          let bgColor = '#E2E3E5';
          let textColor = '#383D41';
          if (status === 'draft') { bgColor = '#FFF3CD'; textColor = '#856404'; }
          if (status === 'active') { bgColor = '#D4EDDA'; textColor = '#155724'; }
          if (status === 'deleted') { bgColor = '#F8D7DA'; textColor = '#721C24'; }
          return (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 700,
                backgroundColor: bgColor,
                color: textColor,
              }}
            >
              {status}
            </span>
          );
        },
      },
      {
        key: 'total_amount',
        label: t('deductions.balance', 'Total'),
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
          if (!num && num !== 0) return t('common.notFound', 'Not found');
          return num.toLocaleString();
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'date',
        label: t('deductions.date', 'Date'),
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
      },
      {
        key: 'actions',
        label: t('common.actions', 'Actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: Transfer }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => router.push(paths.warehouse.transfers.edit(row.id))}
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setDeleteId(row.id);
                setOpenConfirm(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [branchesMap, groupsMap, storagesMap, t, router, branchOptions, storageOptions, groupOptions]
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
          searchValue={searchQuery}
          onSearchChange={(value: string) => {
            setSearchQuery(value);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          filters={filtersValue}
          onFiltersChange={handleFiltersChange}
          page={paginationModel.page}
          rowsPerPage={paginationModel.pageSize}
          totalCount={rowCount}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(p) => setPaginationModel((prev) => ({ ...prev, page: p }))}
          onRowsPerPageChange={(size) => setPaginationModel({ page: 0, pageSize: size })}
          showPeriodPicker
          periodPickerProps={{
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
            }
          }}
          showPeriodButtons
          periodButtonProps={{
            activePeriod,
            onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
              console.log('Period changed from', activePeriod, 'to', period); // Debug log
              setActivePeriod(period);
              const now = dayjs();
              let startDate = '';
              let endDate = '';
              
              switch (period) {
                case 'day':
                  startDate = toUtcDayBoundary(now, false);
                  endDate = toUtcDayBoundary(now, true);
                  break;
                case 'week':
                  const weekStart = now.subtract(7, 'day');
                  startDate = toUtcDayBoundary(weekStart, false);
                  endDate = toUtcDayBoundary(now, true);
                  break;
                case 'month':
                  const monthStart = now.subtract(30, 'day');
                  startDate = toUtcDayBoundary(monthStart, false);
                  endDate = toUtcDayBoundary(now, true);
                  break;
                case 'year':
                  const yearStart = now.subtract(365, 'day');
                  startDate = toUtcDayBoundary(yearStart, false);
                  endDate = toUtcDayBoundary(now, true);
                  break;
              }
              
              setDraftFilters(prev => ({
                ...prev,
                date_from: startDate,
                date_to: endDate
              }));
              // Also sync the date picker states
              setStartDate(toPickerDate(startDate)?.toDate() || null);
              setEndDate(toPickerDate(endDate)?.toDate() || null);
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
          onReset={() => setDraftFilters({
    status: '',
    date_from: getTodayUtcBoundary(),
    date_to: getTomorrowUtcBoundary(true),
    from_storage_id: '',
    to_storage_id: '',
    act_group_id: '',
    ingredient_id: '',
    from_branch_id: '',
    to_branch_id: '',
  })}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              href={paths.warehouse.transfers.new}
              size="small"
            >
              {t('common.add', 'Add')}
            </Button>
          }
        />
      </DashboardContent>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle', 'Confirm delete')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage', 'Are you sure?')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
