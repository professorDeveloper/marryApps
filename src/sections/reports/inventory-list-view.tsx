import type { IInventory } from 'src/types/inventory';
import type { InventoryFilters } from 'src/sections/warehouse/inventory/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Dialog,
  Button,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { useInventory } from 'src/sections/warehouse/inventory/hooks/use-inventory';
import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';
import { CELL_SX } from 'src/sections/warehouse/deduction/components/utility-data-table/utils/constants';

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

let staticDataCache: {
  storages: any[];
} | null = null;

let staticDataPromise: Promise<{
  storages: any[];
}> | null = null;

export function InventoryReportsListView() {
  const { t } = useTranslation('menu');
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");
  
  const { getStorages } = useStorageAPI();
  const [storages, setStorages] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<IInventory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<InventoryListParams>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<InventoryListParams>(initialFilters);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
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

  // Set default date range on component mount
  useEffect(() => {
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
  }, []);

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

  // Apply range changes
  const applyRange = useCallback((range: 'day' | 'week' | 'month' | 'year') => {
    const today = dayjs();
    let nextStart = today.startOf('day');
    let nextEnd = today.endOf('day');

    switch (range) {
      case 'day':
        nextStart = today.startOf('day');
        nextEnd = today.endOf('day');
        break;
      case 'week':
        nextStart = today.startOf('week');
        nextEnd = today.endOf('day');
        break;
      case 'month':
        nextStart = today.startOf('month');
        nextEnd = today.endOf('day');
        break;
      case 'year':
        nextStart = today.startOf('year');
        nextEnd = today.endOf('day');
        break;
    }

    setActiveRange(range);
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        if (staticDataCache) {
          setStorages(staticDataCache.storages);
          return;
        }

        if (!staticDataPromise) {
          staticDataPromise = Promise.all([
            getStorages(),
          ]).then(([storagesData]) => ({
            storages: storagesData || [],
          }));
        }

        const resolved = await staticDataPromise;
        staticDataCache = resolved;

        setStorages(resolved.storages);
      } catch {
        setStorages([]);
      }
    };

    fetchStaticData();
  }, [getStorages]);

  useEffect(() => {
    setDraftFilters((prev) => ({
      ...prev,
      q: debouncedSearchQuery,
    }));
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
    const newFilters: InventoryFilters = {
      search: debouncedSearchQuery,
    };
    setInventoryFilters(newFilters);
  }, [debouncedSearchQuery, paginationModel.pageSize, setInventoryFilters]);

  const handlePaginationPageChange = (page: number) => {
    setPaginationModel({ page, pageSize: paginationModel.pageSize });
  };

  const handlePaginationRowsPerPageChange = (pageSize: number) => {
    setPaginationModel({ page: 0, pageSize });
  };

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
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setActiveRange('day');
    setSearchQuery('');
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'number',
        label: t('inventory.number', 'Number'),
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
        key: 'storage_name',
        label: t('inventory.storage', 'Storage'),
        sortable: true,
        filter: { type: 'multi' as const },
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
        label: t('inventory.description', 'Description'),
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
        label: t('inventory.status', 'Status'),
        sortable: true,
        filter: { type: 'multi' as const, options: ['active', 'completed', 'draft', 'cancelled'] },
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: any) => row?.status || '',
        renderCell: ({ value }: { value: unknown }) => {
          const status = String(value ?? '').toLowerCase();
          let bgColor = '#E2E3E5';
          let textColor = '#383D41';
          if (status === 'active') { bgColor = '#D4EDDA'; textColor = '#155724'; }
          if (status === 'completed') { bgColor = '#CCE5FF'; textColor = '#004085'; }
          if (status === 'draft') { bgColor = '#FFF3CD'; textColor = '#856404'; }
          if (status === 'cancelled') { bgColor = '#F8D7DA'; textColor = '#721C24'; }
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
        key: 'surplus_amount',
        label: t('inventory.surplus', 'Surplus'),
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
        label: t('inventory.shortage', 'Shortage'),
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
        label: t('inventory.date', 'Date'),
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
    [t, handleViewClick]
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
          searchValue={searchQuery}
          onSearchChange={(value: string) => {
            setSearchQuery(value);
            setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
          }}
          page={paginationModel.page}
          rowsPerPage={paginationModel.pageSize}
          totalCount={total}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={handlePaginationPageChange}
          onRowsPerPageChange={handlePaginationRowsPerPageChange}
          defaultConfig={{
            order: ['number', 'storage_name', 'description', 'status', 'surplus_amount', 'shortage_amount', 'date', 'actions'],
            visibility: {
              number: true,
              storage_name: true,
              description: true,
              status: true,
              surplus_amount: true,
              shortage_amount: true,
              date: true,
              actions: true,
            },
            widths: {
              number: '0.8fr',
              storage_name: '1.2fr',
              description: '1.5fr',
              status: '0.8fr',
              surplus_amount: '1fr',
              shortage_amount: '1fr',
              date: '1fr',
              actions: '0.7fr',
            },
          }}
          onReset={handleReset}
          showPeriodPicker
          periodPickerProps={{
            startDate: startDate ? startDate.toDate() : null,
            endDate: endDate ? endDate.toDate() : null,
            onStartDateChange: (date: Date | null) => {
              setStartDate(date ? dayjs(date) : null);
              setActiveRange('day');
            },
            onEndDateChange: (date: Date | null) => {
              setEndDate(date ? dayjs(date) : null);
              setActiveRange('day');
            }
          }}
          showPeriodButtons
          periodButtonProps={{
            activePeriod: activeRange,
            onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
              applyRange(period);
            }
          }}
          onRowClick={handleViewClick}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
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
