import type { GridColDef } from '@mui/x-data-grid';
import type { ICompound } from 'src/types/compounds';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import ListItemText from '@mui/material/ListItemText';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';
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
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import { useGetCompounds, useDeleteCompound, useDeleteCompounds, useGetCompoundWithCalculations } from 'src/hooks/use-compounds';
import { useGetDepartments } from 'src/actions/departments';
import { useImageUrl } from 'src/hooks/use-image-url';
import { getInitials, getAvatarColor } from 'src/utils/avatar';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import { formatDate, formatPrice } from 'src/components/generic-view-view/modal-formatters';
import { useGetIngredients } from 'src/actions/ingredients';


function RenderCellCompound({ params }: { params: any }) {
    const { row } = params;
    const name = row.name || '-';
    const { imageUrl, loading } = useImageUrl(row.picture_url);

    // If no image, show avatar with initials
    const initials = getInitials(name);
    const bgColor = getAvatarColor(name);

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
                    bgcolor: !imageUrl ? bgColor : undefined,
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '20px',
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
 * Measurement renderer with translation
 */
function RenderCellMeasurement({ params }: { params: any }) {
    const { t } = useTranslation('menu');
    const { value } = params;

    const measurementKey = `semifinishedProducts.${value}`;
    const label = t(measurementKey);

    return <span>{label}</span>;
}

/**
 * Price renderer
 */
function RenderCellPrice({ params }: { params: any }) {
    const { value } = params;
    const numPrice = typeof value === 'string' ? parseFloat(value) : value;
    return <span>{numPrice} so&apos;m</span>;
}

// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

/**
 * Compound calculations table renderer
 */
function CompoundCalculationsTable({ compoundId }: { compoundId: string }) {
    const { t } = useTranslation('menu');
    const { compoundWithCalculations, loading } = useGetCompoundWithCalculations(compoundId);
    const { ingredients } = useGetIngredients();
    const { compounds } = useGetCompounds();

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
    const specs = [
        { label: t('semifinishedProducts.name'), value: item.name || '-' },
        { label: t('semifinishedProducts.description'), value: item.description || '-' },
        {
            label: t('semifinishedProducts.measurement'),
            value: t(`semifinishedProducts.${item.measurement}`, item.measurement),
        },
        { label: t('semifinishedProducts.department'), value: item.department_name || '-' },
        { label: t('semifinishedProducts.quantity'), value: item.quantity },
        { label: t('semifinishedProducts.price'), value: formatPrice(Number(item.price)) },
        { label: t('semifinishedProducts.createdAt'), value: formatDate(item.created_at) },
        { label: t('semifinishedProducts.updatedAt'), value: formatDate(item.updated_at) },
    ];

    return <SpecificationsTable rows={specs} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HalfMeals() {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    // SWR hooks
    const { compounds, compoundsLoading, mutate } = useGetCompounds();
    const { departments } = useGetDepartments();
    const { deleteCompound } = useDeleteCompound();
    const { deleteCompounds } = useDeleteCompounds();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [compoundToDelete, setCompoundToDelete] = useState<string | null>(null);

    // View modal
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ICompound>();

    // Convert departments array to map for filtering
    const departmentsMap = useMemo(() => {
        const deptMap: Record<string, string> = {};
        departments.forEach((dept: any) => {
            deptMap[dept.id] = dept.name;
        });
        return deptMap;
    }, [departments]);

    // Measurement options with translations
    const _measurementOptions = useMemo(
        () => [
            { value: 'kg', label: t('semifinishedProducts.kg') },
            { value: 'l', label: t('semifinishedProducts.l') },
            { value: 'piece', label: t('semifinishedProducts.piece') },
        ],
        [t]
    );

    // Department options for filtering
    const departmentOptions = useMemo(
        () =>
            departments.map((dept: any) => ({
                value: dept.id,
                label: dept.name,
            })),
        [departments]
    );

    // Columns config
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: t('semifinishedProducts.name'),
                flex: 1,
                minWidth: 250,
                hideable: false,
                renderCell: (params) => <RenderCellCompound params={params} />,
            },
            {
                field: 'measurement',
                headerName: t('semifinishedProducts.measurement'),
                width: 120,
                renderCell: (params) => <RenderCellMeasurement params={params} />,
            },
            {
                field: 'price',
                headerName: t('semifinishedProducts.price'),
                width: 140,
                renderCell: (params) => <RenderCellPrice params={params} />,
            },
            {
                field: 'department_name',
                headerName: t('semifinishedProducts.department'),
                width: 150,
                type: 'string',
            },
            {
                field: 'quantity',
                headerName: t('semifinishedProducts.quantity'),
                width: 120,
                type: 'number',
            },
            // {
            //     field: 'created_at',
            //     headerName: t('semifinishedProducts.createdAt'),
            //     width: 160,
            //     renderCell: (params) => formatDate(params.value),
            // },
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
                        label={t('semifinishedProducts.view')}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => openModal(params.row)}
                    />,
                    <CustomGridActionsCellItem
                        // showInMenu
                        label={t('semifinishedProducts.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.menu.semifinished.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        // showInMenu
                        label={t('semifinishedProducts.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => {
                            setCompoundToDelete(params.row.id);
                            setDeleteDialogOpen(true);
                        }}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [t, theme.vars.palette.error.main]
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

    return (
        <>
            <GenericTableView<ICompound>
                data={compounds}
                loading={compoundsLoading}
                columns={columns}
                breadcrumbs={{
                    heading: t('semifinishedProducts.title'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('semifinishedProducts.title'), href: paths.menu.semifinished.root },
                        { name: t('semifinishedProducts.list') },
                    ],
                }}
                addButton={{
                    label: t('semifinishedProducts.add'),
                    href: paths.menu.semifinished.new,
                }}
                filterOptions={{
                    department_id: departmentOptions,
                }}
                initialFilters={{
                    department_id: [],
                }}
                hideColumns={{}}
                hideColumnsTogglable={['actions']}
                onDeleteRow={handleDelete}
                onDeleteRows={handleDeleteMultiple}
            />

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
                            <CompoundCalculationsTable compoundId={item.id} />
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
