// ============================================================================
// ORDER LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { ISemifinishedItem } from 'src/types/semifinished';

import { useMemo, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericDataTable } from 'src/hooks/use-generic-data-table';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { endpoints } from 'src/lib/axios';
import { mockMeals } from 'src/_mock/_meals';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import {
    RenderCellItem,
    GenericTableView,
} from 'src/components/generic-table-view';
import { formatDate, formatPrice, formatQuantity } from 'src/components/generic-view-view/modal-formatters';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'completed', label: 'Tugallandi' },
    { value: 'cancelled', label: 'Bekor qilindi' },
    { value: 'refunded', label: 'Pul qaytarildi' },
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
            href={`/dashboard/meals/${row.id}`}
            imageField="coverUrl"
            nameField="name"
        />
    );
}


// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

/**
 * Meals item'uchun modal render function
 */
function renderMealsSpecifications(item: ISemifinishedItem) {
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

export function Meals() {
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
                        href={paths.menu.meals.edit(params.row.id)}
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
                data={mockMeals}
                loading={loading}
                columns={columns}
                breadcrumbs={{
                    heading: 'Mahsulotlar',
                    links: [
                        { name: 'Dashboard', href: paths.dashboard.root },
                        { name: 'Mahsulotlar', href: paths.menu.meals.root },
                        { name: 'List' },
                    ],
                }}
                addButton={{
                    label: 'Mahsulot qo\'shish',
                    href: paths.menu.meals.new,
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

            {/* Meals Item View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.name || 'Mahsulot'}
                data={selectedData}
                renderContent={renderMealsSpecifications}
                maxWidth="sm"
                slideDirection="left"
                position="right"
            />
        </>
    );
}
