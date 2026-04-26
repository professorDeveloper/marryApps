import type { Inventory } from '../types';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';

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

  const handleEdit = onEdit || defaultEdit;
  const handleDelete = onDelete || defaultDelete;
  const handleView = onView || defaultView;

  const columns = useMemo(
    () => [
      {
        key: 'number',
        label: t('inventory.number', 'Number'),
        sortable: true,
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Inventory)?.number ?? '',
      },
      {
        key: 'date',
        label: t('inventory.date', 'Date'),
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
        label: t('inventory.storage', 'Storage'),
        sortable: true,
        filter: { type: 'multi' as const },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: unknown) =>
          (row as any)?._expand?.storage_id?.name || (row as Inventory).storage_id || '-',
      },
      {
        key: 'description',
        label: t('inventory.description', 'Description'),
        sortable: true,
        width: '1.5fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as any)?.description || '-',
      },
      {
        key: 'status',
        label: t('inventory.status', 'Status'),
        sortable: true,
        filter: { type: 'multi' as const, options: ['active', 'draft', 'deleted'] },
        width: '0.8fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Inventory)?.status || 'draft',
        renderCell: ({ value }: { value: unknown }) => (
          <InventoryStatusCell value={String(value ?? 'draft')} />
        ),
      },
      {
        key: 'remaining_amount',
        label: t('inventory.remainingAmount', 'Remaining Amount'),
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
        label: t('inventory.shortageAmount', 'Shortage Amount'),
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
        label: t('inventory.surplusAmount', 'Surplus Amount'),
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
        label: t('actions', 'Actions'),
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

  return (
    <DataTable
      persistKey="warehouse-inventory-utility"
      columns={columns}
      data={inventories}
      searchValue={searchQuery}
      onSearchChange={(value) => {
        setSearchQuery(value);
        setPaginationModel({ ...paginationModel, page: 0 });
        return;
      }}
      page={paginationModel.page}
      rowsPerPage={paginationModel.pageSize}
      totalCount={total}
      rowsPerPageOptions={[10, 20, 50, 100]}
      onPageChange={(page) => setPaginationModel({ ...paginationModel, page })}
      onRowsPerPageChange={(pageSize) => setPaginationModel({ ...paginationModel, pageSize })}
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
      onReset={() => {}}
      headerActions={
        showHeaderActions ? (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.menu.inventory.new}
            size="small"
          >
            {t('inventory.add', 'Add')}
          </Button>
        ) : undefined
      }
      showPeriodPicker={enablePeriodPicker}
      periodPickerProps={{
        startDate: toPickerDate(filters.date_from || '')?.toDate() || null,
        endDate: toPickerDate(filters.date_to || '')?.toDate() || null,
        onStartDateChange: (date: Date | null) => {
          setFilters({
            ...filters,
            date_from: date ? getTodayUtcBoundary(false) : undefined
          });
        },
        onEndDateChange: (date: Date | null) => {
          setFilters({
            ...filters,
            date_to: date ? getTomorrowUtcBoundary(true) : undefined
          });
        }
      }}
      showPeriodButtons={enablePeriodButtons}
      periodButtonProps={{
        onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
          const now = new Date();
          let startDate = '';
          let endDate = '';
          
          switch (period) {
            case 'day':
              startDate = getTodayUtcBoundary(false);
              endDate = getTomorrowUtcBoundary(true);
              break;
            case 'week':
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - now.getDay());
              startDate = getTodayUtcBoundary(false);
              endDate = getTomorrowUtcBoundary(true);
              break;
            case 'month':
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              startDate = getTodayUtcBoundary(false);
              endDate = getTomorrowUtcBoundary(true);
              break;
            case 'year':
              const yearStart = new Date(now.getFullYear(), 0, 1);
              startDate = getTodayUtcBoundary(false);
              endDate = getTomorrowUtcBoundary(true);
              break;
          }
          
          setFilters({
            ...filters,
            date_from: startDate,
            date_to: endDate
          });
        }
      }}
      getRowId={(row: any) => (row as Inventory).id}
    />
  );
}
