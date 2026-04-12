import type { ICompound } from 'src/types/compounds';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import {
    Box,
    Table,
    Paper,
    Dialog,
    Button,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
    DialogTitle,
    ListItemText,
    DialogActions,
    DialogContent,
    TableContainer,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import {
    useDeleteCompound,
    useDeleteCompounds,
    useGetCompoundsPage,
    useGetCompoundWithCalculations,
} from 'src/hooks/use-compounds';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetIngredients } from 'src/actions/ingredients';
import { useGetIngredientGroups } from 'src/actions/ingredient-group';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';
import { formatDate, formatPrice } from 'src/components/generic-view-view/modal-formatters';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';


// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

/**
 * Compound calculations table renderer
 */
function CompoundCalculationsTable({
    compoundId,
    compounds,
}: {
    compoundId: string;
    compounds: ICompound[];
}) {
    const { t } = useTranslation('menu');
    const { compoundWithCalculations, loading } = useGetCompoundWithCalculations(compoundId);
    const { ingredients } = useGetIngredients();
    // Create maps for quick name lookup
    const ingredientMap = useMemo(() => {
        const map = new Map<string, string>();
        ingredients.forEach((ing: any) => {
            map.set(ing.id, ing.name);
        });
        return map;
    }, [ingredients]);

    const compoundMap = useMemo(() => {
        const map = new Map<string, string>();
        compounds.forEach((comp: any) => {
            map.set(comp.id, comp.name);
        });
        return map;
    }, [compounds]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!compoundWithCalculations || !compoundWithCalculations.calculations) {
        return <Box sx={{ py: 2 }}>{t('common.noData')}</Box>;
    }

    const { calculations, total_cost, profit, profit_margin } = compoundWithCalculations;

    return (
        <Box sx={{ width: '100%' }}>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell align="left">{t('common.name')}</TableCell>
                            <TableCell align="center">{t('semifinishedProducts.quantity')}</TableCell>
                            <TableCell align="center">{t('common.unit')}</TableCell>
                            <TableCell align="right">{t('semifinishedProducts.price')}</TableCell>
                            <TableCell align="right">{t('common.total')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {calculations.map((calc, index) => {
                            let itemName = '-';
                            if (calc.ingredient_id) {
                                itemName = ingredientMap.get(calc.ingredient_id) || calc.ingredient_id;
                            } else if (calc.component_compound_id) {
                                itemName = compoundMap.get(calc.component_compound_id) || calc.component_compound_id;
                            }

                            return (
                                <TableRow key={calc.id}>
                                    {/* Number + Name */}
                                    <TableCell align="left">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                {index + 1}.
                                            </Box>
                                            <Box>{itemName}</Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">{calc.quantity}</TableCell>
                                    <TableCell align="center">{calc.measurement_unit}</TableCell>
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
 * Render compound specifications for modal
 */
function renderCompoundSpecifications(item: ICompound, t: any) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.name')}:</Box>
                <Box>{item.name || '-'}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.description')}:</Box>
                <Box>{item.description || '-'}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.measurement')}:</Box>
                <Box>{t(`semifinishedProducts.${item.measurement}`, item.measurement)}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('ingredients.group')}:</Box>
                <Box>{item.ingredient_group_name || '-'}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.quantity')}:</Box>
                <Box>{item.quantity}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.price')}:</Box>
                <Box>{formatPrice(Number(item.price))}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.createdAt')}:</Box>
                <Box>{formatDate(item.created_at)}</Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ fontWeight: 500 }}>{t('semifinishedProducts.updatedAt')}:</Box>
                <Box>{formatDate(item.updated_at)}</Box>
            </Box>
        </Box>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HalfMeals() {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [debouncedSearchQuery]);

    // SWR hooks
    const { compounds, compoundsLoading, mutate, pagination } = useGetCompoundsPage({
        search: debouncedSearchQuery,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
        expand: 'ingredient_group_id,name_i18n,description_i18n',
    });
    const { ingredientGroups } = useGetIngredientGroups();
    const { deleteCompound } = useDeleteCompound();
    const { deleteCompounds } = useDeleteCompounds();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [compoundToDelete, setCompoundToDelete] = useState<string | null>(null);

    // View modal
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ICompound>();

    const ingredientGroupMap = useMemo(() => {
        const map = new Map<string, string>();

        ingredientGroups.forEach((group: any) => {
            if (group?.id) {
                map.set(group.id, group.name || '-');
            }
        });

        return map;
    }, [ingredientGroups]);

    // Measurement options with translations
    const _measurementOptions = useMemo(
        () => [
            { value: 'kg', label: t('semifinishedProducts.kg') },
            { value: 'l', label: t('semifinishedProducts.l') },
            { value: 'piece', label: t('semifinishedProducts.piece') },
        ],
        [t]
    );

    // Ingredient group options for filtering (derived from expanded compounds to avoid extra API call)
    const ingredientGroupOptions = useMemo(() => {
        const map = new Map<string, string>();

        ingredientGroups.forEach((group: any) => {
            if (group?.id) {
                map.set(group.id, group.name || '-');
            }
        });

        compounds.forEach((comp: any) => {
            const group = comp?._expand?.ingredient_group_id;
            if (group?.id && group?.name) {
                map.set(group.id, group.name);
            } else if (comp?.ingredient_group_id && comp?.ingredient_group_name) {
                map.set(comp.ingredient_group_id, comp.ingredient_group_name);
            }
        });
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    }, [compounds, ingredientGroups]);

    // DataTable columns
    const columns = useMemo(
        () => [
            {
                key: 'name',
                label: t('semifinishedProducts.name'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: ICompound) => row?.name ?? '',
                renderCell: ({ row }: { row: ICompound }) => {
                    const name = row.name || '-';

                    return (
                        <Box
                            sx={{
                                py: 1,
                                width: 1,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <ListItemText primary={<span>{name}</span>} />
                        </Box>
                    );
                },
            },
            {
                key: 'measurement',
                label: t('semifinishedProducts.measurement'),
                sortable: true,
                filter: { type: 'multi' as const },
                width: '1fr',
                align: 'left' as const,
                getValue: (row: ICompound) => row?.measurement || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const measurementKey = `semifinishedProducts.${value}`;
                    const label = t(measurementKey);
                    return <span>{label}</span>;
                },
            },
            {
                key: 'ingredient_group_name',
                label: t('ingredients.group'),
                sortable: true,
                filter: { type: 'multi' as const },
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: ICompound) => (
                        row.ingredient_group_name ||
                        ingredientGroupMap.get(row.ingredient_group_id) ||
                        '-'
                    ),
            },
            {
                key: 'price',
                label: t('semifinishedProducts.price'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: ICompound) => {
                    const numPrice = typeof row.price === 'string' ? parseFloat(row.price) : row.price;
                    return numPrice || 0;
                },
                renderCell: ({ value }: { value: unknown }) => {
                    const numPrice = typeof value === 'string' ? parseFloat(value) : value;
                    return <span>{String(numPrice)} so&apos;m</span>;
                },
            },
            {
                key: 'quantity',
                label: t('semifinishedProducts.quantity'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: ICompound) => row?.quantity || 0,
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '1fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: ICompound }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                            size="small"
                            href={paths.menu.semifinished.edit(row.id)}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </Button>
                        <Button
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCompoundToDelete(row.id);
                                setDeleteDialogOpen(true);
                            }}
                            sx={{ color: theme.vars.palette.error.main }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </Button>
                    </Box>
                ),
            },
        ],
        [t, theme.vars.palette.error.main, ingredientGroupMap]
    );

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(async () => {
        if (compoundToDelete) {
            try {
                await deleteCompound(compoundToDelete);
                // SWR will automatically revalidate
                mutate();
                setDeleteDialogOpen(false);
                setCompoundToDelete(null);
            } catch (error) {
                console.error('Error deleting compound:', error);
            }
        }
    }, [compoundToDelete, deleteCompound, mutate]);

    // Handle delete single
    const handleDelete = useCallback(
        async (id: string) => {
            setCompoundToDelete(id);
            setDeleteDialogOpen(true);
        },
        []
    );

    // Handle delete multiple
    const handleDeleteMultiple = useCallback(
        async (ids: string[]) => {
            try {
                await deleteCompounds(ids);
                // SWR will automatically revalidate
                mutate();
            } catch (error) {
                console.error('Error deleting compounds:', error);
            }
        },
        [deleteCompounds, mutate]
    );

    const handlePaginationPageChange = (page: number) => {
        setPaginationModel((prev) => ({ ...prev, page }));
    };

    const handlePaginationRowsPerPageChange = (pageSize: number) => {
        setPaginationModel({ page: 0, pageSize });
    };

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
                <DataTable
                    persistKey="compounds-list-view"
                    data={compounds}
                    getRowId={(row: ICompound) => row.id}
                    columns={columns}
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={pagination?.total || 0}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={handlePaginationPageChange}
                    onRowsPerPageChange={handlePaginationRowsPerPageChange}
                    defaultConfig={{
                        order: ['name', 'measurement', 'ingredient_group_name', 'price', 'quantity', 'actions'],
                        visibility: {
                            name: true,
                            measurement: true,
                            ingredient_group_name: true,
                            price: true,
                            quantity: true,
                            actions: true,
                        },
                        widths: {
                            name: '2fr',
                            measurement: '1fr',
                            ingredient_group_name: '1.5fr',
                            price: '1fr',
                            quantity: '1fr',
                            actions: '1fr',
                        },
                    }}
                    onReset={() => {
                        setSearchQuery('');
                        setPaginationModel({ page: 0, pageSize: 20 });
                    }}
                    onRowClick={openModal}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            href={paths.menu.semifinished.new}
                            size="small"
                        >
                            {t('semifinishedProducts.add')}
                        </Button>
                    }
                />
            </DashboardContent>

            {/* Compound Item View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.name || t('semifinishedProducts.title')}
                data={selectedData}
                renderContent={(item) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* {renderCompoundSpecifications(item, t)} */}
                        <Box>
                            {/* <Box sx={{ mb: 2, fontWeight: 600, fontSize: 16 }}>
                                {t('common.calculations')}
                            </Box> */}
                            <CompoundCalculationsTable compoundId={item.id} compounds={compounds} />
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
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('semifinishedProducts.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    {t('semifinishedProducts.deleteMessage')}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDeleteDialogOpen(false)}
                    >
                        {t('semifinishedProducts.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        autoFocus
                    >
                        {t('semifinishedProducts.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
