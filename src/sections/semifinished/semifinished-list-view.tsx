// ============================================================================
// ORDER LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { ISemifinishedItem } from 'src/types/semifinished';

import { useMemo, useCallback } from 'react';

import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericDataTable } from 'src/hooks/use-generic-data-table';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { endpoints } from 'src/lib/axios';
import { mockOrders } from 'src/_mock/_orders';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import {
    RenderCellItem,
    GenericTableView,
} from 'src/components/generic-table-view';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import { formatPrice, formatQuantity, formatDate } from 'src/components/generic-view-view/modal-formatters';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
];

const UNIT_OPTIONS = [
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'l', label: 'l' },
    { value: 'ml', label: 'ml' },
    { value: 'm', label: 'm' },
    { value: 'cm', label: 'cm' },
    { value: 'dona', label: 'dona' },
    { value: 'paket', label: 'paket' },
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

    return (
        <RenderCellItem
            params={params}
            href={`/dashboard/semifinished/${row.id}`}
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

// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

/**
 * Semifinished item'uchun modal render function
 */
function renderSemifinishedSpecifications(item: ISemifinishedItem) {
    const specs = [
        { label: 'Nomi', value: item.name || '-' },
        { label: 'SKU', value: item.sku || '-' },
        { label: 'O\'lchov birligi', value: item.unit || '-' },
        { label: 'Guruh', value: item.category || '-' },
        { label: 'Asl Narxi', value: formatPrice(item.originalPrice) },
        { label: 'Miqdori', value: formatQuantity(item.quantity) },
        { label: 'Yaratilgan', value: formatDate(item.createdAt) },
    ];

    return <SpecificationsTable rows={specs} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HalfMeals() {
    const theme = useTheme();
    // Generic hook ishlatamiz - product API'dan data olamiz (mock uchun)
    const { data: orders, loading } = useGenericDataTable<ISemifinishedItem>({
        endpoint: endpoints.product.list, // Product API'dan data (mock)
        dataKey: 'products',
    });

    // View modal hook'i
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ISemifinishedItem>();

    // Columns config - Product page'si kabi
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: 'Nomi',
                flex: 1,
                minWidth: 200,
                hideable: false,
                renderCell: (params) => <RenderCellOrderNumber params={params} />,
            },
            {
                field: 'unit',
                headerName: "O'lchov birligi",
                width: 120,
                type: 'singleSelect',
                editable: true,
                filterable: false,
                valueOptions: UNIT_OPTIONS,
            },
            {
                field: 'category',
                headerName: 'Guruh',
                width: 140,
                type: 'string',
            },
            {
                field: 'originalPrice',
                headerName: 'Asl Narxi',
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value?.toLocaleString()} so'm`,
            },
            {
                field: 'quantity',
                headerName: 'Miqdori',
                width: 100,
                type: 'number',
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
                        href={paths.menu.semifinished.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label="View"
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => openModal(params.row)}
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
        <>
            <GenericTableView<ISemifinishedItem>
                data={mockOrders}
                loading={loading}
                columns={columns}
                breadcrumbs={{
                    heading: 'Yarim tayyor mahsulotlar',
                    links: [
                        { name: 'Dashboard', href: paths.dashboard.root },
                        { name: 'Yarim tayyor mahsulotlar', href: paths.menu.semifinished.root },
                        { name: 'List' },
                    ],
                }}
                addButton={{
                    label: 'Mahsulot qo\'shish',
                    href: paths.menu.semifinished.new,
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

            {/* Semifinished Item View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.name || 'Yarim tayyor mahsulot'}
                data={selectedData}
                renderContent={renderSemifinishedSpecifications}
                maxWidth="sm"
                slideDirection="left"
                position="right"
            />
        </>
    );
}
