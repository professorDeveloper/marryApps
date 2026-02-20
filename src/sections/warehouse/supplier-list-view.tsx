import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from 'src/routes/paths';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export function InvoicesListView() {
    const { t } = useTranslation('menu');
    const theme = {
        vars: {
            palette: {
                error: {
                    main: '#f44336',
                },
            },
        },
    };
    const { getSuppliers, deleteSuppliers } = useSupplierAPI();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const suppliers = await getSuppliers();
                setRows(
                    Array.isArray(suppliers)
                        ? suppliers.filter((row) => row && typeof row === 'object' && row.id != null)
                        : []
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getSuppliers]);

    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'id',
                headerName: '№',
                width: 80,
                renderCell: (params) => {
                    const index = rows.findIndex((row) => row && row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'name',
                headerName: t('warehouse.suppliers.name'),
                flex: 1,
                minWidth: 200,
                renderCell: (params) => <Box sx={{ mt: 1.5, mb: 1.5 }}>{params.row.name}</Box>,
            },
            {
                field: 'phone_number',
                headerName: t('warehouse.suppliers.phoneNumber'),
                width: 160,
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: t('actions'),
                width: 120,
                // align: 'right',
                // headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        // showInMenu
                        label={t('edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.warehouse.suppliers.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        // showInMenu
                        label={t('delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        style={{ color: theme.vars.palette.error.main }}
                        onClick={() => {
                            setSupplierToDelete(params.row.id);
                            setDeleteDialogOpen(true);
                        }}
                    />,
                ],
            },
        ],
        [t, rows, deleteSuppliers]
    );

    const handleConfirmDelete = async () => {
        if (supplierToDelete) {
            try {
                await deleteSuppliers([supplierToDelete]);
                setRows((prev) => prev.filter((row) => row && row.id !== supplierToDelete));
                setDeleteDialogOpen(false);
                setSupplierToDelete(null);
            } catch (error) {
                console.error('Failed to delete supplier:', error);
            }
        }
    };

    return (
        <>
            <GenericTableView
                data={rows}
                loading={loading}
                columns={columns}
                breadcrumbs={{
                    heading: t('warehouse.suppliers.title'),
                    links: [
                        { name: t('overview.menu.title'), href: paths.menu.root },
                        { name: t('warehouse.title'), href: paths.warehouse.root },
                        { name: t('warehouse.suppliers.title'), href: paths.warehouse.suppliers.root },
                    ],
                }}
                addButton={{ label: t('common.add'), href: paths.warehouse.suppliers.new }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('warehouse.suppliers.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    {t('warehouse.suppliers.deleteMessage')}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDeleteDialogOpen(false)}
                    >
                        {t('warehouse.suppliers.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        autoFocus
                    >
                        {t('warehouse.suppliers.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
