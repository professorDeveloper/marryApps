import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from 'src/routes/paths';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';

export function InvoicesListView() {
    const { t } = useTranslation('menu');
    const { getInvoices, deleteInvoices } = useInvoiceAPI();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const invoices = await getInvoices();
                setRows(invoices);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getInvoices]);

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
                    // <CustomGridActionsCellItem
                    //     showInMenu
                    //     label={t('view')}
                    //     icon={<Iconify icon="solar:eye-bold" />}
                    //     href={`${paths.warehouse.invoiceDetails.root}?invoice_id=${params.row.id}`}
                    // />,
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
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this invoice?')) {
                                deleteInvoices([params.row.id]).then(() => {
                                    setRows((prev) => prev.filter((row) => row.id !== params.row.id));
                                });
                            }
                        }}
                    />,
                ],
            },
        ],
        [t, rows, deleteInvoices]
    );

    return (
        <GenericTableView
            data={rows}
            loading={loading}
            columns={columns}
            breadcrumbs={{
                heading: t('invoices.title', 'Invoices'),
                links: [
                    { name: t('overview.menu.title'), href: paths.menu.root },
                    { name: t('warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                    { name: t('invoices.title', 'Invoices'), href: paths.warehouse.invoices.root },
                ],
            }}
            addButton={{ label: t('add'), href: paths.warehouse.invoices.new }}
        />
    );
}
