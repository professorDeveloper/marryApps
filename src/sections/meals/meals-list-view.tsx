// ============================================================================
// ORDER LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { IMealsItem } from 'src/types/meals';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
 * Order number renderer
 */
function RenderCellOrderNumber({ params }: { params: any }) {
    const { row } = params;

    return (
        <RenderCellItem
            params={params}
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
function renderMealsSpecifications(item: IMealsItem, t: any) {
    const specs = [
        { label: t('mealsProducts.name'), value: item.name || '-' },
        { label: t('mealsProducts.sku'), value: item.sku || '-' },
        { label: t('mealsProducts.unit'), value: item.unit || '-' },
        { label: t('mealsProducts.category'), value: item.category || '-' },
        { label: t('mealsProducts.originalPrice'), value: formatPrice(item.originalPrice) },
        { label: t('mealsProducts.quantity'), value: formatQuantity(item.quantity) },
        { label: t('mealsProducts.createdAt'), value: formatDate(item.createdAt) },
    ];

    return <SpecificationsTable rows={specs} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Meals() {
    const theme = useTheme();
    const { t } = useTranslation('menu');
    // Generic hook ishlatamiz - product API'dan data olamiz (mock uchun)
    const { data: orders, loading } = useGenericDataTable<IMealsItem>({
        endpoint: endpoints.product.list, // Product API'dan data (mock)
        dataKey: 'products',
    });

    // View modal hook'i
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IMealsItem>();

    // Update options with translations
    const statusOptions = useMemo(
        () => [
            { value: 'pending', label: t('mealsProducts.pending') },
            { value: 'completed', label: t('mealsProducts.completed') },
            { value: 'cancelled', label: t('mealsProducts.cancelled') },
            { value: 'refunded', label: t('mealsProducts.refunded') },
        ],
        [t]
    );

    const unitOptions = useMemo(
        () => [
            { value: 'kg', label: t('mealsProducts.kg') },
            { value: 'g', label: t('mealsProducts.g') },
            { value: 'l', label: t('mealsProducts.l') },
            { value: 'ml', label: t('mealsProducts.ml') },
            { value: 'm', label: t('mealsProducts.m') },
            { value: 'cm', label: t('mealsProducts.cm') },
            { value: 'dona', label: t('mealsProducts.dona') },
            { value: 'paket', label: t('mealsProducts.paket') },
        ],
        [t]
    );

    // Columns config - Product page'si kabi
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: t('mealsProducts.name'),
                flex: 1,
                minWidth: 200,
                hideable: false,
                renderCell: (params) => <RenderCellOrderNumber params={params} />,
            },
            {
                field: 'category',
                headerName: t('mealsProducts.category'),
                width: 140,
                type: 'string',
            },
            {
                field: 'section',
                headerName: t('mealsProducts.section'),
                width: 140,
                type: 'string',
            },
            {
                field: 'stock',
                headerName: t('mealsProducts.stock'),
                width: 140,
                type: 'string',
            },
            {
                field: 'originalPrice',
                headerName: t('mealsProducts.originalPrice'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value?.toLocaleString()} so'm`,
            },
            {
                field: 'price',
                headerName: t('mealsProducts.price'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value?.toLocaleString()} so'm`,
            },
            {
                field: 'profitnumber',
                headerName: t('mealsProducts.profitnumber'),
                width: 100,
                type: 'number',
            },
            {
                field: 'profit',
                headerName: `${t('mealsProducts.profit')}`,
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
                        label={t('mealsProducts.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.menu.meals.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('mealsProducts.view')}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => openModal(params.row)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('mealsProducts.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDelete(params.row.id)}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [theme.vars.palette.error.main, t, unitOptions, statusOptions]
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
            <GenericTableView<IMealsItem>
                data={mockMeals}
                loading={loading}
                columns={columns}
                breadcrumbs={{
                    heading: t('mealsProducts.title'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('mealsProducts.title'), href: paths.menu.meals.root },
                        { name: t('mealsProducts.list') },
                    ],
                }}
                addButton={{
                    label: t('mealsProducts.add'),
                    href: paths.menu.meals.new,
                }}
                filterOptions={{
                    status: statusOptions,
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
                title={selectedData?.name || t('mealsProducts.title')}
                data={selectedData}
                renderContent={(data) => renderMealsSpecifications(data, t)}
                maxWidth="sm"
                slideDirection="left"
                position="right"
            />
        </>
    );
}
