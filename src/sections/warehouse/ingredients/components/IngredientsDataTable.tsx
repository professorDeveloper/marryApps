import type { Ingredient } from '../types';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, MenuItem, TextField } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from '../../../../components/iconify';
import { useIngredients } from '../hooks/use-ingredients';
import { DataTable } from 'src/sections/common/data-table';
import { RouterLink } from 'src/routes/components';
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
}

const filterSelectSx = {
  minWidth: 140,
  '& .MuiInputBase-root': { height: 36, fontSize: 13.5, backgroundColor: 'var(--bg2)', borderRadius: '6px', fontFamily: 'var(--font-sans)' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
  '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
  '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--brand)', boxShadow: '0 0 0 2px var(--accent-soft)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

export function IngredientsDataTable({
  onView,
  onEdit,
  onDelete,
  showHeaderActions = true,
}: IngredientsDataTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [groupFilter, setGroupFilter] = useState('');
  const [measurementFilter, setMeasurementFilter] = useState('');

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

  const groupOptions = useMemo(
    () => [...new Set(ingredients.map((i) => (i as Ingredient).group_name).filter(Boolean))] as string[],
    [ingredients]
  );

  const filteredIngredients = useMemo(
    () =>
      ingredients.filter(
        (i) =>
          (!groupFilter || (i as Ingredient).group_name === groupFilter) &&
          (!measurementFilter || (i as Ingredient).measurement === measurementFilter)
      ),
    [ingredients, groupFilter, measurementFilter]
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: t('warehouse.name'),
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
        label: t('warehouse.group'),
        sortable: true,
        width: '1.2fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Ingredient)?.group_name || '-',
      },
      {
        key: 'measurement',
        label: t('warehouse.measurement'),
        sortable: true,
        width: '1fr',
        align: 'left' as const,
        getValue: (row: unknown) => (row as Ingredient)?.measurement || '-',
        renderCell: ({ value }: { value: unknown }) => (
          <IngredientMeasurementCell value={String(value)} t={t} />
        ),
      },
      {
        key: 'color_code',
        label: t('warehouse.color'),
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
        label: t('warehouse.price'),
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
        label: t('actions'),
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
      data={filteredIngredients}
      search={{ value: searchQuery, onChange: (value) => { setSearchQuery(value); setPaginationModel({ ...paginationModel, page: 0 }); } }}
      pagination={{
        page: paginationModel.page,
        rowsPerPage: paginationModel.pageSize,
        totalCount: total,
        rowsPerPageOptions: [10, 20, 50, 100],
        onPageChange: (p) => setPaginationModel({ ...paginationModel, page: p }),
        onRowsPerPageChange: (size) => setPaginationModel({ page: 0, pageSize: size }),
      }}
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
      filterRow={
        <>
          <TextField
            select size="small" label={t('warehouse.group')}
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            sx={filterSelectSx}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            {groupOptions.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label={t('warehouse.measurement')}
            value={measurementFilter}
            onChange={(e) => setMeasurementFilter(e.target.value)}
            sx={filterSelectSx}
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            {['kg', 'l', 'piece'].map((v) => (
              <MenuItem key={v} value={v}>{t(`warehouse.${v}`)}</MenuItem>
            ))}
          </TextField>
        </>
      }
      onReset={() => { setGroupFilter(''); setMeasurementFilter(''); }}
      headerActions={
        showHeaderActions ? (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.menu.ingredients.new}
            size="small"
          >
            {t('warehouse.add')}
          </Button>
        ) : undefined
      }
      getRowId={(row: any) => (row as Ingredient).id}
    />
  );
}
