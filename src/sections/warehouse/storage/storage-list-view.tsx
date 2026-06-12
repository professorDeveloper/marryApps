import type { IStorageItem } from 'src/types/departments.tsx';
import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import { Box, Button, Dialog, IconButton, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetStorages, useDeleteStorage } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { RenderCell } from 'src/components/RenderCell';

import { CELL_SX } from 'src/sections/common/data-table/utils/constants';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

function RenderCellColor({ params }: { params: any }) {
  const colorCode = params.row.color_code;

  if (!colorCode) {
    return (
      <Box sx={CELL_SX}>
        -
      </Box>
    );
  }

    return (
      <Box sx={CELL_SX}>
        <Box
          sx={{
            width: 40,
            height: 32,
            borderRadius: '6px',
            bgcolor: colorCode,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
      </Box>
    );
}

export function WarehouseStorageListView() {
  const { t } = useTranslation('menu');
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { rowsPerPage } = usePaginationRows();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: rowsPerPage,
  });

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: rowsPerPage }));
  }, [rowsPerPage]);

  const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });

  const { storages, storagesLoading, storagesTotal } = useGetStorages(debouncedSearchQuery, {
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
    sort_by: sortState.key || undefined,
    sort_order: sortState.dir || undefined,
  });
  const { deleteStorage } = useDeleteStorage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storageToDelete, setStorageToDelete] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchQuery]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push(paths.warehouse.storage.edit(id));
    },
    [router]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!storageToDelete) return;
    try {
      await deleteStorage(storageToDelete);
      toast.success(t('success'));
    } catch (error) {
      console.error('Failed to delete storage:', error);
      toast.error(t('common.error'));
    } finally {
      setDeleteDialogOpen(false);
      setStorageToDelete(null);
    }
  }, [deleteStorage, storageToDelete, t]);

  const handleDeleteStorage = useCallback((id: string) => {
    setStorageToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo<DataTableColumn<IStorageItem>[]>(
    () => [
      {
        key: 'name',
        label: t('warehouse.name'),
        width: '7fr',
        sortable: true,
        align: 'left',
        getValue: (row) => row.name || '',
        renderCell: ({ row }) => <RenderCell label={row.name} />,
      },
      {
        key: 'color_code',
        label: t('warehouse.color'),
        width: '1.5fr',
        sortable: true,
        filterable: true,
        align: 'left',
        getValue: (row) => row.color_code || '',
        renderCell: ({ row }) => <RenderCellColor params={{ row }} />,
      },
      {
        key: 'actions',
        label: t('actions'),
        width: '0.5fr',
        sortable: false,
        filterable: false,
        align: 'right',
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
              onClick={() => handleEdit(row.id)}
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
              onClick={() => handleDeleteStorage(row.id)}
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
    [handleEdit, handleDeleteStorage, t]
  );

  // Default configuration for DataTable
  const defaultConfig: DataTableDefaultConfig = {
    order: ['name', 'color_code', 'actions'],
    visibility: {
      name: true,
      color_code: true,
      actions: true,
    },
    widths: {
      name: '7fr',
      color_code: '1.5fr',
      actions: '0.5fr',
    },
  };

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
        <DeductionUtilityDataTable<IStorageItem>
          persistKey="warehouse-storage-list"
          data={Array.isArray(storages) ? storages : []}
          columns={columns}
          defaultConfig={defaultConfig}
          onReset={() => {
            setSearchQuery('');
            setSortState({ key: null, dir: null });
            setPaginationModel({ page: 0, pageSize: rowsPerPage });
          }}
          search={{ value: searchQuery, onChange: setSearchQuery }}
          onSortChange={(sort) => {
            setSortState({ key: sort.key, dir: sort.dir });
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          pagination={{
            page: paginationModel.page,
            rowsPerPage: paginationModel.pageSize,
            totalCount: storagesTotal || 0,
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
              onClick={() => router.push(paths.warehouse.storage.new)}
            >
              {t('warehouse.add')}
            </Button>
          }
          emptyTitle={t('warehouse.noData')}
          emptySubtitle={t('warehouse.noDataSubtitle')}
        />
      </DashboardContent>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('deleteConfirm')}</DialogTitle>
        <DialogContent>{t('deleteMessage')}</DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
