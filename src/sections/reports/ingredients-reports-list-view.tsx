import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { paths } from 'src/routes/paths';
import { useGetIngredientReports, useGetIngredientReportDetail } from 'src/actions/ingredient-reports';
import { useGetIngredients } from 'src/actions/ingredients';
import { useGetStorages } from 'src/actions/departments';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { RenderCellItem, GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';

export function IngredientReportsListView() {
    const { t } = useTranslation('menu');

    // Get filter options from APIs
    const { ingredients } = useGetIngredients();
    const { storages } = useGetStorages();

    // Filter states
    const [filters, setFilters] = useState({
        // storage_id: '',
        start: '',
        end: '',
        ingredient_id: '',
        limit: 20,
        offset: 0,
    });

    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedStorageId, setSelectedStorageId] = useState<string>('');

    // Modal states
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

    // Set default date range and storage on component mount
    useEffect(() => {
        // Set default date range (yesterday to today)
        const today = dayjs();
        const yesterday = today.subtract(1, 'day');
        setStartDate(yesterday);
        setEndDate(today);

        // Set default storage
        if (storages && storages.length > 0) {
            const firstStorageId = storages[0].id;
            setSelectedStorageId(firstStorageId);

            // Update filters with initial values
            setFilters((prev) => ({
                ...prev,
                storage_id: firstStorageId,
                start: yesterday.format('YYYY-MM-DD'),
                end: today.format('YYYY-MM-DD'),
            }));
        }
    }, [storages]);

    // Get reports with applied filters
    const { reports, reportsLoading } = useGetIngredientReports(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    );

    // Get ingredient report detail for modal
    const { report: reportDetail, reportLoading } = useGetIngredientReportDetail(
        selectedIngredientId || '',
        selectedStorageId,
        startDate?.format('YYYY-MM-DD') || '',
        endDate?.format('YYYY-MM-DD') || ''
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

    const columns = useMemo<GridColDef[]>(
        () => [
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
            //     field: 'storage_name',
            //     headerName: t('Omborlar') || 'Storage',
            //     width: 150,
            //     renderCell: (params) => (
            //         <RenderCellItem params={params} nameField="storage_name" />
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
                field: 'begin_qty',
                headerName: t('ingredientReports.beginQty') || 'Begin Qty',
                width: 120,
                renderCell: (params) => {
                    return `${Number(params.row.begin_qty).toFixed(2)}`;
                },
            },
            {
                field: 'end_qty',
                headerName: t('ingredientReports.endQty') || 'End Qty',
                width: 120,
                renderCell: (params) => {
                    return `${Number(params.row.end_qty).toFixed(2)}`;
                },
            },
            {
                field: 'invoice_in_qty',
                headerName: t('ingredientReports.in') || 'In',
                width: 100,
                renderCell: (params) => {
                    return `${Number(params.row.invoice_in_qty).toFixed(2)}`;
                },
            },
            {
                field: 'order_out_qty',
                headerName: t('ingredientReports.out') || 'Out',
                width: 100,
                renderCell: (params) => {
                    return `${Number(params.row.order_out_qty).toFixed(2)}`;
                },
            },
            {
                field: 'begin_amount',
                headerName: t('ingredientReports.beginCost') || 'Begin Cost',
                width: 120,
                renderCell: (params) => {
                    const amount = Number(params.row.begin_amount) || 0;
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
            // {
            //     field: 'date',
            //     headerName: t('Sana') || 'Date',
            //     width: 120,
            //     renderCell: (params) => {
            //         const date = new Date(params.row.date);
            //         return date.toLocaleDateString('en-US', {
            //             year: 'numeric',
            //             month: '2-digit',
            //             day: '2-digit',
            //         });
            //     },
            // },
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
                        label={t('ingredientReports.view') || 'View'}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => {
                            setSelectedIngredientId(params.row.ingredient_id);
                            setOpenDetailsModal(true);
                        }}
                    />,
                ],
            },
        ],
        [t]
    );

    const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
            offset: 0,
        }));
    }, []);

    const handleApplyDateRange = useCallback(() => {
        const newFilters: Record<string, string> = {};
        if (startDate) {
            newFilters.start = startDate.format('YYYY-MM-DD');
        }
        if (endDate) {
            newFilters.end = endDate.format('YYYY-MM-DD');
        }
        if (selectedStorageId) {
            newFilters.storage_id = selectedStorageId;
        }
        handleFilterChange(newFilters);
    }, [startDate, endDate, selectedStorageId, handleFilterChange]);

    const handleResetFilters = useCallback(() => {
        setFilters({
            // storage_id: '',
            start: '',
            end: '',
            ingredient_id: '',
            limit: 20,
            offset: 0,
        });
        setSelectedStorageId('');
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 1.5 }}>
            {/* Storage - Required */}
            <TextField
                select
                label={t('ingredientReports.storage') || 'Storage'}
                value={selectedStorageId}
                onChange={(e) => handleStorageChange(e.target.value)}
                SelectProps={{ native: true }}
                size="small"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                            borderColor: '#1890FF',
                        },
                    },
                }}
            >
                <option value="">{t('common.select') || 'Select Storage'}</option>
                {filterOptions.storage_id.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </TextField>

            {/* Start Date - Required */}
            <DatePicker
                label={t('ingredientReports.startDate') || 'Start Date'}
                value={startDate}
                onChange={setStartDate}
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
                onChange={setEndDate}
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
            <TextField
                select
                label={t('ingredientReports.ingredient') || 'Ingredient'}
                value={filters.ingredient_id}
                onChange={(e) => handleIngredientChange(e.target.value)}
                SelectProps={{ native: true }}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
            >
                <option value="">{t('ingredientReports.all') || 'All'}</option>
                {filterOptions.ingredient_id.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </TextField>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                    // variant="contained"
                    size="small"
                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                    onClick={handleApplyDateRange}
                    disabled={!selectedStorageId || !startDate || !endDate}
                    sx={{
                        minWidth: 'auto',
                        flex: 1,
                        backgroundColor: '#FB6633',
                        color: '#FFFFFF',
                    }}
                >
                    {t('ingredientReports.apply') || 'Apply'}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="solar:restart-bold" />}
                    onClick={handleResetFilters}
                    sx={{ minWidth: 'auto', flex: 1 }}
                >
                    {t('ingredientReports.reset') || 'Reset'}
                </Button>
            </Box>
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
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        {t('ingredientReports.ingredient') || 'Ingredient'}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        {data.ingredient_name}
                    </Typography>

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
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {data.measurement === 'kg' ? 'kg' : data.measurement === 'l' ? 'l' : 'dona'}
                                    </Typography>
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

    return (
        <>
            {/* Table */}
            <GenericTableView
                data={reports}
                loading={reportsLoading}
                columns={columns}
                idField="ingredient_id"
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
            />

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
            />
        </>
    );
}
