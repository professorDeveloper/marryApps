import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, ListItemText } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { toast } from 'src/components/snackbar';
import { useDeleteStorage, useGetStorages } from 'src/actions/departments';
import { useGetBranches } from 'src/actions/branches';
import { getFullImageUrl } from 'src/utils/image-url';
import { getAvatarColor, getInitials } from 'src/utils/avatar';

function RenderCellStorageName({ params }: { params: any }) {
  const { row } = params;
  const name = row.name || '-';

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (row.picture_url) {
      const loadImage = async () => {
        try {
          setLoading(true);
          const url = await getFullImageUrl(row.picture_url);
          setImageUrl(url);
        } catch (error) {
          console.error('Failed to load image:', error);
          setImageUrl(null);
        } finally {
          setLoading(false);
        }
      };
      loadImage();
    } else {
      setImageUrl(null);
    }
  }, [row.picture_url]);

  const initials = getInitials(name);
  const bgColor = imageUrl ? undefined : row.color_code || getAvatarColor(name);

  return (
    <Box
      sx={{
        py: 2,
        gap: 2,
        width: 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Avatar
        alt={name}
        src={imageUrl || undefined}
        variant="rounded"
        sx={{
          width: 64,
          height: 64,
          bgcolor: bgColor,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '20px',
          borderRadius: '15%',
        }}
      >
        {!imageUrl && !loading && initials}
        {loading && '...'}
      </Avatar>

      <ListItemText primary={<span>{name}</span>} />
    </Box>
  );
}

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

export function WarehouseListView() {
  const { t } = useTranslation('menu');
  const theme = {
    vars: {
      palette: {
        error: {
          main: '#f44336',
        },
      },
    },
  };
  const router = useRouter();
  const { storages, storagesLoading } = useGetStorages();
  const { branches } = useGetBranches();
  const { deleteStorage } = useDeleteStorage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storageToDelete, setStorageToDelete] = useState<string | null>(null);

  const branchNameById = useMemo(() => {
    const map = new Map<string, string>();
    (branches || []).forEach((b) => {
      if (b.id) {
        map.set(b.id, b.name || b.id);
      }
    });
    return map;
  }, [branches]);

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
      toast.success(t('success', 'Success'));
    } catch (error) {
      console.error('Failed to delete storage:', error);
      toast.error(t('error', 'Error'));
    } finally {
      setDeleteDialogOpen(false);
      setStorageToDelete(null);
    }
  }, [deleteStorage, storageToDelete, t]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('warehouse.name', 'Name'),
        flex: 1,
        minWidth: 240,
        renderCell: (params) => <RenderCellStorageName params={params} />,
      },
      {
        field: 'branch_id',
        headerName: t('warehouse.branch', 'Branch'),
        width: 220,
        valueGetter: (_value, row) =>
          row.branch_id ? branchNameById.get(row.branch_id) || row.branch_id : '-',
      },
      {
        field: 'color_code',
        headerName: t('warehouse.color', 'Color'),
        width: 140,
        renderCell: (params) => <RenderCellColor params={params} />,
      },
      // {
      //   field: 'created_at',
      //   headerName: t('created', 'Created'),
      //   width: 200,
      //   valueGetter: (_value, row) =>
      //     row.created_at ? new Date(row.created_at).toLocaleString() : '-',
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
            label={t('warehouse.edit', 'Edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            onClick={() => handleEdit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            key="delete"
            showInMenu
            label={t('warehouse.delete', 'Delete')}
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            style={{ color: theme.vars.palette.error.main }}
            onClick={() => {
              setStorageToDelete(params.row.id);
              setDeleteDialogOpen(true);
            }}
          />,
        ],
      },
    ],
    [branchNameById, handleEdit, t]
  );

  return (
    <>
      <GenericTableView
        data={Array.isArray(storages) ? storages : []}
        loading={storagesLoading}
        columns={columns}
        breadcrumbs={{
          heading: t('warehouse.title', 'Warehouse'),
          links: [
            { name: t('app'), href: paths.menu.root },
            { name: t('warehouse.title', 'Warehouse'), href: paths.warehouse.root },
            { name: t('warehouse.list', 'List') },
          ],
        }}
        addButton={{
          label: t('warehouse.add', 'Add Warehouse'),
          href: paths.warehouse.new,
        }}
        onDeleteRow={(id) => {
          setStorageToDelete(id);
          setDeleteDialogOpen(true);
        }}
        onDeleteRows={async (ids) => {
          for (const id of ids) {
            try {
              await deleteStorage(id);
            } catch (error) {
              console.error('Failed to delete storage:', error);
            }
          }
        }}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('deleteConfirm', "O'chirish")}</DialogTitle>
        <DialogContent>{t('deleteMessage', 'Haqiqatan ham o‘chirmoqchimisiz?')}</DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} autoFocus>
            {t('delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
