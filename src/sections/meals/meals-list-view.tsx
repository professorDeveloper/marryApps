import type { GridColDef } from '@mui/x-data-grid';
import type { IMealsItem } from 'src/types/meals';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent, Box, Avatar, ListItemText } from '@mui/material';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGetMeals, useDeleteMeal, useDeleteMeals, useGetMealWithCalculations } from 'src/hooks/use-meals';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import { useImageUrl } from 'src/hooks/use-image-url';
import { useGetIngredients } from 'src/actions/ingredients';

import { getInitials, getAvatarColor } from 'src/utils/avatar';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import {
    GenericTableView,
} from 'src/components/generic-table-view';
import { formatPrice } from 'src/components/generic-view-view/modal-formatters';


/**
 * Meal name and avatar renderer
 */
function RenderCellMealName({ params }: { params: any }) {
    const { row } = params;
    const name = row.name || '-';
    const { imageUrl, loading } = useImageUrl(row.picture_url);

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
 * Meal calculations table renderer
 */
function MealCalculationsTable({ mealId }: { mealId: string }) {
    const { t } = useTranslation('menu');
    const { mealWithCalculations, loading } = useGetMealWithCalculations(mealId);
    const { ingredients } = useGetIngredients();
    const { meals } = useGetMeals();

    // Create maps for quick name lookup
    const ingredientMap = useMemo(() => {
        const map = new Map<string, string>();
        ingredients.forEach((ing: any) => {
            map.set(ing.id, ing.name);
        });
        return map;
    }, [ingredients]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!mealWithCalculations || !mealWithCalculations.calculations) {
        return <Box sx={{ py: 2 }}>{t('common.noData')}</Box>;
    }

    const { calculations, total_cost, profit, profit_margin } = mealWithCalculations;

    return (
        <Box sx={{ width: '100%' }}>
           <TableContainer component={Paper} sx={{ mb: 2 }}>
    <Table size="small">
        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
                <TableCell align="left">
                    {t('common.name')}
                </TableCell>
                <TableCell align="center">
                    {t('semifinishedProducts.quantity')}
                </TableCell>
                <TableCell align="center">
                    {t('common.unit')}
                </TableCell>
                <TableCell align="right">
                    {t('semifinishedProducts.price')}
                </TableCell>
                <TableCell align="right">
                    {t('common.total')}
                </TableCell>
            </TableRow>
        </TableHead>

        <TableBody>
            {calculations.map((calc, index) => {
                const itemName = calc.ingredient_id
                    ? ingredientMap.get(calc.ingredient_id) || calc.ingredient_id
                    : '-';

                return (
                    <TableRow key={calc.id}>
                        {/* NUMBER + NAME bitta cell */}
                        <TableCell align="left">
                            <strong>{index + 1}.</strong> {itemName}
                        </TableCell>

                        <TableCell align="center">
                            {calc.quantity}
                        </TableCell>

                        <TableCell align="center">
                            {calc.measurement_unit}
                        </TableCell>

                        <TableCell align="right">
                            {formatPrice(Number(calc.price_per_unit))}
                        </TableCell>

                        <TableCell align="right">
                            {formatPrice(Number(calc.total_cost))}
                        </TableCell>
                    </TableRow>
                );
            })}
        </TableBody>
    </Table>
</TableContainer>


            {/* Summary row */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 2 }}>
                <Box>
                    <Box sx={{ fontWeight: 600, mb: 1 }}>{t('common.total')}:</Box>
                    <Box sx={{ fontWeight: 600, mb: 1 }}>Foyda:</Box>
                    <Box sx={{ fontWeight: 600 }}>Foyda foizi:</Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Box sx={{ fontWeight: 600, mb: 1 }}>{formatPrice(Number(total_cost))}</Box>
                    <Box sx={{ fontWeight: 600, mb: 1 }}>{formatPrice(Number(profit))}</Box>
                    <Box sx={{ fontWeight: 600 }}>{profit_margin}</Box>
                </Box>
            </Box>
        </Box>
    );
}

/**
 * Meals item'uchun modal render function
 */
function renderMealsSpecifications(item: IMealsItem, t: any) {
    const specs = [
        { label: t('mealsProducts.name'), value: item.name },
        { label: t('mealsProducts.description'), value: item.description },
        {
            label: t('mealsProducts.category'),
            value: item.category?.name || item.category_id || '-',
        },
        {
            label: t('mealsProducts.department'),
            value: item.department?.name || item.department_id || '-',
        },
        { label: t('mealsProducts.price'), value: `${item.price?.toLocaleString()} so'm` },
        { label: t('mealsProducts.cookingTime'), value: `${item.cook_time} min` },
        {
            label: t('mealsProducts.createdAt'),
            value: item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        },
        {
            label: t('mealsProducts.updatedAt'),
            value: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-',
        },
    ];

    return <SpecificationsTable rows={specs} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Meals() {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    // SWR hooks
    const { meals, mealsLoading, mutate } = useGetMeals();
    const { deleteMeal } = useDeleteMeal();
    const { deleteMeals } = useDeleteMeals();

    // State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mealToDelete, setMealToDelete] = useState<string | null>(null);

    // View modal hook'i
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IMealsItem>();

    // Columns config
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: t('mealsProducts.name'),
                flex: 1,
                minWidth: 250,
                hideable: false,
                renderCell: (params) => <RenderCellMealName params={params} />,
            },
            {
                field: 'category_id',
                headerName: t('mealsProducts.category'),
                width: 150,
                type: 'string',
                renderCell: (params) => params.row.category?.name || params.value || '-',
            },
            {
                field: 'department_id',
                headerName: t('mealsProducts.department'),
                width: 150,
                type: 'string',
                renderCell: (params) => params.row.department?.name || params.value || '-',
            },
            {
                field: 'price',
                headerName: t('mealsProducts.price'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value?.toLocaleString()} so'm`,
            },
            {
                field: 'cook_time',
                headerName: t('mealsProducts.cookingTime'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value} min`,
            },
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
                        key="edit"
                        showInMenu
                        label={t('mealsProducts.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.menu.meals.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        key="view"
                        showInMenu
                        label={t('mealsProducts.view')}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => openModal(params.row)}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        showInMenu
                        label={t('mealsProducts.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => {
                            setMealToDelete(params.row.id);
                            setDeleteDialogOpen(true);
                        }}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [theme.vars.palette.error.main, t, openModal]
    );

    const handleConfirmDelete = useCallback(async () => {
        if (mealToDelete) {
            try {
                await deleteMeal(mealToDelete);
                // SWR will automatically revalidate
                mutate();
                setDeleteDialogOpen(false);
                setMealToDelete(null);
            } catch (error) {
                console.error('Failed to delete meal:', error);
            }
        }
    }, [mealToDelete, deleteMeal, mutate]);

    const handleDeleteRows = useCallback(
        async (ids: string[]) => {
            try {
                await deleteMeals(ids);
                // SWR will automatically revalidate
                mutate();
            } catch (error) {
                console.error('Failed to delete meals:', error);
            }
        },
        [deleteMeals, mutate]
    );

    return (
        <>
            <GenericTableView<IMealsItem>
                data={meals}
                loading={mealsLoading}
                columns={columns}
                breadcrumbs={{
                    heading: t('mealsProducts.title'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('mealsProducts.title'), href: paths.menu.meals.root },
                        { name: t('mealsProducts.list') },
                    ],
                }}
                addButton={{
                    label: t('mealsProducts.add'),
                    href: paths.menu.meals.new,
                }}
                filterOptions={{}}
                initialFilters={{}}
                hideColumns={{}}
                hideColumnsTogglable={['actions']}
                onDeleteRows={handleDeleteRows}
            />

            {/* Meals Item View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.name || t('mealsProducts.title')}
                data={selectedData}
                renderContent={(data) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* {renderMealsSpecifications(data, t)} */}
                        <Box>
                            {/* <Box sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}>
                                {t('common.calculations')}
                            </Box> */}
                            <MealCalculationsTable mealId={data.id} />
                        </Box>
                    </Box>
                )}
                maxWidth="md"
                slideDirection="left"
                position="right"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setMealToDelete(null);
                }}
            >
                <DialogTitle>{t('mealsProducts.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    {t('mealsProducts.deleteMessage')}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteDialogOpen(false);
                            setMealToDelete(null);
                        }}
                    >
                        {t('mealsProducts.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                    >
                        {t('mealsProducts.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
