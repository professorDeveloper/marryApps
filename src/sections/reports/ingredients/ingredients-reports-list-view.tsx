import type { SearchOutput } from 'src/sections/common/data-table/types/types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Table,
    Select,
    MenuItem,
    TableRow,
    useTheme,
    TableBody,
    TableCell,
    TableHead,
    InputLabel,
    Typography,
    FormControl,
    CircularProgress,
} from '@mui/material';

import { useMetadata } from 'src/hooks/use-metadata';
import { useTimeFilter } from 'src/hooks/use-time-filter';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetIngredientReports, useGetIngredientMovements } from 'src/actions/ingredient-reports';

import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';

import { DataTable } from 'src/sections/common/data-table';
import { StorageFilter } from 'src/sections/common/data-table/components/StorageFilter';

import { MetadataEntity } from 'src/types/metadata';
import { MOVEMENT_FILTER_GROUPS } from 'src/types/ingredient-reports';

import { numberCell } from './utils/numberCell';

const fmtNum = (value: unknown): string => {
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper functions
const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
    const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
    return boundary.toISOString().replace('.000Z', 'Z');
};

const getTodayUtcBoundary = (): string => {
    const today = dayjs();
    return toUtcDayBoundary(today);
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
    const tomorrow = dayjs().add(1, 'day');
    return toUtcDayBoundary(tomorrow, endOfDay);
};

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value) : null);

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
    end: getTodayUtcBoundary(),
    ingredient_id: '',
    ingredient_ids: [],
    sort_by: '',
    sort_order: '',
    limit: 20,
    offset: 0,
};

export function IngredientReportsListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const noDataText = t('noDataAvailable');

    // Get filter options from metadata endpoint
    const { data: metadata } = useMetadata([MetadataEntity.INGREDIENTS, MetadataEntity.STORAGES]);

    // Exclude deleted storages from filter options (their data may still appear in report rows)
    const activeStorages = useMemo(
        () => (metadata.storages || []).filter((storage: any) => !storage.is_deleted),
        [metadata.storages]
    );

    // Get global rows per page
    const { rowsPerPage: globalRowsPerPage } = usePaginationRows();

    // Filter states
    const [filters, setFilters] = useState<IngredientReportsFilters>(initialFilters);
    const [draftFilters, setDraftFilters] = useState<IngredientReportsFilters>(initialFilters);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: globalRowsPerPage });

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, pageSize: globalRowsPerPage }));
    }, [globalRowsPerPage]);

    const { startDate, endDate, activePeriod: activeRange, setDates, applyRange, reset: resetTimeFilter } = useTimeFilter();
    const [selectedStorageId, setSelectedStorageId] = useState<string>('');

    // Modal states
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    // Movements modal state — filter is a group label ('' = all)
    const [movementsGroupFilter, setMovementsGroupFilter] = useState('');

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

    // Set default storage on component mount
    useEffect(() => {
        const storages = activeStorages;
        if (storages.length > 0) {
            const firstStorageId = storages[0].id;
            setSelectedStorageId(firstStorageId);

            // Update filters with initial values
            setDraftFilters((prev) => ({
                ...prev,
                storage_id: firstStorageId,
                start: toUtcDayBoundary(dayjs()),
                end: toUtcDayBoundary(dayjs(), true),
            }));
        }
    }, [activeStorages]);

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

    // Resolve selected group to its event type values
    const movementsEventTypes = useMemo(() => {
        if (!movementsGroupFilter) return [];
        const group = MOVEMENT_FILTER_GROUPS.find((g) => g.label === movementsGroupFilter);
        return group ? group.values : [];
    }, [movementsGroupFilter]);

    // Get ingredient movements for detail modal
    const { movements, movementsTotals, movementsLoading } = useGetIngredientMovements(
        selectedIngredientId,
        {
            storage_id: selectedStorageId,
            start: startDate ? toUtcDayBoundary(startDate) : undefined,
            end: endDate ? toUtcDayBoundary(endDate, true) : undefined,
            event_types: movementsEventTypes,
        }
    );

    // Prepare filter options from metadata
    const filterOptions = useMemo(
        () => ({
            ingredient_id: (metadata.ingredients || []).map((ingredient: any) => ({
                value: ingredient.id,
                label: ingredient.name,
            })),
            storage_id: activeStorages.map((storage: any) => ({
                value: storage.id,
                label: storage.name,
            })),
        }),
        [metadata, activeStorages]
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

    // View ingredient details
    const [selectedIngredientName, setSelectedIngredientName] = useState<string>('');
    const handleViewClick = useCallback((rowData: any) => {
        setSelectedIngredientId(rowData.ingredient_id);
        setSelectedIngredientName(rowData.ingredient_name || '');
        setOpenDetailsModal(true);
    }, []);

    // Modal close handlers
    const handleDetailsModalClose = useCallback(() => {
        setSelectedIngredientId(null);
        setSelectedIngredientName('');
        setOpenDetailsModal(false);
        setMovementsGroupFilter('');
    }, []);


    // DataTable columns
    const columns = useMemo(
        () => [
            {
                key: 'ingredient_name',
                label: t('ingredientReports.ingredient') || 'Ingredient',
                sortable: false,
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
                sortable: false,
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
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.costStart')}</span>
                ),
                sortable: false,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.begin_price || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
            },
            {
                key: 'begin_quantity',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.beginQty') || 'Begin Qty'}</span>
                ),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.begin_quantity || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'in',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.in') || 'In'}</span>
                ),
                sortable: true,
                width: '0.8fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.in || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'out',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.out') || 'Out'}</span>
                ),
                sortable: true,
                width: '0.8fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.out || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'surplus',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.surplus')}</span>
                ),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.surplus || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'shortage',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.shortage')}</span>
                ),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.shortage || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'end_quantity',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.endQty') || 'End Qty'}</span>
                ),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.end_quantity || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'end_price',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.costEnd')}</span>
                ),
                sortable: false,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.end_price || 0),
                renderCell: ({ value }: { value: unknown }) => numberCell(value as number),
            },
            {
                key: 'end_value',
                label: (
                    <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>{t('ingredientReports.endValue')}</span>
                ),
                sortable: false,
                width: '1fr',
                align: 'right' as const,
                getValue: (row: any) => Number(row?.end_quantity || 0) * Number(row?.end_price || 0),
                renderCell: (row: any) => numberCell(Number(row?.end_quantity || 0) * Number(row?.end_price || 0)),
                total: { aggregation: 'sum' as const },
            },
        ],
        [t, handleViewClick]
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
        resetTimeFilter();
        const storages = activeStorages;
        if (storages.length > 0) {
            setSelectedStorageId(storages[0].id);
            setDraftFilters((prev) => ({
                ...initialFilters,
                storage_id: storages[0].id,
            }));
        }
    }, [activeStorages, resetTimeFilter]);

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




    // Render ingredient movements in detail modal
    const renderReportDetailsContent = useCallback((_data: any) => {
        if (movementsLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <CircularProgress />
                </Box>
            );
        }

        const renderAdditionalData = (mov: any) => {
            const ad = mov.additional_data;
            if (!ad) return null;

            const et: string = mov.event_type;
            const lines: string[] = [];

            if (et === 'order_out') {
                const d = ad as { bill_no?: number; goods?: { name: string }[] };
                if (d.bill_no != null) lines.push(`#${d.bill_no}`);
                if (d.goods?.length) lines.push(d.goods.map((g: any) => g.name).join(', '));
            } else if (et === 'invoice') {
                const d = ad as { total_amount?: string; status?: string; date?: string };
                if (d.status) lines.push(d.status);
                if (d.total_amount) lines.push(d.total_amount);
                if (d.date) lines.push(d.date.slice(0, 10));
            } else {
                const d = ad as { number?: number; description?: string; status?: string; total_amount?: string };
                if (d.number != null) lines.push(`#${d.number}`);
                if (d.description) lines.push(d.description);
                if (d.status) lines.push(d.status);
                if (d.total_amount) lines.push(d.total_amount);
            }

            if (!lines.length) return null;
            return (
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.25 }}>
                    {lines.join(' · ')}
                </Typography>
            );
        };

        return (
            <Box>
                {/* Group filter */}
                <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                    <InputLabel>{t('ingredientReports.eventType') || 'Event Type'}</InputLabel>
                    <Select
                        label={t('ingredientReports.eventType') || 'Event Type'}
                        value={movementsGroupFilter}
                        onChange={(e) => {
                            setMovementsGroupFilter(e.target.value);
                        }}
                    >
                        <MenuItem value="">{t('ingredientReports.allEventTypes') || 'All'}</MenuItem>
                        {MOVEMENT_FILTER_GROUPS.map((group) => (
                            <MenuItem key={group.label} value={group.label}>
                                {t(`ingredientReports.filterGroups.${group.label}`, { defaultValue: group.label })}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Movements table */}
                <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('ingredientReports.date') || 'Date'}</TableCell>
                            <TableCell>{t('ingredientReports.eventType') || 'Event Type'}</TableCell>
                            <TableCell align="right">{t('ingredientReports.stockBefore') || 'Before'}</TableCell>
                            <TableCell align="right">{t('ingredientReports.change') || 'Change'}</TableCell>
                            <TableCell align="right">{t('ingredientReports.stockAfter') || 'After'}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {movements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: theme.palette.text.secondary, py: 4 }}>
                                    {noDataText}
                                </TableCell>
                            </TableRow>
                        ) : (
                            movements.map((mov, idx) => {
                                const dateStr = mov.effective_at || mov.created_at;
                                const qtyIn = Number(mov.qty_in ?? 0);
                                const qtyOut = Number(mov.qty_out ?? 0);
                                const stockBefore = Number(mov.stock_before ?? 0);
                                const stockAfter = Number(mov.stock_after ?? 0);
                                const hasIn = qtyIn > 0;
                                const hasOut = qtyOut > 0;
                                return (
                                    <TableRow key={mov.id ?? idx}>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {dateStr ? dateStr.slice(0, 10) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {t(`ingredientReports.eventTypes.${mov.event_type}`, { defaultValue: mov.event_type })}
                                            </Typography>
                                            {renderAdditionalData(mov)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: theme.palette.text.secondary }}>
                                            {stockBefore.toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {hasIn && (
                                                <Typography variant="body2" component="span" sx={{ color: theme.palette.success.main, display: 'block' }}>
                                                    +{qtyIn.toFixed(2)}
                                                </Typography>
                                            )}
                                            {hasOut && (
                                                <Typography variant="body2" component="span" sx={{ color: theme.palette.error.main, display: 'block' }}>
                                                    -{qtyOut.toFixed(2)}
                                                </Typography>
                                            )}
                                            {!hasIn && !hasOut && (
                                                <Typography variant="body2" component="span" sx={{ color: theme.palette.text.secondary }}>
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            {stockAfter.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                </Box>

                {/* Totals */}
                {movementsTotals && (
                    <Box
                        sx={{
                            mt: 2,
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(8, 1fr)' },
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            overflow: 'hidden',
                        }}
                    >
                        {[
                            { label: t('ingredientReports.beginQty') || 'Begin', value: movementsTotals.begin_qty },
                            { label: t('ingredientReports.in') || 'In', value: movementsTotals.total_qty_in, color: theme.palette.success.main, bg: `${theme.palette.success.main}14` },
                            { label: t('ingredientReports.out') || 'Out', value: movementsTotals.total_qty_out, color: theme.palette.error.main, bg: `${theme.palette.error.main}14` },
                            { label: t('ingredientReports.surplus') || 'Surplus', value: movementsTotals.surplus_qty },
                            { label: t('ingredientReports.shortage') || 'Shortage', value: movementsTotals.shortage_qty },
                            { label: t('ingredientReports.endQty') || 'End', value: movementsTotals.end_qty },
                            { label: t('ingredientReports.beginCost') || 'Begin Price', value: movementsTotals.begin_price },
                            { label: t('ingredientReports.endCost') || 'End Price', value: movementsTotals.end_price },
                        ].map(({ label, value, color, bg }, i, arr) => (
                            <Box
                                key={label}
                                sx={{
                                    px: 1.5,
                                    py: 1.25,
                                    backgroundColor: bg ?? theme.palette.action.hover,
                                    borderRight: i < arr.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.25, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                                    {label}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: color ?? theme.palette.text.primary, lineHeight: 1 }}>
                                    {Number(value).toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    }, [t, theme, movementsLoading, movements, movementsTotals, movementsGroupFilter, noDataText]);

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
                    search={{ mode: 'advanced', allowFreeText: false, options: ingredientOptions, onSearch: handleSearch }}
                    onSortChange={handleSortChange}
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount: rowCount,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: handlePaginationPageChange,
                        onRowsPerPageChange: handlePaginationRowsPerPageChange,
                    }}
                    periodFilter={{
                        startDate: startDate ? startDate.toDate() : null,
                        endDate: endDate ? endDate.toDate() : null,
                        onStartDateChange: (date: Date | null) => { setDates(date ? dayjs(date) : null, endDate, 'day'); },
                        onEndDateChange: (date: Date | null) => { setDates(startDate, date ? dayjs(date) : null, 'day'); },
                        activePeriod: activeRange,
                        onPeriodChange: applyRange,
                    }}
                    filterRow={
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                                gap: 1,
                                width: '100%',
                            }}
                        >
                            <StorageFilter
                                storageId={selectedStorageId}
                                storages={activeStorages.map((s: any) => ({ id: s.id, name: s.name }))}
                                onStorageChange={handleStorageChange}
                                label={t('ingredientReports.storage') || 'Storage'}
                                disabled={isStoragesEmpty}
                            />
                        </Box>
                    }
                    defaultConfig={{
                        order: ['ingredient_name', 'measurement', 'begin_price', 'begin_quantity', 'in', 'out', 'surplus', 'shortage', 'end_quantity', 'end_price', 'end_value'],
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
                            end_value: true,
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
                            end_value: '1fr',
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
                title={selectedIngredientName || t('ingredientReports.movements') || 'Movements'}
                data={movements}
                loading={movementsLoading}
                renderContent={renderReportDetailsContent}
                maxWidth="lg"
                position="right"
                slideDirection="left"
            />
        </>
    );
}
