import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';

import {
    Box,
    Button,
    Dialog,
    IconButton,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useSupplierAPI } from 'src/hooks/use-supplier-api';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

export function InvoicesListView() {
    const { t } = useTranslation('menu');
    const { getSuppliers, deleteSuppliers } = useSupplierAPI();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const suppliers = await getSuppliers();
                let filteredData = Array.isArray(suppliers)
                    ? suppliers.filter((row) => row && typeof row === 'object' && row.id != null)
                    : [];

                // Apply search filter
                if (debouncedSearchQuery) {
                    const searchLower = debouncedSearchQuery.toLowerCase();
                    filteredData = filteredData.filter((supplier) => {
                        const searchableText = [
                            supplier.name,
                            supplier.phone_number,
                        ].filter(Boolean).join(' ').toLowerCase();
                        return searchableText.includes(searchLower);
                    });
                }

                setRows(filteredData);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getSuppliers, debouncedSearchQuery]);

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

    const columns = useMemo(
        () => [
            {
                key: 'name',
                label: t('warehouse.suppliers.name'),
                sortable: true,
                width: '2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.name ?? '',
            },
            {
                key: 'phone_number',
                label: t('warehouse.suppliers.phoneNumber'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.phone_number ?? '',
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.5fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => window.location.href = paths.warehouse.suppliers.edit(row.id)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setSupplierToDelete(row.id);
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
        [t]
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
                <DeductionUtilityDataTable
                    persistKey="warehouse-suppliers"
                    data={rows}
                    getRowId={(row: any) => String(row?.id)}
                    columns={columns}
                    searchValue={searchQuery}
                    onSearchChange={(value: string) => {
                        setSearchQuery(value);
                    }}
                    defaultConfig={{
                        order: ['name', 'phone_number', 'actions'],
                        visibility: {
                            name: true,
                            phone_number: true,
                            actions: true,
                        },
                        widths: {
                            name: '2fr',
                            phone_number: '1fr',
                            actions: '0.5fr',
                        },
                    }}
                    onReset={() => {
                        setSearchQuery('');
                    }}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            href={paths.warehouse.suppliers.new}
                            size="small"
                        >
                            {t('common.add')}
                        </Button>
                    }
                />
            </DashboardContent>

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
