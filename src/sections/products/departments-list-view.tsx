import type { GridColDef } from '@mui/x-data-grid';
import type { IDepartmentItem } from 'src/types/departments.tsx';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Avatar, Button, Dialog, DialogTitle, DialogActions, DialogContent, Box, ListItemText } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useGetStorages, useGetDepartments, useDeleteDepartment, useGetCategoriesByDepartment } from 'src/actions/departments';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal } from 'src/components/generic-view-view';
import { getFullImageUrl } from 'src/utils/image-url';
import { getInitials, getAvatarColor } from 'src/utils/avatar';
import { Typography } from '@mui/material';

function RenderCellDepartmentName({ params }: { params: any }) {
  const { row } = params;
  const name = row.name || '-';
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load image asynchronously if picture_url exists
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

  // If no image, show avatar with initials
  const initials = getInitials(name);
  const bgColor = imageUrl ? undefined : (row.color_code || getAvatarColor(name));

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

/**
 * Storage ID renderer - Shows storage name instead of ID
 */
function RenderCellStorageId({ params }: { params: any }) {
  const storageName = params.row.storage_name || '-';

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

/**
 * Categories table component for department view modal
 */
/**
 * Categories table component for department view modal
 */
function CategoriesTable({ departmentId }: { departmentId: string }) {
  const { t } = useTranslation('menu');
  const theme = useTheme();
  const { categories, categoriesLoading } = useGetCategoriesByDepartment(departmentId);
  const { storages } = useGetStorages();
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string | null }>({});

  // Create storage map for quick lookup
  const storageMap = useMemo(() => {
    const map = new Map();
    storages.forEach((storage) => {
      map.set(storage.id, storage.name);
    });
    return map;
  }, [storages]);

  // Load images for categories
  useEffect(() => {
    const loadImages = async () => {
      const urls: { [key: string]: string | null } = {};
      for (const category of categories) {
        if (category.picture_url) {
          try {
            const url = await getFullImageUrl(category.picture_url);
            urls[category.id] = url;
          } catch (error) {
            console.error('Failed to load category image:', error);
            urls[category.id] = null;
          }
        } else {
          urls[category.id] = null;
        }
      }
      setImageUrls(urls);
    };

    if (categories.length > 0) {
      loadImages();
    }
  }, [categories]);

  if (categoriesLoading) {
    return (
      <Typography sx={{ color: 'text.primary' }}>
        {t('common.loading')}
      </Typography>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Typography sx={{ color: 'text.primary' }}>
        {t('common.noData')}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& th': {
            padding: '12px',
            textAlign: 'left',
            fontWeight: 600,
            color: 'text.primary',
            borderBottom: `2px solid`,
            borderColor: 'divider',
          },
          '& td': {
            padding: '12px',
            color: 'text.primary',
            borderBottom: `1px solid`,
            borderColor: 'divider',
          },
        }}
      >
        <thead>
          <tr>
            <th>{t('categories.name')}</th>
            <th>{t('categories.color')}</th>
            <th>{t('departments.storage')}</th>
            <th>{t('categories.created')}</th>
            <th>{t('categories.updated')}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    alt={category.name}
                    src={imageUrls[category.id] || undefined}
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: imageUrls[category.id] ? undefined : (category.color_code || '#ccc'),
                      color: '#fff',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                    }}
                  >
                    {!imageUrls[category.id] && getInitials(category.name)}
                  </Avatar>
                  <Typography sx={{ color: 'text.primary' }}>
                    {category.name}
                  </Typography>
                </Box>
              </td>
              <td>
                {category.color_code ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '4px',
                        bgcolor: category.color_code,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Typography sx={{ color: 'text.primary' }}>
                      {category.color_code}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ color: 'text.secondary' }}>-</Typography>
                )}
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {storageMap.get(category.storage_id) || '-'}
                </Typography>
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {new Date(category.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {new Date(category.updated_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
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
            label={t('departments.edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            onClick={() => handleEditDepartment(params.row.id)}
          />,
          <CustomGridActionsCellItem
            key="delete"
            // showInMenu
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
    return (
      <Box>
        <CategoriesTable departmentId={dept.id} />
      </Box>
    );
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
        onRowClick={(id) => {
          const department = Array.isArray(departments)
            ? departments.find(dept => dept.id === id)
            : undefined;
          if (department) {
            handleViewDepartment(department);
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