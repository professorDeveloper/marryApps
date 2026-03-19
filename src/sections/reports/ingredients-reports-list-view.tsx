import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { paths } from 'src/routes/paths';
import { useGetIngredientReports, useGetIngredientReportDetail } from 'src/actions/ingredient-reports';
import { useGetIngredients } from 'src/actions/ingredients';
import { useGetStorages } from 'src/actions/departments';
import { GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';
import { NoDataTooltip } from 'src/components/no-data-tooltip';

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

export function IngredientReportsListView() {
    const { t } = useTranslation('menu');
    const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

    // Get filter options from APIs
    const { ingredients } = useGetIngredients();
    const { storages } = useGetStorages();

    // Filter states
    const [filters, setFilters] = useState({
        storage_id: '',
        start: '',
        end: '',
        ingredient_id: '',
        limit: 20,
        offset: 0,
    });
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
            setFilters((prev) => ({
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

    const columns = useMemo<GridColDef[]>(
        () => [
            // {
            //     field: 'ingredient_id',
            //     headerName: 'ID',
            //     minWidth: 260,
            //     renderCell: (params) => params.row.ingredient_id || '-',
            // },
            {
                field: 'ingredient_name',
                headerName: t('ingredientReports.ingredient') || 'Ingredient',
                flex: 1,
                minWidth: 200,
                renderCell: (params) => (
                    <Box>
                        <Typography sx={{ mb: 1, mt: 1 }}>{params.row.ingredient_name}</Typography>
                    </Box>
                )
                // renderCell: (params) => (
                //     <RenderCellItem params={params} nameField="ingredient_name" />
                // ),
            },
            // {
            //     field: 'color_code',
            //     headerName: t('ingredientReports.color', 'Color'),
            //     width: 120,
            //     renderCell: (params) => (
            //         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            //             <Box
            //                 sx={{
            //                     width: 16,
            //                     height: 16,
            //                     borderRadius: '4px',
            //                     border: '1px solid #ccc',
            //                     bgcolor: params.row.color_code || 'transparent',
            //                 }}
            //             />
            //             <Typography variant="body2">{params.row.color_code || '-'}</Typography>
            //         </Box>
            //     ),
            // },
            {
                field: 'measurement',
                headerName: t('ingredientReports.unit') || 'Unit',
                width: 100,
                renderCell: (params) => {
                    const measurement = params.row.measurement;
                    const unitMap: Record<string, string> = {
                        kg: 'kg',
                        l: 'l',
                        piece: 'dona',
                    };
                    return unitMap[measurement] || measurement;
                },
            },
            {
                field: 'cost_start',
                headerName: t('ingredientReports.costStart', 'Cost Start'),
                width: 130,
                renderCell: (params) => {
                    const amount = Number(params.row.cost_start) || 0;
                    return `${amount.toLocaleString()} so'm`;
                },
            },
            {
                field: 'begin_qty',
                headerName: t('ingredientReports.beginQty') || 'Begin Qty',
                width: 120,
                renderCell: (params) => `${Number(params.row.begin_qty).toFixed(2)}`,
            },
            {
                field: 'invoice_in_qty',
                headerName: t('ingredientReports.in') || 'In',
                width: 100,
                renderCell: (params) => `${Number(params.row.invoice_in_qty).toFixed(2)}`,
            },
            {
                field: 'order_out_qty',
                headerName: t('ingredientReports.out') || 'Out',
                width: 100,
                renderCell: (params) => (
                    <Tooltip
                        title={`${t('ingredientReports.deduction', 'Deduction')}: ${Number(params.row.deduction_out_qty).toFixed(2)}`}
                        arrow
                        disableInteractive
                        slotProps={{
                            popper: {
                                sx: { pointerEvents: 'none' },
                            },
                        }}
                    >
                        <Box component="span">{`${Number(params.row.order_out_qty).toFixed(2)}`}</Box>
                    </Tooltip>
                ),
            },
            {
                field: 'surplus_qty',
                headerName: t('ingredientReports.surplus', 'Surplus Qty'),
                width: 130,
                renderCell: (params) => `${Number(params.row.surplus_qty).toFixed(2)}`,
            },
            {
                field: 'shortage_qty',
                headerName: t('ingredientReports.shortage', 'Shortage Qty'),
                width: 140,
                renderCell: (params) => `${Number(params.row.shortage_qty).toFixed(2)}`,
            },
            {
                field: 'end_qty',
                headerName: t('ingredientReports.endQty') || 'End Qty',
                width: 120,
                renderCell: (params) => `${Number(params.row.end_qty).toFixed(2)}`,
            },
            // rasxod hoverda chiqshi kerak
            // {
            //     field: 'deduction_out_qty',
            //     headerName: t('ingredientReports.deduction', 'Deduction Qty'),
            //     width: 140,
            //     renderCell: (params) => `${Number(params.row.deduction_out_qty).toFixed(2)}`,
            // },
            {
                field: 'cost_end',
                headerName: t('ingredientReports.costEnd', 'Cost End'),
                width: 130,
                renderCell: (params) => {
                    const amount = Number(params.row.cost_end) || 0;
                    return `${amount.toLocaleString()} so'm`;
                },
            },
            {
                field: 'end_amount',
                headerName: t('ingredientReports.endCost') || 'End Cost',
                width: 120,
                renderCell: (params) => {
                    const amount = Number(params.row.end_amount) || 0;
                    return `${amount.toLocaleString()} so'm`;
                },
            },
            // detailda chiqshi kerak
            // {
            //     field: 'begin_amount',
            //     headerName: t('ingredientReports.beginCost') || 'Begin Cost',
            //     width: 120,
            //     renderCell: (params) => {
            //         const amount = Number(params.row.begin_amount) || 0;
            //         return `${amount.toLocaleString()} so'm`;
            //     },
            // },
            // {
            //     field: 'invoice_in_amount',
            //     headerName: t('ingredientReports.inAmount', 'In Amount'),
            //     width: 140,
            //     renderCell: (params) => {
            //         const amount = Number(params.row.invoice_in_amount) || 0;
            //         return `${amount.toLocaleString()} so'm`;
            //     },
            // },
            // {
            //     field: 'order_out_amount',
            //     headerName: t('ingredientReports.outAmount', 'Out Amount'),
            //     width: 140,
            //     renderCell: (params) => {
            //         const amount = Number(params.row.order_out_amount) || 0;
            //         return `${amount.toLocaleString()} so'm`;
            //     },
            // },
            // {
            //     field: 'deduction_out_amount',
            //     headerName: t('ingredientReports.deductionAmount', 'Deduction Amount'),
            //     width: 170,
            //     renderCell: (params) => {
            //         const amount = Number(params.row.deduction_out_amount) || 0;
            //         return `${amount.toLocaleString()} so'm`;
            //     },
            // },
            // {
            //     field: 'surplus_amount',
            //     headerName: t('ingredientReports.surplusAmount', 'Surplus Amount'),
            //     width: 160,
            //     renderCell: (params) => {
            //         const amount = Number(params.row.surplus_amount) || 0;
            //         return `${amount.toLocaleString()} so'm`;
            //     },
            // },
            // {
            //     field: 'shortage_amount',
            //     headerName: t('ingredientReports.shortageAmount', 'Shortage Amount'),
            //     width: 170,
            //     renderCell: (params) => {
            //         const amount = Number(params.row.shortage_amount) || 0;
            //         return `${amount.toLocaleString()} so'm`;
            //     },
            // },
        ],
        [t]
    );

    const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
            offset: 0,
        }));
        setPaginationModel((prev) => ({
            ...prev,
            page: 0,
        }));
    }, []);

    // Auto-apply filters when date range or storage changes
    useEffect(() => {
        const newFilters: Record<string, string> = {};
        if (startDate) {
            newFilters.start = toUtcDayBoundary(startDate);
        }
        if (endDate) {
            newFilters.end = toUtcDayBoundary(endDate, true);
        }
        if (selectedStorageId) {
            newFilters.storage_id = selectedStorageId;
        }
        if (Object.keys(newFilters).length > 0) {
            handleFilterChange(newFilters);
        }
    }, [startDate, endDate, selectedStorageId, handleFilterChange]);

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

    const handleResetFilters = useCallback(() => {
        setFilters({
            storage_id: '',
            start: '',
            end: '',
            ingredient_id: '',
            limit: 20,
            offset: 0,
        });
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, []);

    const handleIngredientChange = useCallback(
        (ingredientId: string) => {
            handleFilterChange({ ingredient_id: ingredientId });
        },
        [handleFilterChange]
    );

    const handleStorageChange = useCallback(
        (storageId: string) => {
            setSelectedStorageId(storageId);
            handleFilterChange({ storage_id: storageId });
        },
        [handleFilterChange]
    );

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

            {/* Ingredient - Optional */}
            <NoDataTooltip enabled={isIngredientsEmpty} title={noDataText}>
                <TextField
                    select
                    label={t('ingredientReports.ingredient') || 'Ingredient'}
                    value={filters.ingredient_id}
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
            {/* Table */}
            <GenericTableView
                data={reports}
                loading={reportsLoading}
                columns={columns}
                idField="ingredient_id"
                paginationMode="server"
                rowCount={reportsPagination?.total ?? totals?.total_count ?? 0}
                paginationModel={paginationModel}
                onPaginationModelChange={(model) => {
                    setPaginationModel(model);
                    setFilters((prev) => ({
                        ...prev,
                        limit: model.pageSize,
                        offset: model.page * model.pageSize,
                    }));
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                breadcrumbs={{
                    heading: t('ingredientReports.title') || 'Ingredient Reports',
                    links: [
                        { name: t('app') || 'App', href: paths.menu.root },
                        { name: t('overview.reports.title') || 'Reports', href: paths.menu.reports.root },
                        {
                            name: t('ingredientReports.title') || 'Ingredient Reports',
                            href: paths.menu.reports.ingredients?.root || '#',
                        },
                    ],
                }}
                renderFilters={renderFiltersContent}
                onRowClick={handleAmountRowClick}
            />

            {totals && (
                <Box sx={{ px: { xs: 2, md: 5 }, pb: { xs: 2, md: 3 } }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(2, 1fr)' },
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {t('ingredientReports.totalCount', 'Total count')}
                            </Typography>
                            <Typography variant="subtitle2">{totals.total_count ?? 0}</Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {t('ingredientReports.totalOrderOutAmount', 'Total order out amount')}
                            </Typography>
                            <Typography variant="subtitle2">
                                {Number(totals.total_order_out_amount || 0).toLocaleString()} so'm
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Ingredient Report Detail Modal */}
            <GenericViewModal
                isOpen={openDetailsModal}
                onClose={() => setOpenDetailsModal(false)}
                title={reportDetail ? reportDetail.ingredient_name : t('ingredientReports.title') || 'Ingredient Report'}
                data={reportDetail}
                loading={reportLoading}
                renderContent={renderReportDetailsContent}
                maxWidth="lg"
                position="right"
                slideDirection="left"
                paperSx={{
                    width: { xs: '100%', sm: '30vw' },
                    maxWidth: { xs: '100%', sm: '30vw' },
                }}
            />

            <GenericViewModal
                isOpen={openAmountsModal}
                onClose={() => {
                    setOpenAmountsModal(false);
                    setSelectedAmountsData(null);
                }}
                title={selectedAmountsData?.ingredient_name || (t('ingredientReports.title') || 'Ingredient Report')}
                data={selectedAmountsData}
                renderContent={renderAmountsDetailsContent}
                maxWidth="sm"
                position="right"
                slideDirection="left"
                paperSx={{
                    width: { xs: '100%', sm: '30vw' },
                    maxWidth: { xs: '100%', sm: '30vw' },
                }}
            />
        </>
    );
}
