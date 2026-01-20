import type { GridColDef } from '@mui/x-data-grid';

import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';

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
    const [rows, setRows] = useState<InvoiceDetailWithInvoiceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Get all invoice details
                const details = await getInvoiceDetails();

                // Get invoices for enriching data
                const invoices = await getInvoices();

                // Get ingredients for enriching data
                const ingredients = await getIngredients();

                // Enrich details with invoice and ingredient info
                const enrichedDetails = details.map((detail) => {
                    const invoice = invoices.find((inv) => inv.id === detail.invoice_id);
                    const ingredient = ingredients.find((ing) => ing.id === detail.ingredient_id);
                    return {
                        ...detail,
                        invoice_supplier_name: invoice?.supplier_name || 'Unknown',
                        invoice_date: invoice?.date || '',
                        ingredient_name: ingredient?.name || detail.ingredient_id,
                    };
                });

                setRows(enrichedDetails);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getInvoiceDetails, getInvoices, getIngredients]);

    const handleDeleteClick = (id: string) => {
        setSelectedDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedDeleteId) {
            await deleteInvoiceDetails([selectedDeleteId]);
            setRows((prev) => prev.filter((row) => row.id !== selectedDeleteId));
            setDeleteDialogOpen(false);
            setSelectedDeleteId(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'id',
                headerName: '№',
                width: 80,
                renderCell: (params) => {
                    const index = rows.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'invoice_supplier_name',
                headerName: t('supplier_name', 'Yetkazib beruvchi'),
                flex: 1,
                minWidth: 200,
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
                field: 'invoice_date',
                headerName: t('date', 'Sana'),
                width: 140,
                renderCell: (params) => {
                    if (!params.row.invoice_date) return '-';
                    return new Date(params.row.invoice_date).toLocaleDateString();
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
                        href={paths.menu.warehouse.invoiceDetails.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(params.row.id)}
                    />,
                ],
            },
        ],
        [t, rows, deleteInvoiceDetails]
    );

    return (
        <>
            <GenericTableView
                data={rows}
                loading={loading}
                columns={columns}
                breadcrumbs={{
                    heading: t('overview.warehouse.invoiceDetails', 'Kirimlar'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('overview.warehouse.title', 'Warehouse'), href: paths.menu.warehouse.root },
                        { name: t('overview.warehouse.invoiceDetails', 'Kirimlar'), href: paths.menu.warehouse.invoiceDetails.root },
                    ],
                }}
                addButton={{ label: t('add'), href: paths.menu.warehouse.invoiceDetails.new }}
            />

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
                <DialogContent>
                    <p>Siz bu kirimni o'chirishni istaysiz? Bu amal qaytarilmaydi.</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} variant="outlined">
                        Bekor qilish
                    </Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        O'chirish
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
