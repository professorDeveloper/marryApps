// ============================================================================
// CATEGORY LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { ICategory } from 'src/types/category';

import { useMemo, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericDataTable } from 'src/hooks/use-generic-data-table';

import { endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { RenderCellItem, RenderCellStock, GenericTableView } from 'src/components/generic-table-view';

// ============================================================================
// CONSTANTS
// ============================================================================

const PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const PUBLISH_KITCHEN = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const KITCHEN_OPTIONS = [
  { value: 'tushlik', label: 'Tushlik' },
  { value: 'kechki', label: 'Kechki' },
  { value: 'nonushta', label: 'Nonushta' },
  { value: 'snack', label: 'Snack' },
];

const WAREHOUSE_OPTIONS = [
  { value: 'ombor_1', label: 'Ombor 1' },
  { value: 'ombor_2', label: 'Ombor 2' },
  { value: 'ombor_3', label: 'Ombor 3' },
  { value: 'markaziy', label: 'Markaziy' },
];

const STOCK_OPTIONS = [
  { value: 'in stock', label: 'In stock' },
  { value: 'low stock', label: 'Low stock' },
  { value: 'out of stock', label: 'Out of stock' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Category-specific renderer that includes category image and name with link
 */
function RenderCellCategory({ params, href }: { params: any; href: string }) {
  return (
    <RenderCellItem
      params={params}
      href={href}
      imageField="coverUrl"
      nameField="name"
    />
  );
}

/**
 * Category-specific publish status renderer
 */
function RenderCellPublish({ params }: { params: any }) {
  return <span>{params.row.publish}</span>;
}

export function CategoryListView() {
  const theme = useTheme();

  const { data: categories, loading } = useGenericDataTable<ICategory>({
    endpoint: endpoints.category.list,
    dataKey: 'products',
  });

  // Columns config
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: 'Nomi',
        flex: 1,
        minWidth: 360,
        hideable: false,
        renderCell: (params) => (
          <RenderCellCategory
            params={params}
            href={paths.menu.category.details(params.row.id)}
          />
        ),
      },
      {
        field: 'kitchen',
        headerName: 'Bo\'lim',
        width: 120,
        type: 'singleSelect',
        editable: true,
        filterable: false,
        valueOptions: PUBLISH_KITCHEN,
        renderCell: (params) => <RenderCellPublish params={params} />,
      },
       {
        field: 'publish',
        headerName: 'Ombor',
        width: 120,
        type: 'singleSelect',
        editable: true,
        filterable: false,
        valueOptions: PUBLISH_OPTIONS,
        renderCell: (params) => <RenderCellPublish params={params} />,
      },
      {
        field: 'inventoryType',
        headerName: 'Rang',
        width: 140,
        type: 'singleSelect',
        filterable: false,
        valueOptions: STOCK_OPTIONS,
        renderCell: (params) => <RenderCellStock params={params} />,
      },
      {
        type: 'actions',
        field: 'actions',
        headerName: ' ',
        width: 64,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            showInMenu
            label="Edit"
            icon={<Iconify icon="solar:pen-bold" />}
            href={paths.menu.category.edit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label="View"
            icon={<Iconify icon="solar:eye-bold" />}
            href={paths.menu.category.details(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label="Delete"
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => handleDelete(params.row.id)}
            style={{ color: theme.vars.palette.error.main }}
          />,
        ],
      },
    ],
    [theme.vars.palette.error.main]
  );

  const handleDelete = useCallback((id: string) => {
    console.log('Delete:', id);
    // Bu yerda API delete request qiling
  }, []);

  const handleDeleteMultiple = useCallback((ids: string[]) => {
    console.log('Delete multiple:', ids);
    // Bu yerda API delete request qiling
  }, []);

  return (
    <GenericTableView<ICategory>
      data={categories}
      loading={loading}
      columns={columns}
      breadcrumbs={{
        heading: 'Kategoriyalar',
        links: [
          { name: 'Menu', href: paths.menu.root },
          { name: 'Category', href: paths.menu.category.root },
          { name: 'List' },
        ],
      }}
      addButton={{
        label: 'Kategoriya qo\'shish',
        href: paths.menu.category.new,
      }}
      filterOptions={{
        status: STATUS_OPTIONS,
      }}
      initialFilters={{
        status: [],
      }}
      hideColumnsTogglable={['actions']}
      onDeleteRow={handleDelete}
      onDeleteRows={handleDeleteMultiple}
    />
  );
}
