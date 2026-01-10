import type { GridColDef } from '@mui/x-data-grid';
import type { IDepartmentItem } from 'src/types/departments.tsx';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import { Avatar, Button, Dialog, DialogTitle, DialogActions, DialogContent, Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetStorages, useGetDepartments, useGetStorageName, useDeleteDepartment } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import {
  GenericTableView,
} from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable, type SpecificationRow } from 'src/components/generic-view-view';

function RenderCellDepartmentName({ params }: { params: any }) {
  const { t } = useTranslation('menu');

  // Get initials from department name
  const getInitials = (name: string) => name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorCode = params.row.color_code || '#CCCCCC';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20, paddingBottom: 20 }}>
      <Avatar
        sx={{
          width: 60,
          height: 60,
          fontSize: '3',
          fontWeight: 'bold',
          color: '#000000',
          borderRadius: '15%',
          bgcolor: colorCode,
        }}
      >
        {getInitials(params.row.name)}
      </Avatar>
      <div>
        <div style={{ fontWeight: 500 }}>{params.row.name}</div>
      </div>
    </div>
  );
}

/**
 * Storage ID renderer - Shows storage name instead of ID
 */
function RenderCellStorageId({ params }: { params: any }) {
  const storageId = params.row.storage_id || '-';
  const storageName = useGetStorageName(storageId);

  return (
    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
      {storageName}
    </div>
  );
}

/**
 * Color renderer - Shows color code with visual color box
 */
function RenderCellColor({ params }: { params: any }) {
  const colorCode = params.row.color_code;

  if (!colorCode) {
    return <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>-</div>;
  }

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
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: colorCode,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    </Box>
  );
}

/**
 * Date renderer
 */
function RenderCellDate({ params, dateField }: { params: any; dateField: string }) {
  const dateValue = params.row[dateField];
  if (!dateValue) return '-';

  return new Date(dateValue).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProductListView() {
  const theme = useTheme();
  const { t } = useTranslation('menu');
  const router = useRouter();
  const { deleteDepartment } = useDeleteDepartment();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<IDepartmentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

  // Get departments from API
  const { departments, departmentsLoading, departmentsError } = useGetDepartments();

  // Pre-load storages to ensure data is cached
  useGetStorages();

  // Columns configuration
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('departments.name'),
        flex: 1,
        minWidth: 280,
        hideable: false,
        renderCell: (params) => <RenderCellDepartmentName params={params} />,
      },
      {
        field: 'storage_id',
        headerName: t('departments.storage'),
        width: 180,
        renderCell: (params) => <RenderCellStorageId params={params} />,
      },
      {
        field: 'color_code',
        headerName: t('departments.color'),
        width: 150,
        renderCell: (params) => <RenderCellColor params={params} />,
      },
      // {
      //   field: 'created_at',
      //   headerName: t('departments.created'),
      //   width: 200,
      //   sortable: true,
      //   renderCell: (params) => <RenderCellDate params={params} dateField="created_at" />,
      // },
      // {
    //   field: 'updated_at',de
      //   headerName: t('departments.updated'),
      //   width: 200,
      //   sortable: true,
      //   renderCell: (params) => <RenderCellDate params={params} dateField="updated_at" />,
      // },
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
            label={t('departments.edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            onClick={() => handleEditDepartment(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('departments.view')}
            icon={<Iconify icon="solar:eye-bold" />}
            onClick={() => handleViewDepartment(params.row)}
          />,
          <CustomGridActionsCellItem
            key="delete"
            showInMenu
            label={t('departments.delete')}
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => {
              setDepartmentToDelete(params.row.id);
              setDeleteDialogOpen(true);
            }}
            style={{ color: theme.vars.palette.error.main }}
          />,
        ],
      },
    ],
    [t, theme.vars.palette.error.main]
  );

  const handleEditDepartment = useCallback((id: string) => {
    router.push(paths.menu.product.edit(id));
  }, [router]);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (departmentToDelete) {
      try {
        await deleteDepartment(departmentToDelete);
        toast.success(t('success.deleteSuccess'));
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error(t('error.deleteFailed'));
      } finally {
        setDeleteDialogOpen(false);
        setDepartmentToDelete(null);
      }
    }
  }, [departmentToDelete, deleteDepartment, t]);

  const handleDeleteDepartment = useCallback((id: string) => {
    setDepartmentToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleViewDepartment = useCallback((department: IDepartmentItem) => {
    setSelectedDepartment(department);
    setViewModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedDepartment(null);
  }, []);

  // Render specifications for view modal
  const renderDepartmentSpecifications = useCallback((dept: IDepartmentItem) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const storageName = useGetStorageName(dept.storage_id);

    const specs: SpecificationRow[] = [
      {
        label: t('departments.name'),
        value: dept.name || '-',
      },
      {
        label: t('departments.color'),
        value: dept.color_code ? (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1,
                bgcolor: dept.color_code,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            {dept.color_code}
          </Box>
        ) : '-',
      },
      {
        label: t('departments.storage'),
        value: storageName || '-',
      },
      {
        label: t('departments.created'),
        value: new Date(dept.created_at).toLocaleString(),
      },
      {
        label: t('departments.updated'),
        value: new Date(dept.updated_at).toLocaleString(),
      },
    ];

    return <SpecificationsTable rows={specs} />;
  }, [t]);

  return (
    <>
      <GenericTableView<IDepartmentItem>
        data={Array.isArray(departments) ? departments : []}
        loading={departmentsLoading}
        columns={columns}
        breadcrumbs={{
          heading: t('departments.title'),
          links: [
            { name: t('app'), href: paths.menu.root },
            { name: t('departments.title') },
          ],
        }}
        addButton={{
          label: t('departments.add'),
          href: paths.menu.product.new,
        }}
        filterOptions={{}}
        initialFilters={{}}
        hideColumns={{}}
        hideColumnsTogglable={['created_at', 'updated_at', 'actions']}
        onDeleteRow={handleDeleteDepartment}
        onDeleteRows={async (ids) => {
          for (const id of ids) {
            try {
              await deleteDepartment(id);
            } catch (error) {
              console.error('Failed to delete:', error);
            }
          }
        }}
      />

      <GenericViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseModal}
        title={selectedDepartment?.name || t('departments.title')}
        data={selectedDepartment}
        renderContent={renderDepartmentSpecifications}
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
        <DialogTitle>{t('departments.deleteConfirm')}</DialogTitle>
        <DialogContent>
          {t('departments.deleteMessage')}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {t('departments.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            autoFocus
          >
            {t('departments.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}