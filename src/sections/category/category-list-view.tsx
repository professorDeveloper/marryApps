import type { GridColDef } from '@mui/x-data-grid';
import type { ICategory } from 'src/types/category';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { getInitials, getAvatarColor } from 'src/utils/avatar';
import { getFullImageUrl } from 'src/utils/image-url';

import { useGetCategories, useDeleteCategory } from 'src/actions/categories';
import { useGetStorageName, useGetDepartmentName } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
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
  const avatarUrl = category.picture_url ? getFullImageUrl(category.picture_url) : null;
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
        src={avatarUrl || undefined}
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

  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

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
            key="delete"
            showInMenu
            label={t('categories.delete')}
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => {
              setCategoryToDelete(params.row.id);
              setDeleteDialogOpen(true);
            }}
            style={{ color: theme.vars.palette.error.main }}
          />,
        ],
      },
    ],
    [theme.vars.palette.error.main, t]
  );

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete);
        toast.success(t('success.deleteSuccess'));
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error(t('error.deleteFailed'));
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  }, [categoryToDelete, deleteCategory, t]);

  const handleDeleteMultiple = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteCategory(id)));
      toast.success(t('success.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting categories:', error);
      toast.error(t('error.deleteFailed'));
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('categories.deleteConfirm')}</DialogTitle>
        <DialogContent>
          {t('categories.deleteMessage')}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {t('categories.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            autoFocus
          >
            {t('categories.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}