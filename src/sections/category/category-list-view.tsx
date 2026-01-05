import type { GridColDef } from '@mui/x-data-grid';
import type { ICategory } from 'src/types/category';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { getInitials, getAvatarUrl, getAvatarColor } from 'src/utils/avatar';

import { useGetCategories, useDeleteCategory } from 'src/actions/categories';
import { useGetStorageName, useGetDepartmentName } from 'src/actions/departments';

import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';

// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Category image/avatar renderer
 */
function RenderCellCategory({ params }: { params: any }) {
  const category = params.row as ICategory;
  const avatarUrl = getAvatarUrl(category.name, category.picture_url);
  const initials = getInitials(category.name);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        paddingTop: '15px',
        paddingBottom: '15px',
      }}
    >
      <Avatar
        src={avatarUrl}
        sx={{
          width: 60,
          height: 60,
          backgroundColor: getAvatarColor(category.name),
          fontSize: '2',
          fontWeight: 600,
          borderRadius: '20%',
          color: '#fff',
        }}
      >
        {initials}
      </Avatar>
      <Box>
        <Box sx={{ fontWeight: 600 }}>{category.name}</Box>
      </Box>
    </Box>
  );
}

/**
 * Storage name renderer
 */
function RenderCellStorage({ params }: { params: any }) {
  const category = params.row as ICategory;
  const storageName = useGetStorageName(category.storage_id || '');
  return <span>{storageName || '-'}</span>;
}

/**
 * Department name renderer
 */
function RenderCellDepartment({ params }: { params: any }) {
  const category = params.row as ICategory;
  const departmentName = useGetDepartmentName(category.department_id || '');
  return <span>{departmentName || '-'}</span>;
}

// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

function CategorySpecifications({ category, t }: { category: ICategory; t: any }) {
  const storageName = useGetStorageName(category.storage_id || '');
  const departmentName = useGetDepartmentName(category.department_id || '');

  const specs = [
    { label: t('categories.name'), value: category.name || '-' },
    { label: t('categories.storage'), value: storageName || '-' },
    { label: t('categories.department'), value: departmentName || '-' },
  ];

  return <SpecificationsTable rows={specs} />;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoryListView() {
  console.log('CategoryListView rendered');
  const theme = useTheme();
  const { t } = useTranslation('menu');

  // API hooks
  const { categories, categoriesLoading } = useGetCategories();
  const { deleteCategory } = useDeleteCategory();

  // View modal hook
  const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ICategory>();

  // Columns config
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('categories.name'),
        flex: 1,
        minWidth: 280,
        hideable: false,
        renderCell: (params) => (
          <RenderCellCategory params={params} />
        ),
      },
      {
        field: 'storage_id',
        headerName: t('categories.storage'),
        width: 180,
        renderCell: (params) => <RenderCellStorage params={params} />,
      },
      {
        field: 'department_id',
        headerName: t('categories.department'),
        width: 180,
        renderCell: (params) => <RenderCellDepartment params={params} />,
      },
      {
        type: 'actions',
        field: 'actions',
        headerName: '',
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
    [theme.vars.palette.error.main, t]
  );

  const handleDelete = useCallback((id: string) => {
    if (window.confirm(t('categories.deleteConfirm', 'Are you sure?'))) {
      deleteCategory(id).catch((err) => {
        console.error('Error deleting category:', err);
      });
    }
  }, [deleteCategory, t]);

  const handleDeleteMultiple = useCallback((ids: string[]) => {
    if (window.confirm(t('categories.deleteConfirmMultiple', 'Are you sure?'))) {
      ids.forEach((id) => {
        deleteCategory(id).catch((err) => {
          console.error('Error deleting category:', err);
        });
      });
    }
  }, [deleteCategory, t]);

  return (
    <>
      <GenericTableView<ICategory>
        data={categories}
        loading={categoriesLoading}
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
          status: [],
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
        renderContent={(data) => <CategorySpecifications category={data} t={t} />}
        maxWidth="sm"
        slideDirection="left"
        position="right"
      />
    </>
  );
}