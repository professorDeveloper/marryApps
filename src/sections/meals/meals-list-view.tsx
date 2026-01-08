import type { GridColDef } from '@mui/x-data-grid';
import type { IMealsItem } from 'src/types/meals';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useMealsAPI } from 'src/hooks/use-meals-api';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import {
    RenderCellItem,
    GenericTableView,
} from 'src/components/generic-table-view';

// ============================================================================
// CONSTANTS
// ============================================================================

// Empty - no predefined constants needed

// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Meal name and avatar renderer
 */
function RenderCellMealName({ params }: { params: any }) {
    return (
        <RenderCellItem
            params={params}
            imageField="coverUrl"
            nameField="name"
        />
    );
}

// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

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

    // API hook'i
    const { getMeals, deleteMeal } = useMealsAPI();

    // State
    const [meals, setMeals] = useState<IMealsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mealToDelete, setMealToDelete] = useState<string | null>(null);

    // View modal hook'i
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IMealsItem>();

    // Load meals on mount
    useEffect(() => {
        loadMeals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMeals = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMeals();
            setMeals(data);
        } finally {
            setLoading(false);
        }
    }, [getMeals]);

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
                setMeals((prev) => prev.filter((m) => m.id !== mealToDelete));
                setDeleteDialogOpen(false);
                setMealToDelete(null);
            } catch (error) {
                console.error('Failed to delete meal:', error);
            }
        }
    }, [mealToDelete, deleteMeal]);

    return (
        <>
            <GenericTableView<IMealsItem>
                data={meals}
                loading={loading}
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
            />

            {/* Meals Item View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.name || t('mealsProducts.title')}
                data={selectedData}
                renderContent={(data) => renderMealsSpecifications(data, t)}
                maxWidth="sm"
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
