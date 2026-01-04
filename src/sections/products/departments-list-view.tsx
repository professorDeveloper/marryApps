// ============================================================================
// DEPARTMENTS LIST VIEW - REAL API INTEGRATION
// ============================================================================

import type { GridColDef } from '@mui/x-data-grid';
import type { IDepartmentItem } from 'src/types/departments';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetDepartments, useDeleteDepartment } from 'src/actions/departments';

import { Iconify } from 'src/components/iconify';
import {
  GenericTableView,
} from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';

// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Department name renderer
 */
function RenderCellDepartmentName({ params }: { params: any }) {
  const { t } = useTranslation('menu');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Iconify icon="solar:add-folder-bold" width={24} height={24} />
      <div>
        <div style={{ fontWeight: 500 }}>{params.row.name}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{params.row.name_i18n}</div>
      </div>
    </div>
  );
}

/**
 * Storage ID renderer
 */
function RenderCellStorageId({ params }: { params: any }) {
  const storageId = params.row.storage_id || '-';
  return (
    <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', opacity: 0.8 }}>
      {storageId}
    </div>
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

  // Get departments from API
  const { departments, departmentsLoading, departmentsError } = useGetDepartments();

  // Columns configuration
  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('departments.name') || 'Name',
        flex: 1,
        minWidth: 280,
        hideable: false,
        renderCell: (params) => <RenderCellDepartmentName params={params} />,
      },
      {
        field: 'storage_id',
        headerName: t('departments.storage') || 'Storage ID',
        width: 180,
        renderCell: (params) => <RenderCellStorageId params={params} />,
      },
      {
        field: 'created_at',
        headerName: t('departments.created') || 'Created',
        width: 200,
        sortable: true,
        renderCell: (params) => <RenderCellDate params={params} dateField="created_at" />,
      },
      {
        field: 'updated_at',
        headerName: t('departments.updated') || 'Updated',
        width: 200,
        sortable: true,
        renderCell: (params) => <RenderCellDate params={params} dateField="updated_at" />,
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
            label={t('departments.edit') || 'Edit'}
            icon={<Iconify icon="solar:pen-bold" />}
            onClick={() => handleEditDepartment(params.row.id)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('departments.view') || 'View'}
            icon={<Iconify icon="solar:eye-bold" />}
            onClick={() => handleViewDepartment(params.row)}
          />,
          <CustomGridActionsCellItem
            showInMenu
            label={t('departments.delete') || 'Delete'}
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            onClick={() => handleDeleteDepartment(params.row.id)}
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

  const handleDeleteDepartment = useCallback(
    async (id: string) => {
      try {
        await deleteDepartment(id);
        // Success notification can be added here
      } catch (error) {
        console.error('Failed to delete:', error);
        // Error notification can be added here
      }
    },
    [deleteDepartment]
  );

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
    const specs = [
      {
        label: t('departments.name') || 'Name',
        value: dept.name || '-',
      },
      {
        label: t('departments.name_i18n') || 'Name (i18n)',
        value: dept.name_i18n || '-',
      },
      {
        label: t('departments.storage') || 'Storage ID',
        value: dept.storage_id || '-',
      },
      {
        label: t('departments.created') || 'Created',
        value: new Date(dept.created_at).toLocaleString(),
      },
      {
        label: t('departments.updated') || 'Updated',
        value: new Date(dept.updated_at).toLocaleString(),
      },
    ];

    return <SpecificationsTable rows={specs} />;
  }, [t]);

  return (
    <>
      <GenericTableView<IDepartmentItem>
        data={departments}
        loading={departmentsLoading}
        columns={columns}
        breadcrumbs={{
          heading: t('departments.title') || 'Departments',
          links: [
            { name: t('app') || 'Menu', href: paths.menu.root },
            { name: t('departments.title') || 'Departments' },
          ],
        }}
        addButton={{
          label: t('departments.add') || 'Add Department',
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
        title={selectedDepartment?.name || t('departments.title') || 'Department'}
        data={selectedDepartment}
        renderContent={renderDepartmentSpecifications}
        maxWidth="sm"
        slideDirection="left"
        position="right"
      />
    </>
  );
}