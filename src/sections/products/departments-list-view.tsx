import type { IDepartmentItem } from 'src/types/departments.tsx';
import type { DataTableColumn, DataTableDefaultConfig } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Avatar, Button, Dialog, IconButton, Typography, DialogTitle, ListItemText, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';
import { getInitials } from 'src/utils/avatar';
import { getFullImageUrl } from 'src/utils/image-url';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetStorages, useGetDepartments, useDeleteDepartment, useGetCategoriesByDepartment } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { DEPARTMENTS_TABLE_PERSIST_KEY } from 'src/sections/menu/compounds/utilities';

interface CellRenderParams {
  row: IDepartmentItem;
}

function RenderCellDepartmentName({ row }: CellRenderParams) {
  const name = row.name || '-';

  return (
    <Box
      sx={{
        py: 2,
        width: 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <ListItemText primary={<span>{name}</span>} />
    </Box>
  );
}

function RenderCellStorageId({ row }: CellRenderParams) {
  const storageName = row.storage_name || '-';

  return (
    <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
      {storageName}
    </Box>
  );
}

function RenderCellColor({ row }: CellRenderParams) {
  const colorCode = row.color_code;

  if (!colorCode) {
    return <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>-</Box>;
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

function CategoriesTable({ departmentId }: { departmentId: string }) {
  const { t } = useTranslation('menu');
  const { categories, categoriesLoading } = useGetCategoriesByDepartment(departmentId);
  const { storages } = useGetStorages();
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string | null }>({});

  // Create storage map for quick lookup
  const storageMap = useMemo(() => {
    const map = new Map<string, string>();
    storages.forEach((storage) => {
      map.set(storage.id, storage.name || '');
    });
    return map;
  }, [storages]);

  // Load images for categories in parallel
  useEffect(() => {
    const loadImages = async () => {
      if (categories.length === 0) return;

      const imagePromises = categories.map(async (category) => {
        if (!category.picture_url) {
          return { id: category.id, url: null };
        }
        try {
          const url = await getFullImageUrl(category.picture_url);
          return { id: category.id, url };
        } catch (error) {
          console.error('Failed to load category image:', error);
          return { id: category.id, url: null };
        }
      });

      const results = await Promise.all(imagePromises);
      const urls: { [key: string]: string | null } = {};
      results.forEach(({ id, url }) => {
        urls[id] = url;
      });
      setImageUrls(urls);
    };

    loadImages();
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
                  {fDate(category.created_at)}
                </Typography>
              </td>
              <td>
                <Typography sx={{ color: 'text.primary' }}>
                  {fDate(category.updated_at)}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

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
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  // Debounce quick filter input before hitting search API
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Get departments from API (supports server-side search)
  const { departments, departmentsTotal } = useGetDepartments(
    debouncedSearchQuery,
    {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
    }
  );

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchQuery]);

  const handleEditDepartment = useCallback((id: string) => {
    router.push(paths.menu.product.edit(id));
  }, [router]);

  // Columns configuration for DataTable
  const columns = useMemo<DataTableColumn<IDepartmentItem>[]>(
    () => [
      {
        key: 'name',
        label: t('departments.name'),
        width: '280px',
        sortable: false,
        filterable: false,
        getValue: (row) => row.name || '',
        renderCell: ({ row }) => <RenderCellDepartmentName row={row} />,
      },
      {
        key: 'storage_id',
        label: t('departments.storage'),
        width: '4fr',
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
        width: '60px',
        sortable: false,
        filterable: false,
        getValue: () => '',
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleEditDepartment(row.id)}
              title={t('departments.edit')}
            >
              <Iconify icon="solar:pen-bold" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setDepartmentToDelete(row.id);
                setDeleteDialogOpen(true);
              }}
              title={t('departments.delete')}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
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
      order: ['name', 'storage_id', 'color_code', 'actions'],
      visibility: {
        name: true,
        storage_id: true,
        color_code: true,
        actions: true,
      },
      widths: {
        name: '4fr',
        storage_id: '1fr',
        color_code: '1fr',
        actions: '60px',
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
            setPaginationModel({ page: 0, pageSize: 20 });
          }}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          page={paginationModel.page}
          rowsPerPage={paginationModel.pageSize}
          totalCount={departmentsTotal || 0}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(page) => {
            setPaginationModel((prev) => ({ ...prev, page }));
          }}
          onRowsPerPageChange={(pageSize) => {
            setPaginationModel({ page: 0, pageSize });
          }}
          getRowId={(row) => row.id}
          headerActions={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              href={paths.menu.product.new}
              size="small"
            >
              {t('departments.add')}
            </Button>
          }
          emptyTitle={t('departments.noData', 'No departments found')}
          emptySubtitle={t('departments.noDataSubtitle', 'Try adjusting your search or filters')}
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
