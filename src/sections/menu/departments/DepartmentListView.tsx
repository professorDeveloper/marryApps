/**
 * Department list/view component with table and delete confirmation
 */

import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';
import type { IDepartmentItem } from 'src/types/departments.tsx';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useDeleteDepartment, useGetDepartments, useGetStorages } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DashboardContent } from 'src/layouts/dashboard';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';
import { StorageFilter } from 'src/sections/common/data-table/components/StorageFilter';
import { DEPARTMENTS_TABLE_PERSIST_KEY } from 'src/sections/menu/compounds/utilities';

import { TABLE_COLUMN_ORDER, TABLE_COLUMN_VISIBILITY, TABLE_COLUMN_WIDTHS } from './constants';
import { CategoriesTable } from './components/CategoriesTable';
import { RouterLink } from 'src/routes/components';
import {
  RenderCellColor,
  RenderCellDepartmentName,
  RenderCellStorageId,
} from './components/DepartmentTableCells';

export function DepartmentListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const { deleteDepartment } = useDeleteDepartment();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<IDepartmentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [storageId, setStorageId] = useState('');
  const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
  const { rowsPerPage } = usePaginationRows();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: rowsPerPage,
  });
  const { storages } = useGetStorages();

  // Debounce quick filter input before hitting search API
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Get departments from API (supports server-side search, storage filter, and sort)
  const { departments, departmentsTotal } = useGetDepartments(
    debouncedSearchQuery,
    {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
      storage_id: storageId || undefined,
      sort_by: sortState.key || undefined,
      sort_order: (sortState.dir === 'asc' || sortState.dir === 'desc') ? sortState.dir : undefined,
    }
  );

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: rowsPerPage }));
  }, [rowsPerPage]);

  const handleEditDepartment = useCallback((id: string) => {
    router.push(paths.menu.product.edit(id));
  }, [router]);

  // Columns configuration for DataTable
  const columns = useMemo<DataTableColumn<IDepartmentItem>[]>(
    () => [
      {
        key: 'name',
        label: t('departments.name'),
        width: '4fr',
        sortable: false,
        filterable: false,
        getValue: (row) => row.name || '',
        renderCell: ({ row }) => <RenderCellDepartmentName row={row} />,
      },
      {
        key: 'storage_id',
        label: t('departments.storage'),
        width: '3fr',
        sortable: false,
        filterable: false,
        getValue: (row) => row.storage_name || '',
        renderCell: ({ row }) => <RenderCellStorageId row={row} />,
      },
      {
        key: 'color_code',
        label: t('departments.color'),
        width: '1fr',
        sortable: false,
        filterable: false,
        getValue: (row) => row.color_code || '',
        renderCell: ({ row }) => <RenderCellColor row={row} />,
      },
      {
        key: 'actions',
        label: t('actions'),
        width: '0.5fr',
        sortable: false,
        filterable: false,
        getValue: () => '',
        renderCell: ({ row }) => (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center', 
            py: 1.5, 
            px: 1
          }}>
            <IconButton
              size="small"
              onClick={() => handleEditDepartment(row.id)}
              title={t('departments.edit')}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'primary.main'
                }
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setDepartmentToDelete(row.id);
                setDeleteDialogOpen(true);
              }}
              title={t('departments.delete')}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                  color: 'error.dark'
                }
              }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [t, handleEditDepartment]
  );

  // Default configuration for DataTable
  const defaultConfig = useMemo<DataTableDefaultConfig>(
    () => ({
      order: TABLE_COLUMN_ORDER as any,
      visibility: TABLE_COLUMN_VISIBILITY as any,
      widths: {
        name: TABLE_COLUMN_WIDTHS.name,
        storage_id: TABLE_COLUMN_WIDTHS.storage,
        color_code: TABLE_COLUMN_WIDTHS.color,
        actions: TABLE_COLUMN_WIDTHS.actions,
      },
    }),
    []
  );

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

  const handleCloseModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedDepartment(null);
  }, []);

  // Render specifications for view modal
  const renderDepartmentSpecifications = useCallback((dept: IDepartmentItem) => (
    <Box>
      <CategoriesTable departmentId={dept.id} />
    </Box>
  ), []);

  return (
    <>
      <DashboardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100vh',
          '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
          '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
        }}
      >
        <DeductionUtilityDataTable<IDepartmentItem>
          persistKey={DEPARTMENTS_TABLE_PERSIST_KEY}
          data={Array.isArray(departments) ? departments : []}
          columns={columns}
          defaultConfig={defaultConfig}
          onReset={() => {
            setSearchQuery('');
            setStorageId('');
            setSortState({ key: null, dir: null });
            setPaginationModel({ page: 0, pageSize: 20 });
          }}
          search={{ value: searchQuery, onChange: setSearchQuery }}
          onSortChange={(sort) => {
            setSortState({ key: sort.key, dir: sort.dir });
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          toolbarActions={
            <StorageFilter
              storageId={storageId || ''}
              storages={(storages || []).map((s: any) => ({ id: s.id, name: s.name }))}
              onStorageChange={(id: string) => {
                setStorageId(id);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              label={t('common.storage')}
            />
          }
          pagination={{
            page: paginationModel.page,
            rowsPerPage: paginationModel.pageSize,
            totalCount: departmentsTotal || 0,
            rowsPerPageOptions: [10, 20, 50, 100],
            onPageChange: (page) => {
              setPaginationModel((prev) => ({ ...prev, page }));
            },
            onRowsPerPageChange: (pageSize) => {
              setPaginationModel({ page: 0, pageSize });
            },
          }}
          getRowId={(row) => row.id}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              component={RouterLink}
              href={paths.menu.product.new}
              size="small"
            >
              {t('departments.add')}
            </Button>
          }
          emptyTitle={t('departments.noData')}
          emptySubtitle={t('departments.noDataSubtitle')}
          showTotals={false}
        />
      </DashboardContent>

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
