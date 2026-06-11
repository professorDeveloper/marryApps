import type { IMealsItem } from 'src/types/meals';
import type { DataTableColumn } from 'src/sections/common/data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
    Box, Table, Paper, Button, Dialog, TableRow,
    TableBody,
    TableCell,
    TableHead,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
    TableContainer,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { preload } from 'src/lib/swr';

import { fetcher, endpoints } from 'src/lib/axios';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import { useDeleteMeal, useDeleteMeals, useGetMealsPage, useGetMealWithCalculations } from 'src/hooks/use-meals';
import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDepartments, useGetStorages } from 'src/actions/departments';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { Iconify } from 'src/components/iconify';
import { formatPrice } from 'src/components/generic-view-view/modal-formatters';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DataTable } from 'src/sections/common/data-table';
import { StorageFilter } from 'src/sections/common/data-table/components/StorageFilter';
import { DepartmentFilter } from 'src/sections/common/data-table/components/DepartmentFilter';
import { CategoryFilter } from 'src/sections/common/data-table/components/CategoryFilter';
import { RouterLink } from 'src/routes/components';


// Shared pill styles — stable references so a new sx isn't created per cell
const PILL_BASE_SX = {
    display: 'inline-flex',
    px: '9px',
    py: '3px',
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.04em',
} as const;

const PILL_POSITIVE_SX = (theme: any) => ({
    ...PILL_BASE_SX,
    backgroundColor: alpha(theme.palette.success.main, 0.08),
    color: theme.palette.success.dark,
});

const PILL_NEGATIVE_SX = (theme: any) => ({
    ...PILL_BASE_SX,
    backgroundColor: alpha(theme.palette.error.main, 0.08),
    color: theme.palette.error.dark,
});

const PILL_NEUTRAL_SX = (theme: any) => ({
    ...PILL_BASE_SX,
    backgroundColor: theme.palette.action.selected,
    color: theme.palette.text.secondary,
});

const pillSx = (n: number) => (n > 0 ? PILL_POSITIVE_SX : n < 0 ? PILL_NEGATIVE_SX : PILL_NEUTRAL_SX);

const CATEGORY_PILL_SX = {
    display: 'inline-flex',
    alignItems: 'left',
    px: '9px',
    py: '3px',
    ml: '16px',
    borderRadius: '999px',
    fontSize: 12,
    fontWeight: 450,
    backgroundColor: 'var(--bg3)',
    color: 'var(--text2)',
    border: '1px solid var(--border)',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
} as const;

const initialFilters = {
    category_id: '',
    department_id: '',
    storage_id: '',
    min_price: '',
    max_price: '',
    query: '',
};


function MealCalculationsTable({ mealId }: { mealId: string }) {
    const { t } = useTranslation('menu');
    const { mealWithCalculations, loading } = useGetMealWithCalculations(mealId);
    const { data: meta } = useMetadata([MetadataEntity.INGREDIENTS, MetadataEntity.COMPOUNDS]);

    const ingredientMap = useMemo(() => {
        const map = new Map<string, string>();
        (meta.ingredients ?? []).forEach((ing: any) => { map.set(ing.id, ing.name || '-'); });
        return map;
    }, [meta.ingredients]);

    const compoundMap = useMemo(() => {
        const map = new Map<string, string>();
        (meta.compounds ?? []).forEach((c: any) => { map.set(c.id, c.name || '-'); });
        return map;
    }, [meta.compounds]);

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
                    <TableHead sx={{ bgcolor: 'var(--surface)' }}>
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
                                : calc.component_compound_id
                                    ? compoundMap.get(calc.component_compound_id) || calc.component_compound_id
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
                                        {t(`units.${calc.measurement_unit}`, { defaultValue: calc.measurement_unit })}
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


export function Meals() {
    const theme = useTheme();
    const { t, i18n } = useTranslation('menu');
    const { rowsPerPage: globalRowsPerPage } = usePaginationRows();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [draftFilters, setDraftFilters] = useState(initialFilters);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: globalRowsPerPage });

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, pageSize: globalRowsPerPage }));
    }, [globalRowsPerPage]);
    const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
    const { data: metadata } = useMetadata([MetadataEntity.CATEGORIES, MetadataEntity.DEPARTMENTS]);
    const { departments } = useGetDepartments();
    const { storages } = useGetStorages();

    // SWR hooks
    const { meals, mutate, pagination } = useGetMealsPage({
        ...filters,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
        expand: 'category_id,department_id,name_i18n',
        sort_by: sortState.key || undefined,
        sort_order: sortState.dir || undefined,
    });
    const { deleteMeal } = useDeleteMeal();
    const { deleteMeals } = useDeleteMeals();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        setDraftFilters((prev) => ({
            ...prev,
            query: debouncedSearchQuery,
        }));
    }, [debouncedSearchQuery]);

    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            ...draftFilters,
        }));
    }, [draftFilters]);

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [draftFilters]);

    // State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mealToDelete, setMealToDelete] = useState<string | null>(null);

    // Create translation maps for categories and departments from master lists,
    // so filter options do not collapse to only the currently filtered meals.
    const categoryMap = useMemo(() => {
        const map = new Map<string, string>();
        const currentLang = i18n.language || 'uz';
        // Exclude deleted categories from filter options (their data may still appear in meal rows)
        const categories = (metadata.categories || []).filter((c: any) => !c.is_deleted);

        categories.forEach((category: any) => {
            if (!category?.id) return;

            let displayName = category.name || '-';
            if (currentLang === 'en' && category.name_en) displayName = category.name_en;
            else if (currentLang === 'ru' && category.name_ru) displayName = category.name_ru;
            else if (
                (currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') &&
                category.name_uz
            )
                displayName = category.name_uz;

            map.set(category.id, displayName);
        });
        return map;
    }, [metadata.categories, i18n.language]);

    const departmentMap = useMemo(() => {
        const map = new Map<string, string>();
        const currentLang = i18n.language || 'uz';

        departments.forEach((department: any) => {
            if (!department?.id) return;

            let displayName = department.name || '-';
            if (currentLang === 'en' && department.name_en) displayName = department.name_en;
            else if (currentLang === 'ru' && department.name_ru) displayName = department.name_ru;
            else if (
                (currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') &&
                department.name_uz
            )
                displayName = department.name_uz;

            map.set(department.id, displayName);
        });
        return map;
    }, [departments, i18n.language]);

    const categoryOptions = useMemo(() => Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name })), [categoryMap]);

    const departmentOptions = useMemo(() => Array.from(departmentMap.entries()).map(([id, name]) => ({ id, name })), [departmentMap]);

    // View modal hook'i
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IMealsItem>();

    // Columns config
    const columns = useMemo<Array<DataTableColumn<IMealsItem>>>(
        () => [
            {
                key: 'name',
                label: <span style={{ display: 'block', textAlign: 'left', width: '20%' }}>{t('mealsProducts.name')}</span>,
                width: '2fr',
                sortable: false,
                getValue: (row) => {
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
                    return displayName;
                },
                renderCell: ({ value }: { row: IMealsItem; value: unknown }) => {
                    const displayName = String(value);
                    return (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                    );
                },
            },
            {
                key: 'category_id',
                label: t('mealsProducts.category'),
                width: '1fr',
                sortable: false,
                getValue: (row) =>
                    categoryMap.get(row.category_id) || row.category?.name || row.category_id || '-',
                renderCell: ({ value }: { row: IMealsItem; value: unknown }) => {
                    const label = String(value);
                    if (!label || label === '-') return <span>–</span>;
                    return <Box sx={CATEGORY_PILL_SX}>{label}</Box>;
                },
            },
            {
                key: 'price',
                label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>{t('mealsProducts.price')}</span>,
                width: '1fr',
                sortable: true,
                align: 'right',
                mono: true,
                getValue: (row) => Number(row.price || 0),
                renderCell: ({ value }: { row: IMealsItem; value: unknown }) => (
                    <span style={{ letterSpacing: '0.04em' }}>
                        {Number(value).toLocaleString('fr-FR')}
                    </span>
                ),
            },
            {
                key: 'cost_price',
                label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>{t('mealsProducts.costPrice')}</span>,
                width: '1fr',
                sortable: true,
                align: 'right',
                mono: true,
                getValue: (row) => row.cost_price ? Number(row.cost_price) : null,
                renderCell: ({ value }) => value !== null && value !== undefined
                    ? <span style={{ letterSpacing: '0.04em' }}>{Number(value).toLocaleString('fr-FR')}</span>
                    : '–',
            },
            {
                key: 'markup',
                label: <span style={{ display: 'block', textAlign: 'center', width: '100%',  paddingLeft:25 }}>{t('mealsProducts.profitnumber')}</span>,
                width: '1fr',
                sortable: true,
                sortKey: 'profit',
                align: 'right',
                mono: true,
                getValue: (row) => (row.cost_price != null && row.price != null)
                    ? Number(row.price) - Number(row.cost_price)
                    : null,
                renderCell: ({ value }) => {
                    if (value === null || value === undefined) return '–';
                    const n = Number(value);
                    return <Box sx={pillSx(n)}>{n.toLocaleString('fr-FR')}</Box>;
                },
            },
            {
                key: 'markup_pct',
                label: <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('mealsProducts.profitnumber')} %</span>,
                width: '1fr',
                sortable: true,
                sortKey: 'profit_markup',
                align: 'right',
                mono: true,
                getValue: (row) => (row.cost_price != null && Number(row.cost_price) > 0)
                    ? ((Number(row.price) - Number(row.cost_price)) / Number(row.cost_price)) * 100
                    : null,
                renderCell: ({ value }) => {
                    if (value === null || value === undefined) return '–';
                    const n = Number(value);
                    return <Box sx={pillSx(n)}>{n.toFixed(1)}%</Box>;
                },
            },
            {
                key: 'cook_time',
                label: t('mealsProducts.cookingTime'),
                width: '1fr',
                sortable: true,
                sortKey: 'cooking_time',
                align: 'center',
                getValue: (row) => Number(row.cook_time || 0),
                renderCell: ({ value }) => Number(value) > 0 ? `${value} ${t('mealsProducts.min')}` : '–',
            },
            {
                key: 'actions',
                label: t('actions'),
                width: '1fr',
                sortable: false,
                align: 'center',
                getValue: (row) => row,
                renderCell: ({ row }: { row: IMealsItem }) => (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = paths.menu.meals.edit(row.id);
                            }}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMealToDelete(row.id);
                                setDeleteDialogOpen(true);
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [theme.vars.palette.error.main, t, i18n.language, openModal, categoryMap, departmentMap]
    );

    const handlePaginationPageChange = (page: number) => {
        setPaginationModel((prev) => ({ ...prev, page }));
        setFilters((prev) => ({
            ...prev,
            offset: page * paginationModel.pageSize,
        }));
    };

    const handlePaginationRowsPerPageChange = (pageSize: number) => {
        setPaginationModel({ page: 0, pageSize });
        setFilters((prev) => ({
            ...prev,
            limit: pageSize,
            offset: 0,
        }));
    };

    const handleRowHover = useCallback((row: IMealsItem) => {
        preload(endpoints.meals.withCalculations(row.id), fetcher);
    }, []);

    const handleRowClick = useCallback((row: IMealsItem) => {
        // Kick off the detail fetch synchronously on click so it's already in flight
        // by the time the panel's content mounts.
        preload(endpoints.meals.withCalculations(row.id), fetcher);
        // Open the panel urgently so it appears instantly with its loading state —
        // the content fills in when the (already in-flight) fetch resolves.
        openModal(row);
    }, [openModal]);

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

                <DataTable<IMealsItem>
                    persistKey="meals-list-view"
                    data={meals}
                    getRowId={(row: IMealsItem) => String(row?.id)}
                    columns={columns}
                    search={{
                        value: searchQuery,
                        onChange: (value) => {
                            setSearchQuery(value);
                            setPaginationModel((prev) => ({ ...prev, page: 0 }));
                        },
                    }}
                    onSortChange={(sort) => {
                        setSortState({ key: sort.key, dir: sort.dir });
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    batchActions={[
                        {
                            label: t('mealsProducts.delete'),
                            icon: <Iconify icon="solar:trash-bin-trash-bold" width={18} />,
                            onClick: (rows: IMealsItem[]) => handleDeleteRows(rows.map((r) => r.id)),
                            color: 'error',
                        },
                    ]}
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount: pagination?.total || 0,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: handlePaginationPageChange,
                        onRowsPerPageChange: handlePaginationRowsPerPageChange,
                    }}
                    toolbarActions={
                        <>
                       
                            <DepartmentFilter
                                departmentId={filters.department_id || ''}
                                departments={departmentOptions}
                                onDepartmentChange={(departmentId: string) => {
                                    setDraftFilters((prev) => ({ ...prev, department_id: departmentId }));
                                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                }}
                                label={t('common.department')}
                            />
                                 <CategoryFilter
                                categoryId={filters.category_id || ''}
                                categories={categoryOptions}
                                onCategoryChange={(categoryId: string) => {
                                    setDraftFilters((prev) => ({ ...prev, category_id: categoryId }));
                                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                }}
                                label={t('mealsProducts.category')}
                            />
                            <StorageFilter
                                storageId={filters.storage_id || ''}
                                storages={storages.map((s: any) => ({ id: s.id, name: s.name }))}
                                onStorageChange={(storageId: string) => {
                                    setDraftFilters((prev) => ({ ...prev, storage_id: storageId }));
                                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                }}
                                label={t('common.storage')}
                            />
                        </>
                    }
                    defaultConfig={{
                        order: ['name', 'category_id', 'price', 'cost_price', 'markup', 'markup_pct', 'cook_time', 'actions'],
                        visibility: {
                            name: true,
                            category_id: true,
                            price: true,
                            cost_price: true,
                            markup: true,
                            markup_pct: true,
                            cook_time: true,
                            actions: true,
                        },
                        widths: {
                            name: '2fr',
                            category_id: '1fr',
                            price: '1fr',
                            cost_price: '1fr',
                            markup: '1fr',
                            markup_pct: '1fr',
                            cook_time: '1fr',
                            actions: '1fr',
                        },
                    }}
                    onReset={() => {
                        setDraftFilters(initialFilters);
                        setSortState({ key: null, dir: null });
                    }}
                    onRowClick={handleRowClick}
                    onRowHover={handleRowHover}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.menu.meals.new}
                            size="small"
                        >
                            {t('mealsProducts.add')}
                        </Button>
                    }
                    showTotals={false}
                    rowActions={[
                        {
                            label: t('mealsProducts.view'),
                            icon: <Iconify icon="solar:eye-bold" width={18} />,
                            onClick: (row: IMealsItem) => handleRowClick(row),
                        },
                        {
                            label: t('mealsProducts.edit'),
                            icon: <Iconify icon="solar:pen-bold" width={18} />,
                            onClick: (row: IMealsItem) => {
                                window.location.href = paths.menu.meals.edit(row.id);
                            },
                        },
                        {
                            label: t('mealsProducts.delete'),
                            icon: <Iconify icon="solar:trash-bin-trash-bold" width={18} />,
                            onClick: (row: IMealsItem) => {
                                setMealToDelete(row.id);
                                setDeleteDialogOpen(true);
                            },
                        },
                    ]}
                />
            </DashboardContent>

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
