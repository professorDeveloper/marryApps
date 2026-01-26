import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { paths } from 'src/routes/paths';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';

export function InvoicesListView() {
    const { t } = useTranslation('menu');
    const { getSuppliers, deleteSuppliers } = useSupplierAPI();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const suppliers = await getSuppliers();
                setRows(suppliers);
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
                    const index = rows.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'name',
                headerName: t('suppliers.name', 'Supplier Name'),
                flex: 1,
                minWidth: 200,
            },
            {
                field: 'phone_number',
                headerName: t('suppliers.phone', 'Phone'),
                width: 160,
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
                        href={paths.warehouse.suppliers.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this supplier?')) {
                                deleteSuppliers([params.row.id]).then(() => {
                                    setRows((prev) => prev.filter((row) => row.id !== params.row.id));
                                });
                            }
                        }}
                    />,
                ],
            },
        ],
        [t, rows, deleteSuppliers]
    );

    return (
        <GenericTableView
            data={rows}
            loading={loading}
            columns={columns}
            breadcrumbs={{
                heading: t('suppliers.title', 'Suppliers'),
                links: [
                    { name: t('overview.menu.title'), href: paths.menu.root },
                    { name: t('warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                    { name: t('suppliers.title', 'Suppliers'), href: paths.warehouse.suppliers.root },
                ],
            }}
            addButton={{ label: t('add'), href: paths.warehouse.suppliers.new }}
        />
    );
}
