import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import { useGetStorages } from 'src/actions/departments';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetIngredients } from 'src/actions/ingredients';
import { useGetIngredientReports, useGetIngredientReportDetail } from 'src/actions/ingredient-reports';

import { Iconify } from 'src/components/iconify';
import { NoDataTooltip } from 'src/components/no-data-tooltip';
import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table';

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
    status: string; // Adding status field for compatibility
    q: string; // Adding search field for compatibility
    limit: number;
    offset: number;
}

const initialFilters: IngredientReportsFilters = {
    storage_id: '',
    start: getTodayUtcBoundary(),
    end: getTomorrowUtcBoundary(true),
    ingredient_id: '',
    status: '',
    q: '',
    limit: 20,
    offset: 0,
};

export function IngredientReportsListView() {
    const { t } = useTranslation('menu');
    const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

    // Get filter options from APIs
    const { ingredients } = useGetIngredients();
    const { storages } = useGetStorages();

    // Filter states
    const [filters, setFilters] = useState<IngredientReportsFilters>(initialFilters);
    const [draftFilters, setDraftFilters] = useState<IngredientReportsFilters>(initialFilters);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedStorageId, setSelectedStorageId] = useState<string>('');
    const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

    // Modal states
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);
    const [openAmountsModal, setOpenAmountsModal] = useState(false);
    const [selectedAmountsData, setSelectedAmountsData] = useState<any | null>(null);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Update draft filters with search
    useEffect(() => {
        setDraftFilters((prev) => ({
            ...prev,
            q: debouncedSearchQuery,
        }));
    }, [debouncedSearchQuery]);

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
        if (storages && storages.length > 0) {
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
    }, [storages]);

    // Get reports with applied filters
    const { reports, reportsLoading, totals, reportsPagination } = useGetIngredientReports({
        storage_id: filters.storage_id,
        start: filters.start,
        end: filters.end,
        ingredient_id: filters.ingredient_id || undefined,
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

    // Prepare filter options
    const filterOptions = useMemo(
        () => ({
            ingredient_id: ingredients.map((ingredient) => ({
                value: ingredient.id,
                label: ingredient.name,
            })),
            storage_id: storages.map((storage: any) => ({
                value: storage.id,
                label: storage.name,
            })),
        }),
        [ingredients, storages]
    );

    const isStoragesEmpty = filterOptions.storage_id.length === 0;
    const isIngredientsEmpty = filterOptions.ingredient_id.length === 0;

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
                key: 'cost_start',
                label: t('ingredientReports.costStart', 'Cost Start'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.cost_start || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return `${amount.toLocaleString()} so'm`;
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'begin_qty',
                label: t('ingredientReports.beginQty') || 'Begin Qty',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.begin_qty || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'invoice_in_qty',
                label: t('ingredientReports.in') || 'In',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.invoice_in_qty || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'order_out_qty',
                label: t('ingredientReports.out') || 'Out',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.order_out_qty || 0),
                renderCell: ({ row }: { row: any }) => (
                    <Tooltip
                        title={`${t('ingredientReports.deduction', 'Deduction')}: ${Number(row.deduction_out_qty).toFixed(2)}`}
                        arrow
                        disableInteractive
                        slotProps={{
                            popper: {
                                sx: { pointerEvents: 'none' },
                            },
                        }}
                    >
                        <Box component="span">{`${Number(row.order_out_qty).toFixed(2)}`}</Box>
                    </Tooltip>
                ),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'surplus_qty',
                label: t('ingredientReports.surplus', 'Surplus Qty'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.surplus_qty || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'shortage_qty',
                label: t('ingredientReports.shortage', 'Shortage Qty'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.shortage_qty || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'end_qty',
                label: t('ingredientReports.endQty') || 'End Qty',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.end_qty || 0),
                renderCell: ({ value }: { value: unknown }) => `${Number(value).toFixed(2)}`,
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'cost_end',
                label: t('ingredientReports.costEnd', 'Cost End'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.cost_end || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return `${amount.toLocaleString()} so'm`;
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'end_amount',
                label: t('ingredientReports.endCost') || 'End Cost',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.end_amount || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return `${amount.toLocaleString()} so'm`;
                },
                total: { aggregation: 'sum' as const },
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

    const handleIngredientChange = useCallback(
        (ingredientId: string) => {
            setDraftFilters((prev) => ({ ...prev, ingredient_id: ingredientId }));
        },
        []
    );

    const handleResetFilters = useCallback(() => {
        setDraftFilters(initialFilters);
        setStartDate(dayjs().startOf('day'));
        setEndDate(dayjs().endOf('day'));
        setActiveRange('day');
        if (storages && storages.length > 0) {
            setSelectedStorageId(storages[0].id);
            setDraftFilters((prev) => ({
                ...initialFilters,
                storage_id: storages[0].id,
            }));
        }
    }, [storages]);

    // Date picker values
    const startDateValue = useMemo(() => toPickerDate(draftFilters.start), [draftFilters.start]);
    const endDateValue = useMemo(() => toPickerDate(draftFilters.end), [draftFilters.end]);

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

    const renderFiltersContent = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                    exclusive
                    value={activeRange}
                    onChange={(_, value) => {
                        if (!value) return;
                        applyRange(value);
                    }}
                    size="small"
                    sx={{
                        '& .MuiToggleButton-root': {
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            px: 2.5,
                            border: 'none',
                            borderRadius: 0,
                            borderBottom: '2px solid transparent',
                        },
                        '& .MuiToggleButton-root.Mui-selected': {
                            borderBottomColor: 'primary.main',
                            backgroundColor: 'transparent',
                        },
                        '& .MuiToggleButton-root:hover': {
                            backgroundColor: 'transparent',
                        },
                    }}
                >
                    <ToggleButton value="day">D</ToggleButton>
                    <ToggleButton value="week">W</ToggleButton>
                    <ToggleButton value="month">M</ToggleButton>
                    <ToggleButton value="year">Y</ToggleButton>
                </ToggleButtonGroup>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
                        gap: 1.5,
                        flex: 1,
                    }}
                >
            {/* Start Date - Required */}
            <DatePicker
                label={t('ingredientReports.startDate') || 'Start Date'}
                value={startDate}
                onChange={(value) => {
                    setStartDate(value);
                    setActiveRange('day');
                }}
                format="DD.MM.YYYY"
                slotProps={{
                    textField: {
                        fullWidth: true,
                        size: 'small',
                        inputProps: { readOnly: true },
                        sx: { cursor: 'pointer' },
                    },
                }}
            />


            {/* End Date - Required */}
            <DatePicker
                label={t('ingredientReports.endDate') || 'End Date'}
                value={endDate}
                onChange={(value) => {
                    setEndDate(value);
                    setActiveRange('day');
                }}
                format="DD.MM.YYYY"
                slotProps={{
                    textField: {
                        fullWidth: true,
                        size: 'small',
                        inputProps: { readOnly: true },
                        sx: { cursor: 'pointer' },
                    },
                }}
            />

            {/* Storage - Required */}
            <NoDataTooltip enabled={isStoragesEmpty} title={noDataText}>
                <TextField
                    select
                    label={t('ingredientReports.storage') || 'Storage'}
                    value={selectedStorageId}
                    onChange={(e) => handleStorageChange(e.target.value)}
                    SelectProps={{ native: true }}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                                borderColor: '#1890FF',
                            },
                        },
                    }}
                    disabled={isStoragesEmpty}
                >
                    <option value="" disabled hidden>
                        {t('common.select') || 'Select Storage'}
                    </option>
                    {filterOptions.storage_id.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </TextField>
            </NoDataTooltip>

            {/* Ingredient - Optional */}
            <NoDataTooltip enabled={isIngredientsEmpty} title={noDataText}>
                <TextField
                    select
                    label={t('ingredientReports.ingredient') || 'Ingredient'}
                    value={draftFilters.ingredient_id}
                    onChange={(e) => handleIngredientChange(e.target.value)}
                    SelectProps={{ native: true }}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={isIngredientsEmpty}
                >
                    <option value="">
                        {t('ingredientReports.all') || 'All'}
                    </option>
                    {filterOptions.ingredient_id.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </TextField>
            </NoDataTooltip>
                </Box>
            </Box>

            {/* Action Buttons */}
            {/* <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="solar:restart-bold" />}
                    onClick={handleResetFilters}
                    sx={{ minWidth: 'auto', flex: 1 }}
                >
                    {t('ingredientReports.reset') || 'Reset'}
                </Button>
            </Box> */}
        </Box>
    );

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
                qty: Number(data.begin_qty).toFixed(2),
                amount: Number(data.begin_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.end') || 'End',
                qty: Number(data.end_qty).toFixed(2),
                amount: Number(data.end_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.in') || 'In',
                qty: Number(data.invoice_in_qty).toFixed(2),
                amount: Number(data.invoice_in_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.out') || 'Out',
                qty: Number(data.order_out_qty).toFixed(2),
                amount: Number(data.order_out_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.deduction') || 'Deduction',
                qty: Number(data.deduction_out_qty).toFixed(2),
                amount: Number(data.deduction_out_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.surplus') || 'Surplus',
                qty: Number(data.surplus_qty).toFixed(2),
                amount: Number(data.surplus_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.shortage') || 'Shortage',
                qty: Number(data.shortage_qty).toFixed(2),
                amount: Number(data.shortage_amount).toLocaleString(),
            },
        ];

        return (
            <Box>
                {/* Header Info */}
                <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {/* <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('ingredientReports.ingredient') || 'Ingredient'}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        {data.ingredient_name}
                    </Typography> */}

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
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('ingredientReports.costPerUnit') || 'Cost/Unit'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {Number(data.cost_start).toLocaleString()} so'm
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
                                    {/* <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {data.measurement === 'kg' ? 'kg' : data.measurement === 'l' ? 'l' : 'dona'}
                                    </Typography> */}
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1890FF' }}>
                                    {card.amount} so'm
                                </Typography>
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
                label: t('ingredientReports.beginCost') || 'Begin Cost',
                value: Number(data.begin_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.inAmount', 'In Amount'),
                value: Number(data.invoice_in_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.outAmount', 'Out Amount'),
                value: Number(data.order_out_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.deductionAmount', 'Deduction Amount'),
                value: Number(data.deduction_out_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.surplusAmount', 'Surplus Amount'),
                value: Number(data.surplus_amount).toLocaleString(),
            },
            {
                label: t('ingredientReports.shortageAmount', 'Shortage Amount'),
                value: Number(data.shortage_amount).toLocaleString(),
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
                                    {row.value} so'm
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
                    searchValue={searchQuery}
                    onSearchChange={(value: string) => {
                        setSearchQuery(value);
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
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
                    showStorageSelector
                    storageSelectorProps={{
                        storageId: selectedStorageId,
                        storages: storages.map((s: any) => ({ id: s.id, name: s.name })),
                        onStorageChange: handleStorageChange,
                        label: t('ingredientReports.storage') || 'Storage',
                        disabled: isStoragesEmpty,
                    }}
                    defaultConfig={{
                        order: ['ingredient_name', 'measurement', 'cost_start', 'begin_qty', 'invoice_in_qty', 'order_out_qty', 'surplus_qty', 'shortage_qty', 'end_qty', 'cost_end', 'end_amount', 'actions'],
                        visibility: {
                            ingredient_name: true,
                            measurement: true,
                            cost_start: true,
                            begin_qty: true,
                            invoice_in_qty: true,
                            order_out_qty: true,
                            surplus_qty: true,
                            shortage_qty: true,
                            end_qty: true,
                            cost_end: true,
                            end_amount: true,
                            actions: true,
                        },
                        widths: {
                            ingredient_name: '1.5fr',
                            measurement: '0.8fr',
                            cost_start: '1fr',
                            begin_qty: '1fr',
                            invoice_in_qty: '0.8fr',
                            order_out_qty: '0.8fr',
                            surplus_qty: '1fr',
                            shortage_qty: '1fr',
                            end_qty: '1fr',
                            cost_end: '1fr',
                            end_amount: '1fr',
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
