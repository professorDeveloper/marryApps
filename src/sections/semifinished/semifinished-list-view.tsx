// ============================================================================
// ORDER LIST VIEW - SINGLE FILE IMPLEMENTATION
// ============================================================================
// Faqat BITTA fayl - hamma logic, filters va renderers shu yerda

import type { GridColDef } from '@mui/x-data-grid';
import type { ISemifinishedItem } from 'src/types/semifinished';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericDataTable } from 'src/hooks/use-generic-data-table';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { endpoints } from 'src/lib/axios';
import { mockOrders } from 'src/_mock/_orders';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable } from 'src/components/generic-view-view';
import {
    RenderCellItem,
    GenericTableView,
} from 'src/components/generic-table-view';
import { formatDate, formatPrice, formatQuantity } from 'src/components/generic-view-view/modal-formatters';

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
 * Status renderer with color chip - 4 tilga integratsiya
 */
function RenderCellStatus({ params }: { params: any }) {
    const { t } = useTranslation('menu');
    const { value } = params;

    const STATUS_COLOR_MAP = {
        pending: 'warning',
        completed: 'success',
        cancelled: 'error',
        refunded: 'info',
    } as const;

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return t('semifinishedProducts.pending');
            case 'completed':
                return t('semifinishedProducts.completed');
            case 'cancelled':
                return t('semifinishedProducts.cancelled');
            case 'refunded':
                return t('semifinishedProducts.refunded');
            default:
                return status;
        }
    };

    return (
        <Chip
            label={getStatusLabel(value)}
            color={STATUS_COLOR_MAP[value as keyof typeof STATUS_COLOR_MAP]}
            size="small"
            variant="soft"
        />
    );
}

/**
 * Unit renderer - 4 tilga integratsiya
 */
function RenderCellUnit({ params }: { params: any }) {
    const { t } = useTranslation('menu');
    const { value } = params;

    const getUnitLabel = (unit: string) => {
        const unitKey = `semifinishedProducts.${unit}`;
        try {
            return t(unitKey);
        } catch {
            return unit;
        }
    };

    return <span>{getUnitLabel(value)}</span>;
}

// ============================================================================
// SPECIFICATIONS RENDERING
// ============================================================================

/**
 * Semifinished item'uchun modal render function - 4 tilga to'liq integratsiya
 */
function renderSemifinishedSpecifications(item: ISemifinishedItem, t: any) {
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return t('semifinishedProducts.pending');
            case 'completed':
                return t('semifinishedProducts.completed');
            case 'cancelled':
                return t('semifinishedProducts.cancelled');
            case 'refunded':
                return t('semifinishedProducts.refunded');
            default:
                return status;
        }
    };

    const getUnitLabel = (unit: string) => {
        const unitKey = `semifinishedProducts.${unit}`;
        try {
            return t(unitKey);
        } catch {
            return unit;
        }
    };

    const specs = [
        { label: t('semifinishedProducts.name'), value: item.name || '-' },
        { label: t('semifinishedProducts.sku'), value: item.sku || '-' },
        { label: t('semifinishedProducts.unit'), value: getUnitLabel(item.unit) },
        { label: t('semifinishedProducts.category'), value: item.category || '-' },
        { label: t('semifinishedProducts.originalPrice'), value: formatPrice(item.originalPrice) },
        { label: t('semifinishedProducts.quantity'), value: formatQuantity(item.quantity) },
        { label: t('semifinishedProducts.status'), value: getStatusLabel(item.status || 'pending') },
        { label: t('semifinishedProducts.createdAt'), value: formatDate(item.createdAt) },
    ];

    return <SpecificationsTable rows={specs} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HalfMeals() {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    // Generic hook ishlatamiz - product API'dan data olamiz (mock uchun)
    const { data: orders, loading } = useGenericDataTable<ISemifinishedItem>({
        endpoint: endpoints.product.list, // Product API'dan data (mock)
        dataKey: 'products',
    });

    // View modal hook'i
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<ISemifinishedItem>();

    // Update options with translations - Dinamik tilga nisbatan yangilandi
    const statusOptions = useMemo(
        () => [
            { value: 'pending', label: t('semifinishedProducts.pending') },
            { value: 'completed', label: t('semifinishedProducts.completed') },
            { value: 'cancelled', label: t('semifinishedProducts.cancelled') },
            { value: 'refunded', label: t('semifinishedProducts.refunded') },
        ],
        [t]
    );

    const unitOptions = useMemo(
        () => [
            { value: 'kg', label: t('semifinishedProducts.kg') },
            { value: 'g', label: t('semifinishedProducts.g') },
            { value: 'l', label: t('semifinishedProducts.l') },
            { value: 'ml', label: t('semifinishedProducts.ml') },
            { value: 'm', label: t('semifinishedProducts.m') },
            { value: 'cm', label: t('semifinishedProducts.cm') },
            { value: 'dona', label: t('semifinishedProducts.dona') },
            { value: 'paket', label: t('semifinishedProducts.paket') },
        ],
        [t]
    );

    // Columns config - Product page'si kabi
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'name',
                headerName: t('semifinishedProducts.name'),
                flex: 1,
                minWidth: 200,
                hideable: false,
                renderCell: (params) => <RenderCellOrderNumber params={params} />,
            },
            {
                field: 'unit',
                headerName: t('semifinishedProducts.unit'),
                width: 120,
                type: 'singleSelect',
                editable: true,
                filterable: false,
                valueOptions: unitOptions,
                renderCell: (params) => <RenderCellUnit params={params} />,
            },
            {
                field: 'category',
                headerName: t('semifinishedProducts.category'),
                width: 140,
                type: 'string',
            },
            {
                field: 'originalPrice',
                headerName: t('semifinishedProducts.originalPrice'),
                width: 120,
                type: 'number',
                renderCell: (params) => `${params.value?.toLocaleString()} so'm`,
            },
            {
                field: 'quantity',
                headerName: t('semifinishedProducts.quantity'),
                width: 100,
                type: 'number',
            },
            {
                field: 'status',
                headerName: t('semifinishedProducts.status'),
                width: 140,
                type: 'singleSelect',
                filterable: false,
                valueOptions: statusOptions,
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
                        label={t('semifinishedProducts.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.menu.semifinished.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('semifinishedProducts.view')}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => openModal(params.row)}
                    />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('semifinishedProducts.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDelete(params.row.id)}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [theme.vars.palette.error.main, t, statusOptions, unitOptions]
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
                    heading: t('semifinishedProducts.title'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('semifinishedProducts.title'), href: paths.menu.semifinished.root },
                        { name: t('semifinishedProducts.list') },
                    ],
                }}
                addButton={{
                    label: t('semifinishedProducts.add'),
                    href: paths.menu.semifinished.new,
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

            {/* Semifinished Item View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.name || t('semifinishedProducts.title')}
                data={selectedData}
                renderContent={(data) => renderSemifinishedSpecifications(data, t)}
                maxWidth="sm"
                slideDirection="left"
                position="right"
            />
        </>
    );
}
