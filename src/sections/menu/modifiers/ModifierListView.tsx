/**
 * Modifier list/view component with table and delete confirmation
 */

import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';
import type { IModifierItem } from 'src/types/modifiers';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useDeleteModifier, useGetModifiers } from 'src/actions/modifiers';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DashboardContent } from 'src/layouts/dashboard';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { TABLE_COLUMN_ORDER, TABLE_COLUMN_VISIBILITY, TABLE_COLUMN_WIDTHS, MODIFIERS_TABLE_PERSIST_KEY } from './constants';
import { RouterLink } from 'src/routes/components';
import {
  RenderCellModifierName,
  RenderCellModifierCode,
  RenderCellIsActive,
  RenderCellCreatedAt,
} from './components/ModifierTableCells';

export function ModifierListView() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const { deleteModifier } = useDeleteModifier();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modifierToDelete, setModifierToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { rowsPerPage } = usePaginationRows();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: rowsPerPage,
  });

  // Debounce quick filter input before hitting search API
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Get modifiers from API (supports server-side search)
  const { modifiers, modifiersTotal } = useGetModifiers(
    debouncedSearchQuery,
    {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
    }
  );

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: rowsPerPage }));
  }, [rowsPerPage]);

  const handleEditModifier = useCallback((id: string) => {
    router.push(paths.menu.modifiers.edit(id));
  }, [router]);

  // Columns configuration for DataTable
  const columns = useMemo<DataTableColumn<IModifierItem>[]>(
    () => [
      {
        key: 'name',
        label: t('modifiers.name'),
        width: TABLE_COLUMN_WIDTHS.name,
        sortable: false,
        filterable: false,
        getValue: (row) => row.name || '',
        renderCell: ({ row }) => <RenderCellModifierName row={row} />,
      },
      {
        key: 'code',
        label: t('modifiers.code'),
        width: TABLE_COLUMN_WIDTHS.code,
        sortable: false,
        filterable: false,
        getValue: (row) => row.code || '',
        renderCell: ({ row }) => <RenderCellModifierCode row={row} />,
      },
      {
        key: 'is_active',
        label: t('modifiers.isActive'),
        width: TABLE_COLUMN_WIDTHS.is_active,
        sortable: false,
        filterable: false,
        getValue: (row) => row.is_active ? 'Active' : 'Inactive',
        renderCell: ({ row }) => <RenderCellIsActive row={row} />,
      },
      {
        key: 'created_at',
        label: t('modifiers.createdAt'),
        width: TABLE_COLUMN_WIDTHS.created_at,
        sortable: false,
        filterable: false,
        getValue: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
        renderCell: ({ row }) => <RenderCellCreatedAt row={row} />,
      },
      {
        key: 'actions',
        label: t('actions'),
        width: TABLE_COLUMN_WIDTHS.actions,
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
              onClick={() => handleEditModifier(row.id)}
              title={t('modifiers.edit')}
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
                setModifierToDelete(row.id);
                setDeleteDialogOpen(true);
              }}
              title={t('modifiers.delete')}
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
    [t, handleEditModifier]
  );

  // Default configuration for DataTable
  const defaultConfig = useMemo<DataTableDefaultConfig>(
    () => ({
      order: TABLE_COLUMN_ORDER as any,
      visibility: TABLE_COLUMN_VISIBILITY as any,
      widths: {
        name: TABLE_COLUMN_WIDTHS.name,
        code: TABLE_COLUMN_WIDTHS.code,
        is_active: TABLE_COLUMN_WIDTHS.is_active,
        created_at: TABLE_COLUMN_WIDTHS.created_at,
        actions: TABLE_COLUMN_WIDTHS.actions,
      },
    }),
    []
  );

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (modifierToDelete) {
      try {
        await deleteModifier(modifierToDelete);
        toast.success(t('success.deleteSuccess'));
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error(t('error.deleteFailed'));
      } finally {
        setDeleteDialogOpen(false);
        setModifierToDelete(null);
      }
    }
  }, [modifierToDelete, deleteModifier, t]);

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
        <DeductionUtilityDataTable<IModifierItem>
          persistKey={MODIFIERS_TABLE_PERSIST_KEY}
          data={Array.isArray(modifiers) ? modifiers : []}
          columns={columns}
          defaultConfig={defaultConfig}
          onReset={() => {
            setSearchQuery('');
            setPaginationModel({ page: 0, pageSize: 20 });
          }}
          search={{ value: searchQuery, onChange: setSearchQuery }}
          pagination={{
            page: paginationModel.page,
            rowsPerPage: paginationModel.pageSize,
            totalCount: modifiersTotal || 0,
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
              href={paths.menu.modifiers.new}
              size="small"
            >
              {t('modifiers.add')}
            </Button>
          }
          emptyTitle={t('modifiers.noData')}
          emptySubtitle={t('modifiers.noDataSubtitle')}
          showTotals={false}
        />
      </DashboardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('modifiers.deleteConfirm')}</DialogTitle>
        <DialogContent>
          {t('modifiers.deleteMessage')}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {t('modifiers.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            autoFocus
          >
            {t('modifiers.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
