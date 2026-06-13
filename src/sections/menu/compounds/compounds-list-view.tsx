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
    MenuItem,
    TableHead,
    TableCell,
    TableBody,
    TextField,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
    TableContainer,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useMetadata } from 'src/hooks/use-metadata';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import {
    useDeleteCompound,
    useDeleteCompounds,
    useGetCompoundsPage,
    useGetCompoundWithCalculations,
} from 'src/hooks/use-compounds';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetIngredients } from 'src/actions/ingredients';
import { useGetDepartments } from 'src/actions/departments';

import { Iconify } from 'src/components/iconify';
import { RenderCell } from 'src/components/RenderCell';
import { GenericViewModal } from 'src/components/generic-view-view';
import { formatDate, formatPrice } from 'src/components/generic-view-view/modal-formatters';

import { DataTable, FILTER_SELECT_SX } from 'src/sections/common/data-table';

import { MetadataEntity } from 'src/types/metadata';


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
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 1.5, 
                px: 1,
                color: 'text.primary',
                fontSize: '0.875rem',
                fontWeight: 400
            }}>
                {t('common.noData')}
            </Box>
        );
    }

    const { calculations, total_cost, profit, profit_margin } = compoundWithCalculations;

    return (
        <Box sx={{ width: '100%' }}>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'background.paper' }}>
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
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1,
                                            py: 1,
                                            px: 1,
                                            color: 'text.primary',
                                            fontSize: '0.875rem',
                                            fontWeight: 400
                                        }}>
                                            <Box sx={{ 
                                                fontWeight: 600, 
                                                color: 'text.secondary',
                                                fontSize: '0.875rem'
                                            }}>
                                                {index + 1}.
                                            </Box>
                                            <Box>{itemName}</Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            py: 1,
                                            px: 1,
                                            color: 'text.primary',
                                            fontSize: '0.875rem',
                                            fontWeight: 400
                                        }}>
                                            {calc.quantity}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            py: 1,
                                            px: 1,
                                            color: 'text.primary',
                                            fontSize: '0.875rem',
                                            fontWeight: 400
                                        }}>
                                            {t(`units.${calc.measurement_unit}`, { defaultValue: calc.measurement_unit })}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'flex-end',
                                            py: 1,
                                            px: 1,
                                            color: 'text.primary',
                                            fontSize: '0.875rem',
                                            fontWeight: 400
                                        }}>
                                            {formatPrice(Number(calc.price_per_unit))}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'flex-end',
                                            py: 1,
                                            px: 1,
                                            color: 'text.primary',
                                            fontSize: '0.875rem',
                                            fontWeight: 400
                                        }}>
                                            {formatPrice(Number(calc.total_cost))}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>

                </Table>
            </TableContainer>

            {/* Summary row */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 4, 
                mb: 2,
                py: 1.5,
                px: 1
            }}>
                <Box>
                    <Box sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem'
                    }}>
                        {t('common.total')}:
                    </Box>
                    <Box sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem'
                    }}>
                        Foyda:
                    </Box>
                    <Box sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.875rem'
                    }}>
                        Foyda foizi:
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Box sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem'
                    }}>
                        {formatPrice(Number(total_cost))}
                    </Box>
                    <Box sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem'
                    }}>
                        {formatPrice(Number(profit))}
                    </Box>
                    <Box sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.875rem'
                    }}>
                        {profit_margin}
                    </Box>
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
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.name')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {item.name || '-'}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.description')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {item.description || '-'}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.measurement')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {t(`units.${item.measurement}`, { defaultValue: item.measurement })}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('ingredients.group')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {item.ingredient_group_name || '-'}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.quantity')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {item.quantity}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.price')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {formatPrice(Number(item.price))}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.createdAt')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {formatDate(item.created_at)}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.875rem'
                }}>
                    {t('semifinishedProducts.updatedAt')}:
                </Box>
                <Box sx={{ 
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    fontWeight: 400
                }}>
                    {formatDate(item.updated_at)}
                </Box>
            </Box>
        </Box>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const filterSelectSx = {
    ...FILTER_SELECT_SX,
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

export function HalfMeals() {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [measurementFilter, setMeasurementFilter] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
    const { departments } = useGetDepartments();
    const { data: metadata } = useMetadata([MetadataEntity.INGREDIENT_GROUPS]);

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
        sort_by: sortState.key || undefined,
        sort_order: sortState.dir || undefined,
        department_id: departmentId || undefined,
    });
    const { deleteCompound } = useDeleteCompound();
    const { deleteCompounds } = useDeleteCompounds();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [compoundToDelete, setCompoundToDelete] = useState<string | null>(null);

    // View modal
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ICompound>();

    const ingredientGroupMap = useMemo(() => {
        const map = new Map<string, string>();
        const ingredientGroups = metadata?.ingredient_groups || [];

        ingredientGroups.forEach((group: any) => {
            if (group?.id) {
                map.set(group.id, group.name || '-');
            }
        });

        return map;
    }, [metadata?.ingredient_groups]);

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
        const ingredientGroups = metadata?.ingredient_groups || [];

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
    }, [compounds, metadata?.ingredient_groups]);

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
                renderCell: ({ row }: { row: ICompound }) => (
                    <RenderCell label={row.name} />
                ),
            },
            {
                key: 'measurement',
                label: t('semifinishedProducts.measurement'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: ICompound) => row?.measurement || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const measurementKey = `semifinishedProducts.${value}`;
                    const label = t(measurementKey);
                    return <RenderCell label={label} />;
                },
            },
            {
                key: 'ingredient_group_name',
                label: t('ingredients.group'),
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: ICompound) => (
                        ingredientGroupMap.get(row.ingredient_group_id) ||
                        row.ingredient_group_name ||
                        '-'
                    ),
                renderCell: ({ row }: { row: ICompound }) => {
                    const groupName = ingredientGroupMap.get(row.ingredient_group_id) || row.ingredient_group_name || '-';
                    return <RenderCell label={groupName} />;
                },
            },
            {
                key: 'price',
                label: t('semifinishedProducts.price'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: ICompound) => {
                    const parsed = typeof row.price === 'string' ? parseFloat(row.price) : row.price;
                    const numPrice = Number.isFinite(parsed) ? parsed : 0;
                    return numPrice || 0;
                },
                renderCell: ({ value }: { value: unknown }) => {
                    const parsed = typeof value === 'string' ? parseFloat(value) : value;
                    const numPrice = Number.isFinite(parsed) ? parsed : 0;
                    return <RenderCell label={`${numPrice} so'm`} />;
                },
            },
            {
                key: 'quantity',
                label: t('semifinishedProducts.quantity'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: ICompound) => row?.quantity || 0,
                renderCell: ({ row }: { row: ICompound }) => {
                    const quantity = row?.quantity || 0;
                    return <RenderCell label={String(quantity)} />;
                },
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '1fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: ICompound }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1
                    }}>
                        <IconButton
                            size="small"
                            component={RouterLink}
                            href={paths.menu.semifinished.edit(row.id)}
                            onClick={(e) => e.stopPropagation()}
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
                                setCompoundToDelete(row.id);
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
                    data={measurementFilter ? compounds.filter((c) => c.measurement === measurementFilter) : compounds}
                    getRowId={(row: ICompound) => row.id}
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
                    toolbarActions={
                        <>
                            <TextField
                                select size="small" label={t('ingredients.group')}
                                value={departmentId}
                                onChange={(e) => {
                                    setDepartmentId(e.target.value);
                                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                }}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {ingredientGroupOptions.map(({ value, label }) => (
                                    <MenuItem key={value} value={value}>{label}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('semifinishedProducts.measurement')}
                                value={measurementFilter}
                                onChange={(e) => setMeasurementFilter(e.target.value)}
                                sx={{ ...filterSelectSx, minWidth: { xs: '100%', sm: 200 } }}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {['kg', 'l', 'piece'].map((v) => (
                                    <MenuItem key={v} value={v}>{t(`semifinishedProducts.${v}`)}</MenuItem>
                                ))}
                            </TextField>
                        </>
                    }
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount: pagination?.total || 0,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: handlePaginationPageChange,
                        onRowsPerPageChange: handlePaginationRowsPerPageChange,
                    }}
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
                        setDepartmentId('');
                        setMeasurementFilter('');
                        setSortState({ key: null, dir: null });
                        setPaginationModel({ page: 0, pageSize: 20 });
                    }}
                    onRowClick={openModal}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.menu.semifinished.new}
                            size="small"
                        >
                            {t('semifinishedProducts.add')}
                        </Button>
                    }
                    showTotals={false}
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
