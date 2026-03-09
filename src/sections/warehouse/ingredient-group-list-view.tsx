import type { GridColDef } from '@mui/x-data-grid';
import type { IIngredientGroupItem } from 'src/types/ingredient-group';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Box,
  ListItemText,
  Typography,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useGetIngredientGroups, useDeleteIngredientGroup } from 'src/actions/ingredient-group';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal } from 'src/components/generic-view-view';
import { getFullImageUrl } from 'src/utils/image-url';
import { getInitials, getAvatarColor } from 'src/utils/avatar';

function RenderCellGroupName({ params }: { params: any }) {
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

export function IngredientGroupListView() {
  const { t } = useTranslation('menu');
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { ingredientGroups, ingredientGroupsLoading } = useGetIngredientGroups(debouncedSearchQuery);
  const { deleteIngredientGroup } = useDeleteIngredientGroup();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<IIngredientGroupItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const columns = useMemo<GridColDef[]>(() => [
    {
      field: 'name',
      headerName: t('warehouse.name'),
      flex: 1,
      minWidth: 280,
      hideable: false,
      renderCell: (params) => <RenderCellGroupName params={params} />,
    },
    {
      field: 'color_code',
      headerName: t('warehouse.color'),
      width: 150,
      renderCell: (params) => <RenderCellColor params={params} />,
    },
    {
      type: 'actions',
      field: 'actions',
      // headerName: ' ',
      headerName: t('actions'),
      width: 150,
      // align: 'right',
      // headerAlign: 'right',
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      getActions: (params) => [
        <CustomGridActionsCellItem
          // showInMenu
          label={t('warehouse.edit')}
          icon={<Iconify icon="solar:pen-bold" />}
          onClick={() => handleEditGroup(params.row.id)}
        />,
        <CustomGridActionsCellItem
          key="delete"
          // showInMenu
          label={t('warehouse.delete')}
          icon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={() => {
            setGroupToDelete(params.row.id);
            setDeleteDialogOpen(true);
          }}
          style={{ color: theme.palette.error.main }}
        />,
      ],
    },
  ], [t, theme.palette.error.main]);

  const handleEditGroup = useCallback((id: string) => {
    router.push(paths.warehouse.ingredients_group.edit(id));
  }, [router]);

  const handleConfirmDelete = useCallback(async () => {
    if (groupToDelete) {
      try {
        await deleteIngredientGroup(groupToDelete);
        toast.success(t('success.deleteSuccess'));
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error(t('error.deleteFailed'));
      } finally {
        setDeleteDialogOpen(false);
        setGroupToDelete(null);
      }
    }
  }, [groupToDelete, deleteIngredientGroup, t]);

  const handleDeleteGroup = useCallback((id: string) => {
    setGroupToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleViewGroup = useCallback((group: IIngredientGroupItem) => {
    setSelectedGroup(group);
    setViewModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedGroup(null);
  }, []);

  const renderGroupSpecifications = useCallback((group: IIngredientGroupItem) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {group.picture_url && (
        <Box
          component="img"
          src={group.picture_url}
          alt={group.name}
          sx={{ width: '100%', borderRadius: 1, maxHeight: 300, objectFit: 'cover' }}
        />
      )}
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{t('warehouse.id')}</Typography>
        <Typography variant="body2">{group.id}</Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{t('warehouse.name')}</Typography>
        <Typography variant="body2">{group.name}</Typography>
      </Box>
      {group.color_code && (
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>{t('warehouse.color')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: group.color_code,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <Typography variant="body2">{group.color_code}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  ), [t]);

  return (
    <>
      <GenericTableView<IIngredientGroupItem>
        data={Array.isArray(ingredientGroups) ? ingredientGroups : []}
        loading={ingredientGroupsLoading}
        columns={columns}
        breadcrumbs={{
          heading: t('ingredientGroups.title'),
          links: [
            { name: t('app'), href: paths.menu.root },
            { name: t('ingredientGroups.title') },
          ],
        }}
        addButton={{
          label: t('warehouse.addGroup'),
          href: paths.warehouse.ingredients_group.new,
        }}
        filterOptions={{}}
        initialFilters={{}}
        hideColumns={{}}
        hideColumnsTogglable={['actions']}
        onDeleteRow={handleDeleteGroup}
        onDeleteRows={async (ids) => {
          for (const id of ids) {
            try {
              await deleteIngredientGroup(id);
            } catch (error) {
              console.error('Failed to delete:', error);
            }
          }
        }}
        onRowClick={(id) => {
          const group = Array.isArray(ingredientGroups)
            ? ingredientGroups.find(g => g.id === id)
            : undefined;
          if (group) {
            handleViewGroup(group);
          }
        }}
        onQuickFilterChange={setSearchQuery}
      />

      <GenericViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseModal}
        title={selectedGroup?.name || t('warehouse.ingredientGroups')}
        data={selectedGroup}
        renderContent={renderGroupSpecifications}
        maxWidth="sm"
        slideDirection="left"
        position="right"
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('warehouse.deleteConfirm')}</DialogTitle>
        <DialogContent>
          {t('warehouse.deleteMessage')}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {t('warehouse.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            autoFocus
          >
            {t('warehouse.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
