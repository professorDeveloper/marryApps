// ============================================================================
// PRODUCT LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { IProductItem } from 'src/types/product';

import { useMemo, useState, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericDataTable } from 'src/hooks/use-generic-data-table';

import { endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import {
  RenderCellItem,
  RenderCellStock,
  GenericTableView,
} from 'src/components/generic-table-view';

// ============================================================================
// CONSTANTS
// ============================================================================

const PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const STOCK_OPTIONS = [
  { value: 'in stock', label: 'In stock' },
  { value: 'low stock', label: 'Low stock' },
  { value: 'out of stock', label: 'Out of stock' },
];


// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Product-specific renderer that includes product image and name with link
 */
function RenderCellProduct({ params, href }: { params: any; href: string }) {
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
 * Product-specific publish status renderer
 */
function RenderCellPublish({ params }: { params: any }) {
  return <span>{params.row.publish}</span>;
}

export function ProductListView() {
  const theme = useTheme();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProductItem | null>(null);

  // Generic hook ishlatamiz
  const { data: products, loading } = useGenericDataTable<IProductItem>({
    endpoint: endpoints.product.list,
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
          <RenderCellProduct
            params={params}
            href={paths.menu.product.details(params.row.id)}
          />
        ),
      },
      {
        field: 'publish',
        headerName: 'Obmor',
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
            href={paths.menu.product.edit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label="View"
            icon={<Iconify icon="solar:eye-bold" />}
            onClick={() => handleViewProduct(params.row)}
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

  const handleViewProduct = useCallback((product: IProductItem) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedProduct(null);
  }, []);

  // Specifications uchun render function
  const renderProductSpecifications = useCallback((product: IProductItem) => {
    const specs = [
      { label: 'Nomi', value: product.name || '-' },
      { label: 'Narxi', value: `$${product.price || 0}` },
      { label: 'Zaxira turi', value: product.inventoryType || '-' },
      { label: 'Status', value: product.publish || '-' },
      { label: 'Kategoriya', value: product.category || '-' },
    ];

    return <SpecificationsTable rows={specs} />;
  }, []);

  return (
    <>
      <GenericTableView<IProductItem>
        data={products}
        loading={loading}
        columns={columns}
        breadcrumbs={{
          heading: 'Mahsulotlar',
          links: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Product', href: paths.menu.product.root },
            { name: 'List' },
          ],
        }}
        addButton={{
          label: 'Mahsulot qo\'shish',
          href: paths.menu.product.new,
        }}
        filterOptions={{
          publish: PUBLISH_OPTIONS,
          stock: STOCK_OPTIONS,
        }}
        initialFilters={{
          publish: [],
          stock: [],
        }}
        hideColumns={{ category: false }}
        hideColumnsTogglable={['category', 'actions']}
        onDeleteRow={handleDelete}
        onDeleteRows={handleDeleteMultiple}
      />

      <GenericViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseModal}
        title={selectedProduct?.name || 'Mahsulot'}
        data={selectedProduct}
        renderContent={renderProductSpecifications}
        maxWidth="sm"
        slideDirection="left"
        position="right"
      />
    </>
  );
}