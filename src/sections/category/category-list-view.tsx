// ============================================================================
// CATEGORY LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { ICategory } from 'src/types/category';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { CATEGORY_MOCK_DATA } from 'src/_mock/_category';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { formatDate } from 'src/components/generic-view-view/modal-formatters';
import { RenderCellItem, GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';

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
      imageField="image"
      nameField="name"
    />
  );
}

/**
 * Category-specific kitchen status renderer
 */
function RenderCellKitchen({ params }: { params: any }) {
  const { t } = useTranslation('menu');
  const kitchenValue = params.row.kitchen?.toLowerCase();
  const labelKey = kitchenValue === 'tushlik'
    ? 'categories.tushlik'
    : kitchenValue === 'kechki'
      ? 'categories.kechki'
      : kitchenValue === 'nonushta'
        ? 'categories.nonushta'
        : 'categories.snack';
  return <span>{t(labelKey)}</span>;
}

/**
 * Category-specific warehouse status renderer
 */
function RenderCellWarehouse({ params }: { params: any }) {
  const { t } = useTranslation('menu');
  const warehouseValue = params.row.warehouse?.toLowerCase();
  let labelKey = 'categories.ombor_1';

  if (warehouseValue === 'ombor_2') {
    labelKey = 'categories.ombor_2';
  } else if (warehouseValue === 'ombor_3') {
    labelKey = 'categories.ombor_3';
  } else if (warehouseValue === 'markaziy') {
    labelKey = 'categories.markaziy';
  }

  return <span>{t(labelKey)}</span>;
}

/**
 * Category-specific status renderer - faqat rang, katta, markazda
 */
function RenderCellStatus({ params }: { params: any }) {
  const statusValue = params.row.status?.toLowerCase();
  const color = statusValue === 'active' ? '#22C55E' : '#EF4444'; // Yashil / Qizil

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '6px',
          backgroundColor: color,
        }}
      />
    </Box>
  );
}

// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

/**
 * Category-specific render function uchun modal - 4 tilga to'liq integratsiya
 */
function renderCategorySpecifications(category: ICategory, t: any) {
  const kitchenValue = category.kitchen?.toLowerCase();
  let kitchenLabel = t('categories.tushlik');

  if (kitchenValue === 'kechki') {
    kitchenLabel = t('categories.kechki');
  } else if (kitchenValue === 'nonushta') {
    kitchenLabel = t('categories.nonushta');
  } else if (kitchenValue === 'snack') {
    kitchenLabel = t('categories.snack');
  }

  const warehouseValue = category.warehouse?.toLowerCase();
  let warehouseLabel = t('categories.ombor_1');

  if (warehouseValue === 'ombor_2') {
    warehouseLabel = t('categories.ombor_2');
  } else if (warehouseValue === 'ombor_3') {
    warehouseLabel = t('categories.ombor_3');
  } else if (warehouseValue === 'markaziy') {
    warehouseLabel = t('categories.markaziy');
  }

  const statusValue = category.status?.toLowerCase();
  const statusLabel = statusValue === 'active' ? t('categories.active') : t('categories.inactive');

  const specs = [
    { label: t('categories.name'), value: category.name || '-' },
    { label: t('categories.slug'), value: category.slug || '-' },
    { label: t('categories.status'), value: statusLabel },
    { label: t('categories.kitchen'), value: kitchenLabel },
    { label: t('categories.warehouse'), value: warehouseLabel },
    { label: t('categories.productsCount'), value: String(category.productsCount || 0) },
    { label: t('categories.createdAt'), value: formatDate(category.createdAt) },
    { label: t('categories.updatedAt'), value: formatDate(category.updatedAt) },
  ];

  return <SpecificationsTable rows={specs} />;
}

export function CategoryListView() {
  const theme = useTheme();
  const { t } = useTranslation('menu');

  // Mock data-ni state-ga o'tkazamiz
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Component mount qilinganda mock data-ni load qilish
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      setCategories(CATEGORY_MOCK_DATA);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // View modal hook'i
  const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ICategory>();

  // Update options with translations - Dinamik tilga nisbatan yangilandi
  const kitchenOptions = useMemo(
    () => [
      { value: 'tushlik', label: t('categories.tushlik') },
      { value: 'kechki', label: t('categories.kechki') },
      { value: 'nonushta', label: t('categories.nonushta') },
      { value: 'Oshxona', label: t('categories.snack') },
    ],
    [t]
  );

  const warehouseOptions = useMemo(
    () => [
      { value: 'ombor_1', label: t('categories.ombor_1') },
      { value: 'ombor_2', label: t('categories.ombor_2') },
      { value: 'ombor_3', label: t('categories.ombor_3') },
      { value: 'markaziy', label: t('categories.markaziy') },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: t('categories.active') },
      { value: 'inactive', label: t('categories.inactive') },
    ],
    [t]
  );

  // Columns config
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('categories.name'),
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
        headerName: t('categories.kitchen'),
        width: 140,
        type: 'singleSelect',
        editable: true,
        filterable: false,
        valueOptions: kitchenOptions,
        renderCell: (params) => <RenderCellKitchen params={params} />,
      },
      {
        field: 'warehouse',
        headerName: t('categories.warehouse'),
        width: 140,
        type: 'singleSelect',
        editable: true,
        filterable: false,
        valueOptions: warehouseOptions,
        renderCell: (params) => <RenderCellWarehouse params={params} />,
      },
      {
        field: 'status',
        headerName: t('categories.status'),
        width: 120,
        type: 'singleSelect',
        filterable: false,
        valueOptions: statusOptions,
        renderCell: (params) => <RenderCellStatus params={params} />,
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
            label={t('categories.edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            href={paths.menu.category.edit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('categories.view')}
            icon={<Iconify icon="solar:eye-bold" />}
            onClick={() => openModal(params.row)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('categories.delete')}
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => handleDelete(params.row.id)}
            style={{ color: theme.vars.palette.error.main }}
          />,
        ],
      },
    ],
    [theme.vars.palette.error.main, t, kitchenOptions, warehouseOptions, statusOptions]
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
    <>
      <GenericTableView<ICategory>
        data={categories}
        loading={loading}
        columns={columns}
        breadcrumbs={{
          heading: t('categories.title'),
          links: [
            { name: t('app'), href: paths.menu.root },
            { name: t('categories.title'), href: paths.menu.category.root },
            { name: t('categories.list') },
          ],
        }}
        addButton={{
          label: t('categories.add'),
          href: paths.menu.category.new,
        }}
        filterOptions={{
          status: statusOptions,
        }}
        initialFilters={{
          status: [],
        }}
        hideColumnsTogglable={['actions']}
        onDeleteRow={handleDelete}
        onDeleteRows={handleDeleteMultiple}
      />

      {/* Category View Modal */}
      <GenericViewModal
        isOpen={isOpen}
        onClose={closeModal}
        title={selectedData?.name || t('categories.title')}
        data={selectedData}
        renderContent={(data) => renderCategorySpecifications(data, t)}
        maxWidth="sm"
        slideDirection="left"
        position="right"
      />
    </>
  );
}
