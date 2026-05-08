import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import type { SearchOutput } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Table,
  Tooltip,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  ToggleButton,
  CircularProgress,
  ToggleButtonGroup,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetIngredientReports, useGetIngredientReportDetail } from 'src/actions/ingredient-reports';
import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { Iconify } from 'src/components/iconify';
import { NoDataTooltip } from 'src/components/no-data-tooltip';
import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';
import { StorageFilter } from 'src/sections/warehouse/deduction/components/utility-data-table/components/StorageFilter';

// Helper functions
const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
    const date = new Date(
        Date.UTC(
            value.year(),
            value.month(),
            value.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0
        )
    );
    return date.toISOString().replace('.000Z', 'Z');
};

const getTodayUtcBoundary = (): string => {
    const today = dayjs();
    return toUtcDayBoundary(today);
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
    const tomorrow = dayjs().add(1, 'day');
    return toUtcDayBoundary(tomorrow, endOfDay);
};

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null);

// Filter types
interface IngredientReportsFilters {
    storage_id: string;
    start: string;
    end: string;
    ingredient_id: string;
    ingredient_ids: string[];
    sort_by: string;
    sort_order: string;
    limit: number;
    offset: number;
}

const initialFilters: IngredientReportsFilters = {
    storage_id: '',
    start: getTodayUtcBoundary(),
    end: getTomorrowUtcBoundary(true),
    ingredient_id: '',
    ingredient_ids: [],
    sort_by: '',
    sort_order: '',
    limit: 20,
    offset: 0,
};

export function IngredientReportsListView() {
    const { t } = useTranslation('menu');
    const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

    // Get filter options from metadata endpoint
    const { data: metadata } = useMetadata([MetadataEntity.INGREDIENTS, MetadataEntity.STORAGES]);

    // Get global rows per page
    const { rowsPerPage: globalRowsPerPage } = usePaginationRows();

    // Filter states
    const [filters, setFilters] = useState<IngredientReportsFilters>(initialFilters);
    const [draftFilters, setDraftFilters] = useState<IngredientReportsFilters>(initialFilters);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: globalRowsPerPage });

    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedStorageId, setSelectedStorageId] = useState<string>('');
    const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

    // Modal states
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    const [openAmountsModal, setOpenAmountsModal] = useState(false);
    const [selectedAmountsData, setSelectedAmountsData] = useState<any | null>(null);

    // Update filters when draft filters change
    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilters((prev) => ({
            ...prev,
            ...draftFilters,
            offset: 0,
            limit: paginationModel.pageSize,
        }));
    }, [draftFilters, paginationModel.pageSize]);

    // Pagination handlers
    const handlePaginationPageChange = (page: number) => {
        setPaginationModel((prev) => ({ ...prev, page }));
        setFilters((prev) => ({
            ...prev,
            offset: page * paginationModel.pageSize,
        }));
    };

    const handlePaginationRowsPerPageChange = (pageSize: number) => {
        setPaginationModel({ page: 0, pageSize });
        setFilters((prev) => ({
            ...prev,
            limit: pageSize,
            offset: 0,
        }));
    };

    // Set default date range and storage on component mount
    useEffect(() => {
        // Set default date range (yesterday to today)
        const today = dayjs();
        setStartDate(today.startOf('day'));
        setEndDate(today.endOf('day'));

        // Set default storage
        const storages = metadata.storages || [];
        if (storages.length > 0) {
            const firstStorageId = storages[0].id;
            setSelectedStorageId(firstStorageId);

            // Update filters with initial values
            setDraftFilters((prev) => ({
                ...prev,
                storage_id: firstStorageId,
                start: toUtcDayBoundary(today),
                end: toUtcDayBoundary(today, true),
            }));
        }
    }, [metadata.storages]);

    // Get reports with applied filters
    const { reports, reportsLoading, totals, reportsPagination } = useGetIngredientReports({
        storage_id: filters.storage_id,
        start: filters.start,
        end: filters.end,
        ingredient_ids: filters.ingredient_ids.length > 0 ? filters.ingredient_ids : undefined,
        ingredient_id: filters.ingredient_ids.length === 0 && filters.ingredient_id ? filters.ingredient_id : undefined,
        sort_by: filters.sort_by || undefined,
        sort_order: filters.sort_order || undefined,
        limit: filters.limit,
        offset: filters.offset,
    });

    // Update row count when pagination changes
    useEffect(() => {
        setRowCount(reportsPagination?.total ?? totals?.total_count ?? 0);
    }, [reportsPagination, totals]);

    // Get ingredient report detail for modal
    const { report: reportDetail, reportLoading } = useGetIngredientReportDetail(
        selectedIngredientId || '',
        selectedStorageId,
        startDate ? toUtcDayBoundary(startDate) : '',
        endDate ? toUtcDayBoundary(endDate, true) : ''
    );

    // Prepare filter options from metadata
    const filterOptions = useMemo(
        () => ({
            ingredient_id: (metadata.ingredients || []).map((ingredient: any) => ({
                value: ingredient.id,
                label: ingredient.name,
            })),
            storage_id: (metadata.storages || []).map((storage: any) => ({
                value: storage.id,
                label: storage.name,
            })),
        }),
        [metadata]
    );

    const isStoragesEmpty = filterOptions.storage_id.length === 0;

    const ingredientOptions = useMemo(
        () => (metadata.ingredients || []).map((ing: any) => ({ id: ing.id, label: ing.name })),
        [metadata]
    );

    const handleSearch = useCallback(({ optionIds = [] }: SearchOutput) => {
        setDraftFilters((prev) => ({
            ...prev,
            ingredient_ids: optionIds,
            ingredient_id: optionIds.length === 1 ? optionIds[0] : '',
        }));
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, []);

    const handleSortChange = useCallback((sort: { key: string | null; dir: string | null }) => {
        setDraftFilters((prev) => ({
            ...prev,
            sort_by: sort.key ?? '',
            sort_order: sort.dir ?? '',
        }));
    }, []);

    const handleOpenAmountsModal = useCallback((row: any) => {
        setSelectedAmountsData(row);
        setOpenAmountsModal(true);
    }, []);

    // View ingredient details
    const handleViewClick = useCallback((rowData: any) => {
        setSelectedIngredientId(rowData.ingredient_id);
        setOpenDetailsModal(true);
    }, []);

    // Modal close handlers
    const handleDetailsModalClose = useCallback(() => {
        setSelectedIngredientId(null);
        setOpenDetailsModal(false);
    }, []);

    const handleAmountsModalClose = useCallback(() => {
        setSelectedAmountsData(null);
        setOpenAmountsModal(false);
    }, []);

    // DataTable columns
    const columns = useMemo(
        () => [
            {
                key: 'ingredient_name',
                label: t('ingredientReports.ingredient') || 'Ingredient',
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: any) => row?.ingredient_name ?? '',
                renderCell: ({ value }: { value: unknown }) => (
                    <Box>
                        <Typography sx={{ mb: 1, mt: 1 }}>{String(value)}</Typography>
                    </Box>
                ),
            },
            {
                key: 'measurement',
                label: t('ingredientReports.unit') || 'Unit',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => {
                    const measurement = row?.measurement;
                    const unitMap: Record<string, string> = {
                        kg: 'kg',
                        l: 'l',
                        piece: 'dona',
                    };
                    return unitMap[measurement] || measurement;
                },
            },
            {
                key: 'begin_price',
                label: t('ingredientReports.startingPrice') || 'Starting Price',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.begin_price || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
            },
            {
                key: 'begin_quantity',
                label: t('ingredientReports.beginQty') || 'Begin Qty',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.begin_quantity || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'in',
                label: t('ingredientReports.in') || 'In',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.in || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'out',
                label: t('ingredientReports.out') || 'Out',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.out || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'surplus',
                label: t('ingredientReports.surplus', 'Surplus Qty'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.surplus || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'shortage',
                label: t('ingredientReports.shortage', 'Shortage Qty'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.shortage || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'end_quantity',
                label: t('ingredientReports.endQty') || 'End Qty',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.end_quantity || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'end_price',
                label: t('ingredientReports.endingPrice') || 'Ending Price',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => Number(row?.end_price || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAmountsModal(row);
                            }}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:chart-square-outline" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, handleViewClick, handleOpenAmountsModal]
    );

    // Filter handlers adapted for invoice pattern
    const handleStorageChange = useCallback(
        (storageId: string) => {
            setSelectedStorageId(storageId);
            setDraftFilters((prev) => ({ ...prev, storage_id: storageId }));
        },
        []
    );

    const handleResetFilters = useCallback(() => {
        setDraftFilters(initialFilters);
        setStartDate(dayjs().startOf('day'));
        setEndDate(dayjs().endOf('day'));
        setActiveRange('day');
        const storages = metadata.storages || [];
        if (storages.length > 0) {
            setSelectedStorageId(storages[0].id);
            setDraftFilters((prev) => ({
                ...initialFilters,
                storage_id: storages[0].id,
            }));
        }
    }, [metadata.storages]);

    // Apply date range changes
    useEffect(() => {
        setDraftFilters((prev) => ({
            ...prev,
            start: startDate ? toUtcDayBoundary(startDate) : '',
            end: endDate ? toUtcDayBoundary(endDate, true) : '',
            offset: 0,
        }));
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [startDate, endDate]);

    // Apply range changes
    const applyRange = useCallback((range: 'day' | 'week' | 'month' | 'year') => {
        const today = dayjs();
        let nextStart = today.startOf('day');
        let nextEnd = today.endOf('day');

        if (range === 'week') {
            nextStart = today.startOf('week');
            nextEnd = today.endOf('week');
        } else if (range === 'month') {
            nextStart = today.startOf('month');
            nextEnd = today.endOf('month');
        } else if (range === 'year') {
            nextStart = today.startOf('year');
            nextEnd = today.endOf('year');
        }

        setActiveRange(range);
        setStartDate(nextStart);
        setEndDate(nextEnd);
    }, []);

  

    // Render ingredient report detail modal content
    const renderReportDetailsContent = useCallback((data: any) => {
        if (reportLoading) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px',
                    }}
                >
                    <CircularProgress />
                </Box>
            );
        }

        if (!data) return null;

        const statsCards = [
            {
                label: t('ingredientReports.begin') || 'Begin',
                qty: Number(data.begin_quantity).toFixed(2),
            },
            {
                label: t('ingredientReports.end') || 'End',
                qty: Number(data.end_quantity).toFixed(2),
            },
            {
                label: t('ingredientReports.in') || 'In',
                qty: Number(data.in).toFixed(2),
            },
            {
                label: t('ingredientReports.out') || 'Out',
                qty: Number(data.out).toFixed(2),
            },
            {
                label: t('ingredientReports.surplus') || 'Surplus',
                qty: Number(data.surplus).toFixed(2),
            },
            {
                label: t('ingredientReports.shortage') || 'Shortage',
                qty: Number(data.shortage).toFixed(2),
            },
        ];

        return (
            <Box>
                {/* Header Info */}
                <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('ingredientReports.unit') || 'Unit'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {data.measurement === 'kg'
                                    ? 'kg'
                                    : data.measurement === 'l'
                                        ? 'l'
                                        : 'dona'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Stats Grid */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                    {t('ingredientReports.summary') || 'Summary'}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
                    {statsCards.map((card, index) => (
                        <Box
                            key={index}
                            sx={{
                                p: 1.5,
                                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                {card.label}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {card.qty}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }, [t, reportLoading]);

    const renderAmountsDetailsContent = useCallback((data: any) => {
        if (!data) return null;

        const amountRows = [
            {
                label: t('ingredientReports.beginQty') || 'Begin Qty',
                value: Number(data.begin_quantity).toFixed(2),
            },
            {
                label: t('ingredientReports.in') || 'In',
                value: Number(data.in).toFixed(2),
            },
            {
                label: t('ingredientReports.out') || 'Out',
                value: Number(data.out).toFixed(2),
            },
            {
                label: t('ingredientReports.surplus', 'Surplus Qty'),
                value: Number(data.surplus).toFixed(2),
            },
            {
                label: t('ingredientReports.shortage', 'Shortage Qty'),
                value: Number(data.shortage).toFixed(2),
            },
            {
                label: t('ingredientReports.endQty') || 'End Qty',
                value: Number(data.end_quantity).toFixed(2),
            },
        ];

        return (
            <Box>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('common.name') || 'Name'}</TableCell>
                            <TableCell align="right">{t('common.amount') || 'Amount'}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {amountRows.map((row) => (
                            <TableRow key={row.label}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {row.value}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        );
    }, [t]);

    const handleAmountRowClick = useCallback(
        (id: string) => {
            const selectedRow = reports.find((row: any) => row.ingredient_id === id);
            if (selectedRow) {
                handleOpenAmountsModal(selectedRow);
            }
        },
        [reports, handleOpenAmountsModal]
    );

    return (
        <>
            <DashboardContent
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100vh',
                    '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
                    '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
                }}
            >

                <DataTable<any>
                    persistKey="reports-ingredient-reports"
                    data={reports || []}
                    getRowId={(row: any) => String(row?.ingredient_id)}
                    columns={columns}
                    searchMode="advanced"
                    allowFreeText={false}
                    searchOptions={ingredientOptions}
                    onSearch={handleSearch}
                    onSortChange={handleSortChange}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={rowCount}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={handlePaginationPageChange}
                    onRowsPerPageChange={handlePaginationRowsPerPageChange}
                    showPeriodPicker
                    periodPickerProps={{
                        startDate: startDate ? startDate.toDate() : null,
                        endDate: endDate ? endDate.toDate() : null,
                        onStartDateChange: (date: Date | null) => {
                            setStartDate(date ? dayjs(date) : null);
                            setActiveRange('day');
                        },
                        onEndDateChange: (date: Date | null) => {
                            setEndDate(date ? dayjs(date) : null);
                            setActiveRange('day');
                        }
                    }}
                    showPeriodButtons
                    periodButtonProps={{
                        activePeriod: activeRange,
                        onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
                            applyRange(period);
                        }
                    }}
                    toolbarActions={
                      <StorageFilter
                        storageId={selectedStorageId}
                        storages={(metadata.storages || []).map((s: any) => ({ id: s.id, name: s.name }))}
                        onStorageChange={handleStorageChange}
                        label={t('ingredientReports.storage') || 'Storage'}
                        disabled={isStoragesEmpty}
                      />
                    }
                    defaultConfig={{
                        order: ['ingredient_name', 'measurement', 'begin_price', 'begin_quantity', 'in', 'out', 'surplus', 'shortage', 'end_quantity', 'end_price', 'actions'],
                        visibility: {
                            ingredient_name: true,
                            measurement: true,
                            begin_price: true,
                            begin_quantity: true,
                            in: true,
                            out: true,
                            surplus: true,
                            shortage: true,
                            end_quantity: true,
                            end_price: true,
                            actions: true,
                        },
                        widths: {
                            ingredient_name: '1.5fr',
                            measurement: '0.8fr',
                            begin_price: '1fr',
                            begin_quantity: '1fr',
                            in: '0.8fr',
                            out: '0.8fr',
                            surplus: '1fr',
                            shortage: '1fr',
                            end_quantity: '1fr',
                            end_price: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={handleResetFilters}
                    onRowClick={handleViewClick}
                />
            </DashboardContent>

            {/* Ingredient Report Detail Modal */}
            <GenericViewModal
                isOpen={openDetailsModal}
                onClose={handleDetailsModalClose}
                title={reportDetail ? reportDetail.ingredient_name : t('ingredientReports.title') || 'Ingredient Report'}
                data={reportDetail}
                loading={reportLoading}
                renderContent={renderReportDetailsContent}
                maxWidth="lg"
                position="right"
                slideDirection="left"
            />

            {/* Amounts Modal */}
            <GenericViewModal
                isOpen={openAmountsModal}
                onClose={handleAmountsModalClose}
                title={selectedAmountsData ? `${t('ingredientReports.amountDetails', 'Amount Details')} - ${selectedAmountsData.ingredient_name}` : t('ingredientReports.amountDetails', 'Amount Details')}
                data={selectedAmountsData}
                renderContent={renderAmountsDetailsContent}
                maxWidth="md"
                position="right"
                slideDirection="left"
            />
        </>
    );
}
