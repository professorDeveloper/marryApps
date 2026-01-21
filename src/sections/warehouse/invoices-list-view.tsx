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
                headerName: t('supplier_name', 'Supplier Name'),
                flex: 1,
                minWidth: 200,
            },
            {
                field: 'supplier_phone',
                headerName: t('phone', 'Phone'),
                width: 160,
            },
            {
                field: 'supplier_email',
                headerName: t('email', 'Email'),
                flex: 1,
                minWidth: 220,
            },
            {
                field: 'total_amount',
                headerName: t('total_amount', 'Total Amount'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.total_amount || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                field: 'status',
                headerName: t('status', 'Status'),
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
                headerName: t('date', 'Date'),
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
                    //     href={paths.menu.warehouse.invoices.details(params.row.id)}
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
                heading: t('overview.warehouse.invoices', 'Invoices'),
                links: [
                    { name: t('app'), href: paths.menu.root },
                    { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                    { name: t('overview.warehouse.invoices', 'Invoices'), href: paths.warehouse.invoices.root },
                ],
            }}
            addButton={{ label: t('add'), href: paths.warehouse.invoices.new }}
        />
    );
}
