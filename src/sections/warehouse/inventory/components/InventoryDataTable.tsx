import type { Inventory } from '../types';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, MenuItem, TextField } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/common/data-table';

import { useInventory } from '../hooks/use-inventory';
import { RouterLink } from 'src/routes/components';
import { 
  InventoryDateCell, 
  InventoryAmountCell, 
  InventoryStatusCell, 
  InventoryActionsCell 
} from '../components/InventoryCells';

// Date utility functions
const getTodayUtcBoundary = (endOfDay = false): string => {
    const now = dayjs();
    const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
    return boundary.toISOString().replace('.000Z', 'Z');
};

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
    const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
    return boundary.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (dateString: string): dayjs.Dayjs | null => {
    if (!dateString) return null;
    return dayjs(dateString);
};

interface InventoryDataTableProps {
  onView?: (inventory: Inventory) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showHeaderActions?: boolean;
  enablePeriodPicker?: boolean;
  enablePeriodButtons?: boolean;
}

export function InventoryDataTable({
  onView,
  onEdit,
  onDelete,
  showHeaderActions = true,
  enablePeriodPicker = false,
  enablePeriodButtons = false,
}: InventoryDataTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  
  const {
    inventories,
    loading,
    total,
    paginationModel,
    searchQuery,
    filters,
    setPaginationModel,
    setSearchQuery,
    setFilters,
    handleEdit: defaultEdit,
    handleDelete: defaultDelete,
    handleView: defaultView,
  } = useInventory();

  const [storageFilter, setStorageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleEdit = onEdit || defaultEdit;
  const handleDelete = onDelete || defaultDelete;
  const handleView = onView || defaultView;

  const columns = useMemo(
    () => [
      {
        key: 'number',
        label: t('inventory.number'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Inventory)?.number ?? '',
      },
      {
        key: 'date',
        label: t('inventory.date'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Inventory)?.date || '',
        renderCell: ({ value }: { value: unknown }) => (
          <InventoryDateCell value={value as string | undefined} />
        ),
      },
      {
        key: 'storage_id',
        label: t('inventory.storage'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: unknown) =>
          (row as any)?._expand?.storage_id?.name || (row as Inventory).storage_id || '-',
      },
      {
        key: 'description',
        label: t('inventory.description'),
        sortable: true,
        width: '1.5fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as any)?.description || '-',
      },
      {
        key: 'status',
        label: t('inventory.status'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Inventory)?.status || 'draft',
        renderCell: ({ value }: { value: unknown }) => (
          <InventoryStatusCell value={String(value ?? 'draft')} />
        ),
      },
      {
        key: 'remaining_amount',
        label: t('inventory.remainingAmount'),
        sortable: true,
        width: '1fr',
        align: 'right' as const,
        mono: true,
        getValue: (row: unknown) => Number((row as any)?.remaining_amount ?? 0),
        renderCell: ({ value }: { value: unknown }) => (
          <InventoryAmountCell value={value as number} />
        ),
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'shortage_amount',
        label: t('inventory.shortageAmount'),
        sortable: true,
        width: '1fr',
        align: 'right' as const,
        mono: true,
        getValue: (row: unknown) => Number((row as any)?.shortage_amount ?? 0),
        renderCell: ({ value }: { value: unknown }) => (
          <InventoryAmountCell value={value as number} />
        ),
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'surplus_amount',
        label: t('inventory.surplusAmount'),
        sortable: true,
        width: '1fr',
        align: 'right' as const,
        mono: true,
        getValue: (row: unknown) => Number((row as any)?.surplus_amount ?? 0),
        renderCell: ({ value }: { value: unknown }) => (
          <InventoryAmountCell value={value as number} />
        ),
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'actions',
        label: t('actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: unknown }) => (
          <InventoryActionsCell
            row={row as Inventory}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ),
      },
    ],
    [t, handleEdit, handleDelete, handleView]
  );

  const storageOptions = useMemo(
    () => [...new Set(inventories.map((i: any) => i._expand?.storage_id?.name || i.storage_id).filter(Boolean))] as string[],
    [inventories]
  );

  const filteredInventories = useMemo(
    () => inventories.filter((i: any) => {
      const storageName = i._expand?.storage_id?.name || i.storage_id || '';
      const matchesStorage = !storageFilter || storageName === storageFilter;
      const matchesStatus = !statusFilter || (i as Inventory).status === statusFilter;
      return matchesStorage && matchesStatus;
    }),
    [inventories, storageFilter, statusFilter]
  );

  return (
    <DataTable
      persistKey="warehouse-inventory-utility"
      columns={columns}
      data={filteredInventories}
      search={{ value: searchQuery, onChange: (value) => { setSearchQuery(value); setPaginationModel({ ...paginationModel, page: 0 }); } }}
      pagination={{
        page: paginationModel.page,
        rowsPerPage: paginationModel.pageSize,
        totalCount: total,
        rowsPerPageOptions: [10, 20, 50, 100],
        onPageChange: (page) => setPaginationModel({ ...paginationModel, page }),
        onRowsPerPageChange: (pageSize) => setPaginationModel({ ...paginationModel, pageSize }),
      }}
      defaultConfig={{
        order: ['number', 'date', 'storage_id', 'description', 'status', 'remaining_amount', 'shortage_amount', 'surplus_amount', 'actions'],
        visibility: {
          number: true,
          date: true,
          storage_id: true,
          description: true,
          status: true,
          remaining_amount: true,
          shortage_amount: true,
          surplus_amount: true,
          actions: true,
        },
        widths: {
          number: '0.8fr',
          date: '1fr',
          storage_id: '1.2fr',
          description: '1.5fr',
          status: '0.8fr',
          remaining_amount: '1fr',
          shortage_amount: '1fr',
          surplus_amount: '1fr',
          actions: '0.7fr',
        },
      }}
      onReset={() => { setStorageFilter(''); setStatusFilter(''); }}
      filterRow={
        <>
          <TextField
            select size="small" label="Storage"
            value={storageFilter}
            onChange={(e) => setStorageFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {storageOptions.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {['active', 'draft', 'deleted'].map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </TextField>
        </>
      }
      headerActions={
        showHeaderActions ? (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.menu.inventory.new}
            size="small"
          >
            {t('inventory.add')}
          </Button>
        ) : undefined
      }
      periodFilter={enablePeriodPicker || enablePeriodButtons ? {
        startDate: toPickerDate(filters.date_from || '')?.toDate() || null,
        endDate: toPickerDate(filters.date_to || '')?.toDate() || null,
        onStartDateChange: (date: Date | null) => { setFilters({ ...filters, date_from: date ? toUtcDayBoundary(dayjs(date), false) : undefined }); },
        onEndDateChange: (date: Date | null) => { setFilters({ ...filters, date_to: date ? toUtcDayBoundary(dayjs(date), true) : undefined }); },
        onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
          setFilters({ ...filters, date_from: getTodayUtcBoundary(false), date_to: getTodayUtcBoundary(true) });
        },
      } : undefined}
      getRowId={(row: any) => (row as Inventory).id}
    />
  );
}
