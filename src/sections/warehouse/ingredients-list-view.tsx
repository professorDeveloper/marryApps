import type { GridPaginationModel } from '@mui/x-data-grid';
import type { IIngredientItem } from 'src/types/ingredients';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Button,
    Dialog,
    Typography,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetIngredients, useDeleteIngredient } from 'src/actions/ingredients';
import { useMetadata } from 'src/hooks/use-metadata';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';
import { MetadataEntity } from 'src/types/metadata';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { RouterLink } from 'src/routes/components';
import { RenderCell } from 'src/components/RenderCell';
import { CELL_SX } from 'src/sections/warehouse/deduction/components/utility-data-table/utils/constants';


function getMeasurementLabel(value: string, t: (key: string) => string): string {
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
}

export function IngredientListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const { rowsPerPage } = usePaginationRows();
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: rowsPerPage,
    });
    const { ingredients, ingredientsLoading, ingredientsTotal } = useGetIngredients(
        debouncedSearchQuery,
        {
            limit: paginationModel.pageSize,
            offset: paginationModel.page * paginationModel.pageSize,
        }
    );
    const { data: metadata } = useMetadata([MetadataEntity.INGREDIENT_GROUPS]);
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

    const handleEditIngredient = useCallback((id: string) => {
        router.push(paths.menu.ingredients.edit(id));
    }, [router]);

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

    const handleViewIngredient = useCallback((ingredient: IIngredientItem) => {
        setSelectedIngredient(ingredient);
        setViewModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setViewModalOpen(false);
        setSelectedIngredient(null);
    }, []);

    const columns = useMemo(
        () => [
            {
                key: 'name',
                label: t('warehouse.name'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: IIngredientItem) => row?.name ?? '',
                renderCell: ({ row }: { row: IIngredientItem }) => (
                    <RenderCell label={row?.name} />
                ),
            },
            {
                key: 'group_name',
                label: t('warehouse.group'),
                sortable: true,
                filter: { type: 'multi' as const },
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: IIngredientItem) => {
                    const ingredientGroups = metadata?.ingredient_groups || [];
                    const group = ingredientGroups.find((g: any) => g.id === row.group_id);
                    return group?.name || row?.group_id || '-';
                },
                renderCell: ({ row }: { row: IIngredientItem }) => {
                    const ingredientGroups = metadata?.ingredient_groups || [];
                    const group = ingredientGroups.find((g: any) => g.id === row.group_id);
                    const groupName = group?.name || row?.group_id || '-';
                    return <RenderCell label={groupName} />;
                },
            },
            {
                key: 'measurement',
                label: t('warehouse.measurement'),
                sortable: true,
                filter: { type: 'multi' as const },
                width: '1fr',
                align: 'left' as const,
                getValue: (row: IIngredientItem) => row?.measurement || '-',
                renderCell: ({ value }: { value: unknown }) => (
                    <RenderCell label={getMeasurementLabel(String(value ?? '-'), t)} />
                ),
            },
            {
                key: 'color_code',
                label: t('warehouse.color'),
                sortable: false,
                width: '0.8fr',
                align: 'center' as const,
                getValue: (row: IIngredientItem) => row?.color_code || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const colorCode = value as string;
                    if (!colorCode) {
                        return <RenderCell label="-" />;
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
                },
            },
            {
                key: 'price_per_unit',
                label: t('warehouse.price'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: IIngredientItem) => row?.price_per_unit || '-',
                renderCell: ({ row }: { row: IIngredientItem }) => (
                    <RenderCell label={row?.price_per_unit || '-'} />
                ),
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: IIngredientItem }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1
                    }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditIngredient(row.id);
                            }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setIngredientToDelete(row.id);
                                setDeleteDialogOpen(true);
                            }}
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
        [t, handleEditIngredient, handleViewIngredient]
    );

    const renderIngredientSpecifications = useCallback((ingredient: IIngredientItem) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ingredient.picture_url && (
                <Box
                    component="img"
                    src={ingredient.picture_url}
                    alt={ingredient.name}
                    sx={{ width: '100%', borderRadius: 1, maxHeight: 300, objectFit: 'cover' }}
                />
            )}
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
                    { metadata?.ingredient_groups?.find((g: any) => g.id === ingredient.group_id)?.name || '-' }
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
        </Box>
    ), [t]);

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
                <DeductionUtilityDataTable
                    persistKey="warehouse-ingredients"
                    data={Array.isArray(ingredients) ? ingredients : []}
                    getRowId={(row: IIngredientItem) => String(row?.id)}
                    columns={columns}
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={ingredientsTotal || 0}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(p) => setPaginationModel((prev) => ({ ...prev, page: p }))}
                    onRowsPerPageChange={(size) => setPaginationModel({ page: 0, pageSize: size })}
                    defaultConfig={{
                        order: ['name', 'group_name', 'measurement', 'color_code', 'price_per_unit', 'actions'],
                        visibility: {
                            name: true,
                            group_name: true,
                            measurement: true,
                            color_code: true,
                            price_per_unit: true,
                            actions: true,
                        },
                        widths: {
                            name: '2fr',
                            group_name: '1.2fr',
                            measurement: '1fr',
                            color_code: '0.8fr',
                            price_per_unit: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={() => {}}
                    onRowClick={handleViewIngredient}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.menu.ingredients.new}
                            size="small"
                        >
                            {t('warehouse.add')}
                        </Button>
                    }
                    showTotals={false}
                />
            </DashboardContent>

            <GenericViewModal
                isOpen={viewModalOpen}
                onClose={handleCloseModal}
                title={selectedIngredient?.name || t('warehouse.ingredients')}
                data={selectedIngredient}
                renderContent={renderIngredientSpecifications}
                maxWidth="sm"
                slideDirection="left"
                position="right"
                paperSx={{
                    width: { xs: '100%', sm: '30vw' },
                    maxWidth: { xs: '100%', sm: '30vw' },
                }}
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
