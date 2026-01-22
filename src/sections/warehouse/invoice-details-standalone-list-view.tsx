import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal } from 'src/components/generic-view-view';
import { DataGrid } from '@mui/x-data-grid';

interface InvoiceDetailWithInvoiceInfo {
    id: string;
    invoice_id: string;
    ingredient_id: string;
    ingredient_name?: string;
    quantity: number;
    price: string;
    price_per_unit: string;
    created_at: string;
    updated_at: string;
    invoice_supplier_name?: string;
    invoice_date?: string;
}

export function InvoiceDetailsStandaloneListView() {
    const { t } = useTranslation('menu');
    const { getInvoiceDetails, deleteInvoiceDetails, getInvoices, getIngredients } = useInvoiceDetailsAPI();
    const { deleteInvoices } = useInvoiceAPI();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [allDetails, setAllDetails] = useState<InvoiceDetailWithInvoiceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const [selectedDeleteType, setSelectedDeleteType] = useState<'invoice' | 'detail' | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchedInvoices = await getInvoices();
                const details = await getInvoiceDetails();
                const ingredients = await getIngredients();

                const enrichedDetails = details.map((detail) => {
                    const invoice = fetchedInvoices.find((inv) => inv.id === detail.invoice_id);
                    const ingredient = ingredients.find((ing) => ing.id === detail.ingredient_id);
                    return {
                        ...detail,
                        invoice_supplier_name: invoice?.supplier_name || 'Unknown',
                        invoice_date: invoice?.date || '',
                        ingredient_name: ingredient?.name || detail.ingredient_id,
                    };
                });

                setInvoices(fetchedInvoices);
                setAllDetails(enrichedDetails);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getInvoiceDetails, getInvoices, getIngredients]);

    const handleDeleteClick = (id: string, type: 'invoice' | 'detail') => {
        setSelectedDeleteId(id);
        setSelectedDeleteType(type);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedDeleteId && selectedDeleteType) {
            if (selectedDeleteType === 'invoice') {
                await deleteInvoices([selectedDeleteId]);
                setInvoices((prev) => prev.filter((row) => row.id !== selectedDeleteId));
                setAllDetails((prev) => prev.filter((detail) => detail.invoice_id !== selectedDeleteId));
            } else if (selectedDeleteType === 'detail') {
                await deleteInvoiceDetails([selectedDeleteId]);
                setAllDetails((prev) => prev.filter((row) => row.id !== selectedDeleteId));
                // Refresh the invoice details to ensure data consistency
                const details = await getInvoiceDetails();
                const ingredients = await getIngredients();
                const enrichedDetails = details.map((detail) => {
                    const invoice = invoices.find((inv: any) => inv.id === detail.invoice_id);
                    const ingredient = ingredients.find((ing: any) => ing.id === detail.ingredient_id);
                    return {
                        ...detail,
                        invoice_supplier_name: invoice?.supplier_name || 'Unknown',
                        invoice_date: invoice?.date || '',
                        ingredient_name: ingredient?.name || detail.ingredient_id,
                    };
                });
                setAllDetails(enrichedDetails);
            }
            setDeleteDialogOpen(false);
            setSelectedDeleteId(null);
            setSelectedDeleteType(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
        setSelectedDeleteType(null);
    };

    const handleViewClick = (invoice: any) => {
        setSelectedInvoice(invoice);
    };

    const handleModalClose = () => {
        setSelectedInvoice(null);
    };

    const invoiceColumns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'id',
                headerName: '№',
                width: 80,
                renderCell: (params) => {
                    const index = invoices.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'supplier_name',
                headerName: t('invoices.name', 'Supplier Name'),
                flex: 1,
                minWidth: 200,
            },
            {
                field: 'supplier_phone',
                headerName: t('invoices.phone', 'Phone'),
                width: 160,
            },
            {
                field: 'supplier_email',
                headerName: t('invoices.email', 'Email'),
                flex: 1,
                minWidth: 220,
            },
            {
                field: 'total_amount',
                headerName: t('invoices.totalAmount', 'Total Amount'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.total_amount || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                field: 'status',
                headerName: t('invoices.status', 'Status'),
                width: 120,
                renderCell: (params) => {
                    const status = params.row.status?.toLowerCase();
                    let color = 'default';
                    if (status === 'pending') color = 'warning';
                    if (status === 'completed') color = 'success';
                    if (status === 'cancelled') color = 'error';
                    return (
                        <span
                            style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: 700,
                                marginTop: '20px',
                                marginBottom: '20px',
                                backgroundColor:
                                    color === 'warning'
                                        ? '#FFF3CD'
                                        : color === 'success'
                                            ? '#D4EDDA'
                                            : color === 'error'
                                                ? '#F8D7DA'
                                                : '#E2E3E5',
                                color:
                                    color === 'warning'
                                        ? '#856404'
                                        : color === 'success'
                                            ? '#155724'
                                            : color === 'error'
                                                ? '#721C24'
                                                : '#383D41',
                            }}
                        >
                            {status}
                        </span>
                    );
                },
            },
            {
                field: 'date',
                headerName: t('invoices.date', 'Date'),
                width: 140,
                renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: ' ',
                width: 100,
                align: 'right',
                headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('view')}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => handleViewClick(params.row)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.warehouse.invoices.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(params.row.id, 'invoice')}
                    />,
                ],
            },
        ],
        [t, invoices]
    );

    const detailsColumns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'id',
                headerName: '№',
                width: 80,
                renderCell: (params) => {
                    const filtered = allDetails.filter((d) => d.invoice_id === selectedInvoice?.id);
                    const index = filtered.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'ingredient_id',
                headerName: t('ingredient', 'Mahsulot'),
                flex: 1,
                minWidth: 200,
                renderCell: (params) => params.row.ingredient_name || params.row.ingredient_id,
            },
            {
                field: 'quantity',
                headerName: t('quantity', 'Miqdori'),
                width: 120,
                renderCell: (params) => `${params.row.quantity}`,
            },
            {
                field: 'price_per_unit',
                headerName: t('price_per_unit', 'Birlik narxi'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.price_per_unit || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                field: 'price',
                headerName: t('total_price', 'Jami narx'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.price || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: ' ',
                width: 100,
                align: 'right',
                headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.warehouse.invoiceDetails.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(params.row.id, 'detail')}
                    />,
                ],
            },
        ],
        [t, selectedInvoice, allDetails]
    );

    const filteredDetails = allDetails.filter((detail) => detail.invoice_id === selectedInvoice?.id);

    return (
        <>
            <GenericTableView
                data={invoices}
                loading={loading}
                columns={invoiceColumns}
                breadcrumbs={{
                    heading: t('overview.warehouse.invoiceDetails', 'Kirimlar'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                        { name: t('overview.warehouse.invoiceDetails', 'Kirimlar'), href: paths.warehouse.invoiceDetails.root },
                    ],
                }}
                addButton={{ label: t('add'), href: paths.warehouse.invoices.new }}
            />

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>{t('warehouse.invoiceDetails.deleteConfirmation.title')}</DialogTitle>
                <DialogContent>
                    <p>{t('warehouse.invoiceDetails.deleteConfirmation.message')}</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} variant="outlined">
                        {t('warehouse.invoiceDetails.deleteConfirmation.cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        {t('warehouse.invoiceDetails.deleteConfirmation.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <GenericViewModal
                isOpen={!!selectedInvoice}
                onClose={handleModalClose}
                title={`Invoice Details for ${selectedInvoice?.supplier_name}`}
                data={selectedInvoice}
                maxWidth="sm"
                slideDirection="left"
                position="right"
                // position="center"
                renderContent={(data) => (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginY: '6px' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                href={`${paths.warehouse.invoiceDetails.new}?invoice_id=${data.id}`}
                                startIcon={<Iconify icon="solar:add-circle-bold" />}
                                style={{ marginBottom: '6px' }}
                            >
                                {t('add_detail', 'Add Detail')}
                            </Button>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <DataGrid
                                rows={filteredDetails}
                                columns={detailsColumns}
                                autoHeight
                                disableRowSelectionOnClick
                                disableColumnFilter
                                disableColumnMenu
                                disableColumnSelector
                                disableDensitySelector
                                hideFooterSelectedRowCount
                                pagination
                                pageSizeOptions={[10, 25, 50, 100]}
                                initialState={{
                                    pagination: {
                                        paginationModel: { page: 0, pageSize: 100 },
                                    },
                                }}
                                sx={{
                                    // Hide toolbar completely
                                    '& .MuiDataGrid-toolbarContainer, & .MuiDataGrid-toolbarContainer button': {
                                        display: 'none !important',
                                    },
                                    // Style column headers
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: 'background.paper',
                                    },
                                    // Hide menu icons in column headers
                                    '& .MuiDataGrid-menuIcon': {
                                        display: 'none !important',
                                    },
                                    // Remove focus outlines
                                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
                                        outline: 'none !important',
                                    },
                                    // Hide column separators
                                    '& .MuiDataGrid-columnSeparator': {
                                        display: 'none',
                                    },
                                }}
                                slots={{
                                    toolbar: () => null,
                                    columnMenu: () => null,
                                }}
                            />
                        </Box>
                    </>
                )}
            />
        </>
    );
}