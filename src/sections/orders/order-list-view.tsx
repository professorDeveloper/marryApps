// ============================================================================
// ORDER LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { IOrderItem } from 'src/types/order';

import { useMemo, useCallback } from 'react';

import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericDataTable } from 'src/hooks/use-generic-data-table';

import { endpoints } from 'src/lib/axios';
import { mockOrders } from 'src/_mock/_orders';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { RenderCellItem ,
    GenericTableView,
} from 'src/components/generic-table-view';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
];

const STATUS_COLOR_MAP = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'error',
    refunded: 'info',
} as const;

// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Order number renderer with customer avatar
 */
function RenderCellOrderNumber({ params }: { params: any }) {
    const { row } = params;
    const customer = row.customer;

    return (
        <RenderCellItem
            params={{
                ...params,
                row: {
                    ...row,
                    name: row.orderNumber,
                    coverUrl: customer.avatarUrl,
                },
            }}
            href={paths.menu.order.details(row.id)}
            imageField="coverUrl"
            nameField="name"
        />
    );
}

/**
 * Status renderer with color chip
 */
function RenderCellStatus({ params }: { params: any }) {
    const { value } = params;

    return (
        <Chip
            label={value}
            color={STATUS_COLOR_MAP[value as keyof typeof STATUS_COLOR_MAP]}
            size="small"
            variant="soft"
        />
    );
}

/**
 * Customer info renderer
 */
function RenderCellCustomer({ params }: { params: any }) {
    const { customer } = params.row;

    return (
        <div>
            <div style={{ fontWeight: 500 }}>{customer.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#999' }}>{customer.email}</div>
        </div>
    );
}

/**
 * Amount renderer with formatting
 */
function RenderCellAmount({ params }: { params: any }) {
    const { value } = params;

    return <div>${value.toFixed(2)}</div>;
}

/**
 * Quantity renderer
 */
function RenderCellQuantity({ params }: { params: any }) {
    const { totalQuantity } = params.row;

    return <div>{totalQuantity} items</div>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrderListView() {
    const theme = useTheme();
   // Generic hook ishlatamiz - product API'dan data olamiz (mock uchun)
    const { data: orders, loading } = useGenericDataTable<IOrderItem>({
        endpoint: endpoints.product.list, // Product API'dan data (mock)
        dataKey: 'products',
    });

    // Columns config - Product page'si kabi
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'orderNumber',
                headerName: 'Order Number',
                flex: 1,
                minWidth: 160,
                hideable: false,
                renderCell: (params) => <RenderCellOrderNumber params={params} />,
            },
            {
                field: 'customer',
                headerName: 'Customer',
                flex: 1,
                minWidth: 200,
                sortable: false,
                filterable: false,
                renderCell: (params) => <RenderCellCustomer params={params} />,
            },
            {
                field: 'totalAmount',
                headerName: 'Amount',
                width: 120,
                align: 'right',
                renderCell: (params) => <RenderCellAmount params={params} />,
            },
            {
                field: 'totalQuantity',
                headerName: 'Items',
                width: 100,
                renderCell: (params) => <RenderCellQuantity params={params} />,
            },
            {
                field: 'status',
                headerName: 'Status',
                width: 130,
                type: 'singleSelect',
                filterable: true,
                editable: true,
                valueOptions: STATUS_OPTIONS,
                renderCell: (params) => <RenderCellStatus params={params} />,
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: ' ',
                width: 64,
                align: 'right',
                headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        showInMenu
                        label="Edit"
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.menu.order.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label="View"
                        icon={<Iconify icon="solar:eye-bold" />}
                        href={paths.menu.order.details(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label="Delete"
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDelete(params.row.id)}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [theme.vars.palette.error.main]
    );

    const handleDelete = useCallback((id: string) => {
        console.log('Delete order:', id);
        // Bu yerda API delete request qiling
    }, []);

    const handleDeleteMultiple = useCallback((ids: string[]) => {
        console.log('Delete multiple orders:', ids);
        // Bu yerda API delete request qiling
    }, []);

    return (
        <GenericTableView<IOrderItem>
            data={mockOrders}
            loading={loading}
            columns={columns}
            breadcrumbs={{
                heading: 'Buyurtmalar',
                links: [
                    { name: 'Dashboard', href: paths.dashboard.root },
                    { name: 'Orders', href: paths.menu.order.root },
                    { name: 'List' },
                ],
            }}
            addButton={{
                label: 'Buyurtma qo\'shish',
                href: paths.menu.order.new,
            }}
            filterOptions={{
                status: STATUS_OPTIONS,
            }}
            initialFilters={{
                status: [],
            }}
            hideColumns={{}}
            hideColumnsTogglable={['actions']}
            onDeleteRow={handleDelete}
            onDeleteRows={handleDeleteMultiple}
        />
    );
}
