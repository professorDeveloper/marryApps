import type { Ingredient } from '../types';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from '../../../../components/iconify';
import { useIngredients } from '../hooks/use-ingredients';
import { DataTable } from '../../deduction/components/utility-data-table';
import { 
  IngredientNameCell, 
  IngredientColorCell, 
  IngredientPriceCell, 
  IngredientActionsCell, 
  IngredientMeasurementCell 
} from '../components/IngredientCells';

interface IngredientsDataTableProps {
  onView?: (ingredient: Ingredient) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showHeaderActions?: boolean;
  enablePeriodPicker?: boolean;
  enablePeriodButtons?: boolean;
}

export function IngredientsDataTable({
  onView,
  onEdit,
  onDelete,
  showHeaderActions = true,
  enablePeriodPicker = false,
  enablePeriodButtons = false,
}: IngredientsDataTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  
  const {
    ingredients,
    loading,
    total,
    paginationModel,
    searchQuery,
    setPaginationModel,
    setSearchQuery,
    handleEdit: defaultEdit,
    handleDelete: defaultDelete,
    handleView: defaultView,
  } = useIngredients();

  const handleEdit = onEdit || defaultEdit;
  const handleDelete = onDelete || defaultDelete;
  const handleView = onView || defaultView;

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: t('warehouse.name', 'Name'),
        sortable: true,
        width: '2fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Ingredient)?.name ?? '',
        renderCell: ({ row }: { row: unknown }) => (
          <IngredientNameCell row={row as Ingredient} />
        ),
      },
      {
        key: 'group_name',
        label: t('warehouse.group', 'Group'),
        sortable: true,
        filter: { type: 'multi' as const },
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Ingredient)?.group_name || '-',
      },
      {
        key: 'measurement',
        label: t('warehouse.measurement', 'Measurement'),
        sortable: true,
        filter: { type: 'multi' as const },
        width: '1fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Ingredient)?.measurement || '-',
        renderCell: ({ value }: { value: unknown }) => (
          <IngredientMeasurementCell value={String(value)} t={t} />
        ),
      },
      {
        key: 'color_code',
        label: t('warehouse.color', 'Color'),
        sortable: false,
        width: '0.8fr',
        align: 'center' as const,
        getValue: (row: unknown) => (row as Ingredient)?.color_code || '',
        renderCell: ({ value }: { value: unknown }) => (
          <IngredientColorCell value={String(value)} />
        ),
      },
      {
        key: 'price_per_unit',
        label: t('warehouse.price', 'Price'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Ingredient)?.price_per_unit || '-',
        renderCell: ({ value }: { value: unknown }) => (
          <IngredientPriceCell value={value as string | number | undefined} />
        ),
      },
      {
        key: 'actions',
        label: t('actions', 'Actions'),
        sortable: false,
        filterable: false,
        width: '0.7fr',
        align: 'center' as const,
        renderCell: ({ row }: { row: unknown }) => (
          <IngredientActionsCell
            row={row as Ingredient}
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
      persistKey="warehouse-ingredients-utility"
      columns={columns}
      data={ingredients}
      searchValue={searchQuery}
      onSearchChange={(value) => {
        setSearchQuery(value);
        setPaginationModel({ ...paginationModel, page: 0 });
      }}
      page={paginationModel.page}
      rowsPerPage={paginationModel.pageSize}
      totalCount={total}
      rowsPerPageOptions={[10, 20, 50, 100]}
      onPageChange={(p) => setPaginationModel({ ...paginationModel, page: p })}
      onRowsPerPageChange={(size) => setPaginationModel({ page: 0, pageSize: size })}
      defaultConfig={{
        order: ['name', 'group_name', 'measurement', 'color_code', 'price_per_unit', 'actions'],
        visibility: {
          name: true,
          group_name: true,
          measurement: true,
          color_code: true,
          price_per_unit: true,
          actions: true,
        },
        widths: {
          name: '2fr',
          group_name: '1.2fr',
          measurement: '1fr',
          color_code: '0.8fr',
          price_per_unit: '1fr',
          actions: '0.7fr',
        },
      }}
      onReset={() => {}}
      headerActions={
        showHeaderActions ? (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            href={paths.menu.ingredients.new}
            size="small"
          >
            {t('warehouse.add', 'Add')}
          </Button>
        ) : undefined
      }
      showPeriodPicker={enablePeriodPicker}
      showPeriodButtons={enablePeriodButtons}
      getRowId={(row: any) => (row as Ingredient).id}
    />
  );
}
