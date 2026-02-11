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
import { GenericTableView } from 'src/components/generic-table-view';
import { formatPrice } from 'src/components/generic-view-view/modal-formatters';
import { useGetCategories } from 'src/actions/categories';
import { useGetDepartments } from 'src/actions/departments';


function MealCalculationsTable({ mealId }: { mealId: string }) {
    const { t, i18n } = useTranslation('menu');
    const { mealWithCalculations, loading } = useGetMealWithCalculations(mealId);
    const { ingredients } = useGetIngredients();
    const { meals } = useGetMeals();

    // Create maps for quick name lookup with translations
    const ingredientMap = useMemo(() => {
        const map = new Map<string, string>();
        const currentLang = i18n.language || 'uz';
        
        ingredients.forEach((ing: any) => {
            let displayName = ing.name || '-';
            
            // Get translated name based on current language
            if (currentLang === 'en' && ing.name_en) {
                displayName = ing.name_en;
            } else if (currentLang === 'ru' && ing.name_ru) {
                displayName = ing.name_ru;
            } else if ((currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') && ing.name_uz) {
                displayName = ing.name_uz;
            }
            
            map.set(ing.id, displayName);
        });
        return map;
    }, [ingredients, i18n.language]);

    // Remove duplicate calculations - keep only unique ingredient_id or component_compound_id
    // HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS!
    const uniqueCalculations = useMemo(() => {
        if (!mealWithCalculations?.calculations) return [];
        const seen = new Set<string>();
        return mealWithCalculations.calculations.filter((calc) => {
            const key = calc.ingredient_id || calc.component_compound_id || calc.id;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }, [mealWithCalculations?.calculations]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!mealWithCalculations || !mealWithCalculations.calculations || uniqueCalculations.length === 0) {
        return <Box sx={{ py: 2 }}>{t('common.noData')}</Box>;
    }

    const { total_cost, profit, profit_margin } = mealWithCalculations;

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
                        {uniqueCalculations.map((calc, index) => {
                            const itemName = calc.ingredient_id
                                ? ingredientMap.get(calc.ingredient_id) || calc.ingredient_id
                                : '-';

                            return (
                                <TableRow key={calc.ingredient_id || calc.component_compound_id || calc.id}>
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
    const { t, i18n } = useTranslation('menu');

    // SWR hooks
    const { meals, mealsLoading, mutate } = useGetMeals();
    const { deleteMeal } = useDeleteMeal();
    const { deleteMeals } = useDeleteMeals();
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();

    // State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mealToDelete, setMealToDelete] = useState<string | null>(null);

    // Create translation maps for categories and departments
    const categoryMap = useMemo(() => {
        const map = new Map<string, string>();
        const currentLang = i18n.language || 'uz';
        
        categories.forEach((cat: any) => {
            let displayName = cat.name || '-';
            
            // Get translated name based on current language
            if (currentLang === 'en' && cat.name_en) {
                displayName = cat.name_en;
            } else if (currentLang === 'ru' && cat.name_ru) {
                displayName = cat.name_ru;
            } else if ((currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') && cat.name_uz) {
                displayName = cat.name_uz;
            }
            
            map.set(cat.id, displayName);
        });
        return map;
    }, [categories, i18n.language]);

    const departmentMap = useMemo(() => {
        const map = new Map<string, string>();
        const currentLang = i18n.language || 'uz';
        
        departments.forEach((dept: any) => {
            let displayName = dept.name || '-';
            
            // Get translated name based on current language
            if (currentLang === 'en' && dept.name_en) {
                displayName = dept.name_en;
            } else if (currentLang === 'ru' && dept.name_ru) {
                displayName = dept.name_ru;
            } else if ((currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') && dept.name_uz) {
                displayName = dept.name_uz;
            }
            
            map.set(dept.id, displayName);
        });
        return map;
    }, [departments, i18n.language]);

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
                renderCell: (params) => {
                    const { row } = params;
                    // Get translation based on current language
                    const currentLang = i18n.language || 'uz';
                    let displayName = row.name || '-';

                    if (currentLang === 'en' && row.name_en) {
                        displayName = row.name_en;
                    } else if (currentLang === 'ru' && row.name_ru) {
                        displayName = row.name_ru;
                    } else if ((currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') && row.name_uz) {
                        displayName = row.name_uz;
                    }

                    const { imageUrl, loading } = useImageUrl(row.picture_url);
                    const initials = getInitials(displayName);
                    const bgColor = imageUrl ? undefined : getAvatarColor(displayName);

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
                                alt={displayName}
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

                            <ListItemText primary={<span>{displayName}</span>} />
                        </Box>
                    );
                },
            },
            {
                field: 'category_id',
                headerName: t('mealsProducts.category'),
                width: 150,
                type: 'string',
                renderCell: (params) => {
                    // Use the translated category name from categoryMap
                    return categoryMap.get(params.value) || params.row.category?.name || params.value || '-';
                },
            },
            {
                field: 'department_id',
                headerName: t('mealsProducts.department'),
                width: 150,
                type: 'string',
                renderCell: (params) => {
                    // Use the translated department name from departmentMap
                    return departmentMap.get(params.value) || params.row.department?.name || params.value || '-';
                },
            },
            {
                field: 'price',
                headerName: t('mealsProducts.price'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value?.toLocaleString()} ${t('mealsProducts.som')}`,
            },
            {
                field: 'cook_time',
                headerName: t('mealsProducts.cookingTime'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value} ${t('mealsProducts.min')}`,
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: t('actions'),
                width: 150,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        key="view"
                        label={t('mealsProducts.view')}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => openModal(params.row)}
                    />,
                    <CustomGridActionsCellItem
                        key="edit"
                        label={t('mealsProducts.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.menu.meals.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
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
        [theme.vars.palette.error.main, t, i18n.language, openModal, categoryMap, departmentMap]
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
                        <Box>
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