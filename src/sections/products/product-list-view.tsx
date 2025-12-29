// ============================================================================
// PRODUCT LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { IProductItem } from 'src/types/product';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { PRODUCT_MOCK_DATA } from 'src/_mock/_product';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import {
  RenderCellItem,
  GenericTableView,
} from 'src/components/generic-table-view';


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
  const { t } = useTranslation('menu');
  const statusValue = params.row.publish?.toLowerCase();
  const labelKey = statusValue === 'published' ? 'products.published' : 'products.draft';
  return <span>{t(labelKey)}</span>;
}

/**
 * Product-specific stock status renderer
 */
function RenderCellStockProduct({ params }: { params: any }) {
  const { t } = useTranslation('menu');
  const stockValue = params.row.inventoryType?.toLowerCase();
  let labelKey = 'products.inStock';

  if (stockValue === 'low stock' || stockValue === 'low') {
    labelKey = 'products.lowStock';
  } else if (stockValue === 'out of stock' || stockValue === 'out') {
    labelKey = 'products.outOfStock';
  }

  return <span>{t(labelKey)}</span>;
}

/**
 * Product-specific color renderer - rang uchun torburchak box
 */
function RenderCellColor({ params }: { params: any }) {
  const colorValue = params.row.color || '#FFFFFF';
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 4,
        backgroundColor: colorValue,
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={colorValue}
    />
  );
}

export function ProductListView() {
  const theme = useTheme();
  const { t } = useTranslation('menu');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProductItem | null>(null);

  // Update options with translations - Dinamik tilga nisbatan yangilandi
  const publishOptions = useMemo(
    () => [
      { value: 'published', label: t('products.published') },
      { value: 'draft', label: t('products.draft') },
    ],
    [t]
  );

  const stockOptions = useMemo(
    () => [
      { value: 'in stock', label: t('products.inStock') },
      { value: 'low stock', label: t('products.lowStock') },
      { value: 'out of stock', label: t('products.outOfStock') },
    ],
    [t]
  );

  // Mock data ishlatamiz - backend integratsiya o'rniga
  const products = PRODUCT_MOCK_DATA;
  const loading = false;

  // Columns config
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('products.name'),
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
        headerName: t('products.publish'),
        width: 120,
        type: 'singleSelect',
        editable: true,
        filterable: false,
        valueOptions: publishOptions,
        renderCell: (params) => <RenderCellPublish params={params} />,
      },
      {
        field: 'inventoryType',
        headerName: t('products.stock'),
        width: 140,
        type: 'singleSelect',
        filterable: false,
        valueOptions: stockOptions,
        renderCell: (params) => <RenderCellStockProduct params={params} />,
      },
      {
        field: 'color',
        headerName: t('products.color'),
        width: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => <RenderCellColor params={params} />,
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
            label={t('products.edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            href={paths.menu.product.edit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('products.view')}
            icon={<Iconify icon="solar:eye-bold" />}
            onClick={() => handleViewProduct(params.row)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('products.delete')}
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => handleDelete(params.row.id)}
            style={{ color: theme.vars.palette.error.main }}
          />,
        ],
      },
    ],
    [theme.vars.palette.error.main, t, publishOptions, stockOptions]
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

  // Specifications uchun render function - 4 tilga to'liq integratsiya
  const renderProductSpecifications = useCallback((product: IProductItem) => {
    const specs = [
      {
        label: t('products.name'),
        value: product.name || '-'
      },
      {
        label: t('products.price'),
        value: `$${product.price || 0}`
      },
      {
        label: t('products.stock'),
        value: (() => {
          const stockValue = product.inventoryType?.toLowerCase();
          if (stockValue === 'low stock' || stockValue === 'low') {
            return t('products.lowStock');
          }
          if (stockValue === 'out of stock' || stockValue === 'out') {
            return t('products.outOfStock');
          }
          return t('products.inStock');
        })()
      },
      {
        label: t('products.publish'),
        value: product.publish?.toLowerCase() === 'published'
          ? t('products.published')
          : t('products.draft')
      },
      {
        label: t('products.category'),
        value: product.category || '-'
      },
    ];

    return <SpecificationsTable rows={specs} />;
  }, [t]);

  return (
    <>
      <GenericTableView<IProductItem>
        data={products}
        loading={loading}
        columns={columns}
        breadcrumbs={{
          heading: t('products.title'),
          links: [
            { name: t('app'), href: paths.menu.root },
            { name: t('products.title'), href: paths.menu.product.root },
            { name: t('products.list') },
          ],
        }}
        addButton={{
          label: t('products.add'),
          href: paths.menu.product.new,
        }}
        filterOptions={{
          publish: publishOptions,
          stock: stockOptions,
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
        title={selectedProduct?.name || t('products.title')}
        data={selectedProduct}
        renderContent={renderProductSpecifications}
        maxWidth="sm"
        slideDirection="left"
        position="right"
      />
    </>
  );
}