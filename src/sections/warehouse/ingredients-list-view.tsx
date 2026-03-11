import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import type { IIngredientItem } from 'src/types/ingredients';
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
import { useGetIngredients, useDeleteIngredient } from 'src/actions/ingredients';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal } from 'src/components/generic-view-view';
import { getFullImageUrl } from 'src/utils/image-url';
import { getInitials, getAvatarColor } from 'src/utils/avatar';

/**
 * Ingredient name renderer with avatar
 */
function RenderCellIngredientName({ params }: { params: any }) {
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
 * Group name renderer
 */
function RenderCellGroupName({ params }: { params: any }) {
    const groupName = params.row.group_name || '-';

    return (
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {groupName}
        </div>
    );
}

/**
 * Measurement renderer with translation
 */
function RenderCellMeasurement({ params, t }: { params: any; t: (key: string) => string }) {
    const measurement = params.row.measurement || '-';

    // Map backend values to translation keys
    const getMeasurementLabel = (value: string): string => {
        switch (value) {
            case 'kg':
                return t('ingredients.measurementKg');
            case 'l':
                return t('ingredients.measurementL');
            case 'piece':
                return t('ingredients.measurementDona');
            default:
                return value;
        }
    };

    return (
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {getMeasurementLabel(measurement)}
        </div>
    );
}

/**
 * Color renderer
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

export function IngredientListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 20,
    });
    const { ingredients, ingredientsLoading, ingredientsTotal } = useGetIngredients(
        debouncedSearchQuery,
        {
            limit: paginationModel.pageSize,
            offset: paginationModel.page * paginationModel.pageSize,
        }
    );
    const { deleteIngredient } = useDeleteIngredient();
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<IIngredientItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);
    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [debouncedSearchQuery]);

    // Columns configuration
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: t('warehouse.name'),
                flex: 1,
                minWidth: 280,
                hideable: false,
                renderCell: (params) => <RenderCellIngredientName params={params} />,
            },
            {
                field: 'group_name',
                headerName: t('warehouse.group'),
                width: 180,
                renderCell: (params) => <RenderCellGroupName params={params} />,
            },
            {
                field: 'measurement',
                headerName: t('warehouse.measurement'),
                width: 150,
                renderCell: (params) => <RenderCellMeasurement params={params} t={t} />,
            },
            {
                field: 'color_code',
                headerName: t('warehouse.color'),
                width: 150,
                align: 'center',
                renderCell: (params) => <RenderCellColor params={params} />,
            },
            {
                field: 'price_per_unit',
                headerName: t('warehouse.price'),
                width: 150,
                renderCell: (params) => (
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                        {params.row.price_per_unit ? `${params.row.price_per_unit}` : '-'}
                    </div>
                ),
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
                        label={t('warehouse.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        onClick={() => handleEditIngredient(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        // showInMenu
                        label={t('warehouse.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => {
                            setIngredientToDelete(params.row.id);
                            setDeleteDialogOpen(true);
                        }}
                        style={{ color: theme.palette.error.main }}
                    />,
                ],
            },
        ],
        [t, theme.palette.error.main]
    );

    const handleEditIngredient = useCallback((id: string) => {
        router.push(paths.warehouse.ingredients.edit(id));
    }, [router]);

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(async () => {
        if (ingredientToDelete) {
            try {
                await deleteIngredient(ingredientToDelete);
                toast.success(t('success.deleteSuccess'));
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error(t('error.deleteFailed'));
            } finally {
                setDeleteDialogOpen(false);
                setIngredientToDelete(null);
            }
        }
    }, [ingredientToDelete, deleteIngredient, t]);

    const handleDeleteIngredient = useCallback((id: string) => {
        setIngredientToDelete(id);
        setDeleteDialogOpen(true);
    }, []);

    const handleViewIngredient = useCallback((ingredient: IIngredientItem) => {
        setSelectedIngredient(ingredient);
        setViewModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setViewModalOpen(false);
        setSelectedIngredient(null);
    }, []);

    // Render specifications for view modal
    const renderIngredientSpecifications = useCallback((ingredient: IIngredientItem) => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ingredient.picture_url && (
                    <Box
                        component="img"
                        src={ingredient.picture_url}
                        alt={ingredient.name}
                        sx={{ width: '100%', borderRadius: 1, maxHeight: 300, objectFit: 'cover' }}
                    />
                )}
                {/* <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('warehouse.id')}
                    </Typography>
                    <Typography variant="body2">{ingredient.id}</Typography>
                </Box> */}
                <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('warehouse.name')}
                    </Typography>
                    <Typography variant="body2">{ingredient.name}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('warehouse.group')}
                    </Typography>
                    <Typography variant="body2">
                        {ingredient._expand?.group_id?.name ||
                            ingredient.group_name ||
                            ingredient.group_id ||
                            '-'}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('warehouse.measurement')}
                    </Typography>
                    <Typography variant="body2">{ingredient.measurement}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('warehouse.price')}
                    </Typography>
                    <Typography variant="body2">{ingredient.price_per_unit || '-'}</Typography>
                </Box>
                {/* {ingredient.color_code && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('warehouse.color')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    bgcolor: ingredient.color_code,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            />
                            <Typography variant="body2">{ingredient.color_code}</Typography>
                        </Box>
                    </Box>
                )} */}
            </Box>
        );
    }, [t]);

    return (
        <>
            <GenericTableView<IIngredientItem>
                data={Array.isArray(ingredients) ? ingredients : []}
                loading={ingredientsLoading}
                columns={columns}
                paginationMode="server"
                rowCount={ingredientsTotal || 0}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50, 100]}
                breadcrumbs={{
                    heading: t('warehouse.ingredients'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('warehouse.ingredient') },
                        { name: t('warehouse.ingredients') },
                    ],
                }}
                addButton={{
                    label: t('warehouse.add'),
                    href: paths.warehouse.ingredients.new,
                }}
                filterOptions={{}}
                initialFilters={{}}
                hideColumns={{}}
                hideColumnsTogglable={['created_at', 'updated_at', 'actions']}
                onDeleteRow={handleDeleteIngredient}
                onDeleteRows={async (ids) => {
                    for (const id of ids) {
                        try {
                            await deleteIngredient(id);
                        } catch (error) {
                            console.error('Failed to delete:', error);
                        }
                    }
                }}
                onRowClick={(id) => {
                    const ingredient = Array.isArray(ingredients)
                        ? ingredients.find(ing => ing.id === id)
                        : undefined;
                    if (ingredient) {
                        handleViewIngredient(ingredient);
                    }
                }}
                onQuickFilterChange={setSearchQuery}
            />

            <GenericViewModal
                isOpen={viewModalOpen}
                onClose={handleCloseModal}
                title={selectedIngredient?.name || t('warehouse.ingredients')}
                data={selectedIngredient}
                renderContent={renderIngredientSpecifications}
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

