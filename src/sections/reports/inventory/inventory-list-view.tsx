import type { IInventory } from 'src/types/inventory';
import type { InventoryFilters } from 'src/sections/warehouse/inventory/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { useTimeFilter } from 'src/hooks/use-time-filter';

import {
  Box,
  Chip,
  Dialog,
  Button,
  MenuItem,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';
import { useStorageAPI } from 'src/hooks/use-storage-api';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { useInventory } from 'src/sections/warehouse/inventory/hooks/use-inventory';
import { DataTable } from 'src/sections/common/data-table';
import { CELL_SX } from 'src/sections/common/data-table/utils/constants';
import { RouterLink } from 'src/routes/components';

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

const getTomorrowUtcBoundary = (endOfDay = false): string => {
  const now = dayjs().add(1, 'day');
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

interface InventoryListParams {
  search?: string;
  limit?: number;
  offset?: number;
  date_from?: string;
  date_to?: string;
  storage_id?: string;
  status?: string;
  expand?: string;
  q?: string;
}

const initialFilters: InventoryListParams = {
  date_from: getTodayUtcBoundary(),
  date_to: getTomorrowUtcBoundary(true),
  storage_id: '',
  status: '',
  expand: 'storage_id',
  q: '',
  limit: 20,
  offset: 0,
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

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null);

// Module-level cache with 5-minute TTL to avoid re-fetching on every mount.
// Cleared automatically when stale so storages stay reasonably fresh.
let staticDataCache: { storages: any[]; fetchedAt: number } | null = null;
let staticDataPromise: Promise<{ storages: any[] }> | null = null;
const STATIC_CACHE_TTL_MS = 5 * 60 * 1000;

export function InventoryReportsListView() {
  const { t } = useTranslation('menu');
  const noDataText = t('noDataAvailable');
  
  const { getStorages } = useStorageAPI();
  const [storages, setStorages] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<IInventory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<InventoryListParams>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<InventoryListParams>(initialFilters);
  const { startDate, endDate, activePeriod: activeRange, setDates, applyRange, reset: resetTimeFilter } = useTimeFilter();
  const lastInventoriesKeyRef = useRef('');

  const {
    inventories,
    loading,
    total,
    paginationModel,
    setPaginationModel,
    filters: inventoryFilters,
    setFilters: setInventoryFilters,
    handleDelete: handleDeleteInventory,
    refreshData,
  } = useInventory({
    initialPageSize: 20,
  });

  const isStoragesEmpty = storages.length === 0;

  // Apply date range changes
  useEffect(() => {
    setDraftFilters((prev) => ({
      ...prev,
      date_from: startDate ? toUtcDayBoundary(startDate) : '',
      date_to: endDate ? toUtcDayBoundary(endDate, true) : '',
      offset: 0,
    }));
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
  }, [startDate, endDate]);

  // Wire filters to hook
  useEffect(() => {
    setInventoryFilters({
      search: draftFilters.search || '',
      date_from: draftFilters.date_from || '',
      date_to: draftFilters.date_to || '',
      storage_id: draftFilters.storage_id ? [draftFilters.storage_id] : [],
    });
  }, [draftFilters, setInventoryFilters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const now = Date.now();
        if (staticDataCache && now - staticDataCache.fetchedAt < STATIC_CACHE_TTL_MS) {
          setStorages(staticDataCache.storages);
          return;
        }

        // Clear stale promise so it is retried after cache expiry
        if (staticDataCache) {
          staticDataCache = null;
          staticDataPromise = null;
        }

        if (!staticDataPromise) {
          staticDataPromise = getStorages().then((storagesData) => ({
            storages: storagesData || [],
          }));
        }

        const resolved = await staticDataPromise;
        staticDataCache = { ...resolved, fetchedAt: Date.now() };
        staticDataPromise = null;

        setStorages(resolved.storages);
      } catch {
        staticDataPromise = null;
        setStorages([]);
      }
    };

    fetchStaticData();
  }, [getStorages]);

  // Merge two previously-duplicate effects that both reacted to debouncedSearchQuery
  useEffect(() => {
    setDraftFilters((prev) => ({ ...prev, q: debouncedSearchQuery }));
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
    setInventoryFilters({ search: debouncedSearchQuery });
  // paginationModel.pageSize intentionally omitted — we only want to reset page, not run on every pageSize change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, setInventoryFilters]);

  const handlePaginationPageChange = useCallback(
    (page: number) => {
      setPaginationModel({ page, pageSize: paginationModel.pageSize });
    },
    [setPaginationModel, paginationModel.pageSize]
  );

  const handlePaginationRowsPerPageChange = useCallback(
    (pageSize: number) => {
      setPaginationModel({ page: 0, pageSize });
    },
    [setPaginationModel]
  );

  const inventoriesWithStorage = useMemo(() => {
    const storageMap = new Map(storages.map((s: any) => [s.id, s]));

    return inventories.map((inventory: any) => {
      const expandedStorage = inventory?._expand?.storage_id;
      const storage = expandedStorage || storageMap.get(inventory.storage_id);

      return {
        ...inventory,
        storage_name: storage?.name || 'Unknown',
      };
    });
  }, [inventories, storages]);

  const handleDeleteClick = (id: string) => {
    setSelectedDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDeleteId) {
      await handleDeleteInventory(selectedDeleteId);
      refreshData();
      setDeleteDialogOpen(false);
      setSelectedDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedDeleteId(null);
  };

  const handleViewClick = useCallback(async (inventory: IInventory) => {
    setSelectedInventory(inventory);
  }, []);

  const handleModalClose = () => {
    setSelectedInventory(null);
  };

  const handleReset = useCallback(() => {
    setDraftFilters(initialFilters);
    resetTimeFilter();
    setSearchQuery('');
  }, [resetTimeFilter]);

  const columns = useMemo(
    () => [
      {
        key: 'number',
        label: t('inventory.number'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: any) => row?.number ?? '',
        renderCell: ({ row }: { row: any }) => (
          <Box sx={CELL_SX}>
            {row?.number || '-'}
          </Box>
        ),
      },
      {
        key: 'storage_id',
        label: t('inventory.storage'),
        sortable: true,
        filter: {
          type: 'multi' as const,
          options: storages.map((s) => s.id),
          getOptionLabel: (id: string) => storages.find((s) => s.id === id)?.name || id,
        },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: any) => row?.storage_name ?? '',
        renderCell: ({ row }: { row: any }) => (
          <Box sx={CELL_SX}>
            {row?.storage_name || '-'}
          </Box>
        ),
      },
      {
        key: 'description',
        label: t('inventory.description'),
        sortable: true,
        width: '1.5fr',
        align: 'left' as const,
        getValue: (row: any) => row?.description ?? '',
        renderCell: ({ row }: { row: any }) => (
          <Box sx={CELL_SX}>
            {row?.description || '-'}
          </Box>
        ),
      },
      {
        key: 'status',
        label: t('inventory.status'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: any) => row?.status || '',
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
        key: 'surplus_amount',
        label: t('inventory.surplus'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: any) => Number(row?.surplus_amount || 0),
        renderCell: ({ value }: { value: unknown }) => {
          const amount = Number(value ?? 0);
          return (
            <Box sx={CELL_SX}>
              {amount.toLocaleString()} UZS
            </Box>
          );
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'shortage_amount',
        label: t('inventory.shortage'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        mono: true,
        getValue: (row: any) => Number(row?.shortage_amount || 0),
        renderCell: ({ value }: { value: unknown }) => {
          const amount = Number(value ?? 0);
          return (
            <Box sx={CELL_SX}>
              {amount.toLocaleString()} UZS
            </Box>
          );
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'date',
        label: t('inventory.date'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: any) =>
          row?.date ? new Date(row.date).toLocaleDateString() : '',
        renderCell: ({ row }: { row: any }) => {
          const dateValue = row?.date ? new Date(row.date).toLocaleDateString() : '-';
          return (
            <Box sx={CELL_SX}>
              {dateValue}
            </Box>
          );
        },
      },
      {
        key: 'actions',
        label: t('actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: any }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = paths.menu.reports.inventory.edit(row.id);
              }}
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.id);
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [t, handleViewClick, storages]
  );

  const startDateValue = useMemo(() => toPickerDate(draftFilters.date_from), [draftFilters.date_from]);
  const endDateValue = useMemo(() => toPickerDate(draftFilters.date_to), [draftFilters.date_to]);

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
      

        <DataTable<IInventory>
          persistKey="reports-inventory-list"
          data={inventoriesWithStorage}
          getRowId={(row: any) => String(row?.id)}
          columns={columns}
          search={{ value: searchQuery, onChange: (value: string) => { setSearchQuery(value); setPaginationModel({ page: 0, pageSize: paginationModel.pageSize }); } }}
          toolbarActions={
            <>
              <TextField
                select size="small" label={t('inventory.storage')}
                value={draftFilters.storage_id || ''}
                onChange={(e) => { setDraftFilters((p) => ({ ...p, storage_id: e.target.value })); setPaginationModel({ page: 0, pageSize: paginationModel.pageSize }); }}
                sx={{ minWidth: 160 }}
                disabled={isStoragesEmpty}
              >
                <MenuItem value="">All</MenuItem>
                {storages.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label={t('inventory.status')}
                value={draftFilters.status || ''}
                onChange={(e) => { setDraftFilters((p) => ({ ...p, status: e.target.value })); setPaginationModel({ page: 0, pageSize: paginationModel.pageSize }); }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All</MenuItem>
                {['active', 'completed', 'draft', 'cancelled'].map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                ))}
              </TextField>
            </>
          }
          pagination={{
            page: paginationModel.page,
            rowsPerPage: paginationModel.pageSize,
            totalCount: total,
            rowsPerPageOptions: [10, 20, 50, 100],
            onPageChange: handlePaginationPageChange,
            onRowsPerPageChange: handlePaginationRowsPerPageChange,
          }}
          defaultConfig={{
            order: ['number', 'storage_id', 'description', 'status', 'surplus_amount', 'shortage_amount', 'date', 'actions'],
            visibility: {
              number: true,
              storage_id: true,
              description: true,
              status: true,
              surplus_amount: true,
              shortage_amount: true,
              date: true,
              actions: true,
            },
            widths: {
              number: '0.8fr',
              storage_id: '1.2fr',
              description: '1.5fr',
              status: '0.8fr',
              surplus_amount: '1fr',
              shortage_amount: '1fr',
              date: '1fr',
              actions: '0.7fr',
            },
          }}
          onReset={handleReset}
          periodFilter={{
            startDate: startDate ? startDate.toDate() : null,
            endDate: endDate ? endDate.toDate() : null,
            onStartDateChange: (date: Date | null) => { setDates(date ? dayjs(date) : null, endDate, 'day'); },
            onEndDateChange: (date: Date | null) => { setDates(startDate, date ? dayjs(date) : null, 'day'); },
            activePeriod: activeRange,
            onPeriodChange: applyRange,
          }}
          onRowClick={handleViewClick}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              component={RouterLink}
              href={paths.menu.reports.inventory.new}
              size="small"
            >
              {t('add')}
            </Button>
          }
        />
      </DashboardContent>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{t('inventory.deleteConfirmation.title')}</DialogTitle>
        <DialogContent>
          <p>{t('inventory.deleteConfirmation.message')}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">
            {t('inventory.deleteConfirmation.cancel')}
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            {t('inventory.deleteConfirmation.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
