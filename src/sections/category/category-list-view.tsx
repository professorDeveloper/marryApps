import type { GridColDef } from '@mui/x-data-grid';
import type { ICategory } from 'src/types/category';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent, ListItemText } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import { getInitials, getAvatarColor } from 'src/utils/avatar';
import { getFullImageUrl } from 'src/utils/image-url';
import { useGetCategories, useDeleteCategory, useGetGoodsByCategory } from 'src/actions/categories';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable, type SpecificationRow } from 'src/components/generic-view-view';

/**
 * Goods table component
 */
function GoodsTable({ categoryId }: { categoryId: string }) {
  const { t } = useTranslation('menu');
  const { goods, goodsLoading } = useGetGoodsByCategory(categoryId);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string | null }>({});

  // Debug log
  useEffect(() => {
    console.log('GoodsTable - categoryId:', categoryId);
    console.log('GoodsTable - goods:', goods);
    console.log('GoodsTable - goodsLoading:', goodsLoading);
  }, [categoryId, goods, goodsLoading]);

  // Load images for goods
  useEffect(() => {
    const loadImages = async () => {
      const urls: { [key: string]: string | null } = {};
      for (const item of goods) {
        if (item.picture_url) {
          try {
            const url = await getFullImageUrl(item.picture_url);
            urls[item.id] = url;
          } catch (error) {
            console.error('Failed to load goods image:', error);
            urls[item.id] = null;
          }
        } else {
          urls[item.id] = null;
        }
      }
      setImageUrls(urls);
    };

    if (goods.length > 0) {
      loadImages();
    }
  }, [goods]);

  if (goodsLoading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!goods || goods.length === 0) {
    return <div>{t('common.noData')}</div>;
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>{t('mealsProducts.name')}</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>{t('mealsProducts.description')}</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>{t('mealsProducts.price')}</th>
            {/* <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>{t('departments.color')}</th> */}
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>{t('mealsProducts.cookingTime')}</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>{t('mealsProducts.createdAt')}</th>
          </tr>
        </thead>
        <tbody>
          {goods.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    alt={item.name}
                    src={imageUrls[item.id] || undefined}
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: imageUrls[item.id] ? undefined : '#ccc',
                      color: '#fff',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                    }}
                  >
                    {!imageUrls[item.id] && getInitials(item.name)}
                  </Avatar>
                  <span>{item.name}</span>
                </Box>
              </td>
              <td style={{ padding: '12px', fontSize: '0.875rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.description || '-'}
              </td>
              <td style={{ padding: '12px' }}>
                {parseFloat(item.price).toLocaleString()} so'm
              </td>
              {/* <td style={{ padding: '12px' }}>
                {item.color_code ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '4px',
                        bgcolor: item.color_code,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <span>{item.color_code}</span>
                  </Box>
                ) : (
                  '-'
                )}
              </td> */}
              <td style={{ padding: '12px' }}>
                {item.cook_time} min
              </td>
              <td style={{ padding: '12px' }}>
                {new Date(item.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

/**
 * Category image/avatar renderer
 */
function RenderCellCategory({ params }: { params: any }) {
  const { i18n } = useTranslation('menu');
  const category = params.row as ICategory;
  const currentLanguage = i18n.language;

  // Get name based on current language
  let name = '-';
  if (currentLanguage.startsWith('en')) {
    name = category.name_en || category.name || '-';
  } else if (currentLanguage.startsWith('ru')) {
    name = category.name_ru || category.name || '-';
  } else {
    // Default to Uzbek (uz)
    name = category.name || '-';
  }

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load image asynchronously if picture_url exists
  useEffect(() => {
    if (category.picture_url) {
      const loadImage = async () => {
        try {
          setLoading(true);
          const url = await getFullImageUrl(category.picture_url);
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
  }, [category.picture_url]);

  // If no image, show avatar with initials
  const initials = getInitials(name);
  const bgColor = imageUrl ? undefined : getAvatarColor(name);

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
 * Storage name renderer
 */
function RenderCellStorage({ params }: { params: any }) {
  const category = params.row as ICategory;
  const storageName = category.storage_name || '-';
  return <span>{storageName}</span>;
}

/**
 * Department name renderer
 */
function RenderCellDepartment({ params }: { params: any }) {
  const category = params.row as ICategory;
  const departmentName = category.department_name || '-';
  return <span>{departmentName}</span>;
}

/**
 * Color renderer - Shows color code with visual color box
 */
function RenderCellColor({ params }: { params: any }) {
  const category = params.row as ICategory;
  const colorCode = category.color_code;

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

function CategorySpecifications({ category, t }: { category: ICategory; t: any }) {
  return (
    <Box>
      <GoodsTable categoryId={category.id} />
    </Box>
  );
}

export function CategoryListView() {
  console.log('CategoryListView rendered');
  const theme = useTheme();
  const { t } = useTranslation('menu');

  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // API hooks
  const { categories, categoriesLoading } = useGetCategories(debouncedSearchQuery);
  const { deleteCategory } = useDeleteCategory();

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
      // {
      //   field: 'storage_id',
      //   headerName: t('categories.storage'),
      //   width: 180,
      //   renderCell: (params) => <RenderCellStorage params={params} />,
      // },
      {
        field: 'department_id',
        headerName: t('categories.department'),
        width: 180,
        renderCell: (params) => <RenderCellDepartment params={params} />,
      },
      {
        field: 'color_code',
        headerName: t('departments.color'),
        width: 150,
        renderCell: (params) => <RenderCellColor params={params} />,
      },
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
            label={t('categories.edit')}
            icon={<Iconify icon="solar:pen-bold" />}
            href={paths.menu.category.edit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            key="delete"
            // showInMenu
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
        onRowClick={(id) => {
          const category = categories.find(cat => cat.id === id);
          if (category) {
            openModal(category);
          }
        }}
        onQuickFilterChange={setSearchQuery}
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
