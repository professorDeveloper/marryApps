import type { GridColDef } from '@mui/x-data-grid';

import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { paths } from 'src/routes/paths';
import { useGetBills, useGetBillDetails } from 'src/actions/bills';
import { useGetHalls } from 'src/actions/halls';
import { useGetUsersByRole } from 'src/actions/users';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { RenderCellItem, GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';

export function BillsListView() {
    const { t } = useTranslation('menu');

    // Modal state
    const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
    const [openDetailsModal, setOpenDetailsModal] = useState(false);

    // Get filter options from APIs
    const { halls } = useGetHalls();
    const { users: waiters } = useGetUsersByRole('waiter');

    // Get bill details when modal opens
    const { bill, billLoading } = useGetBillDetails(selectedBillId || '');

    // Filter states
    const [filters, setFilters] = useState({
        start: '',
        end: '',
        bill_status: '',
        payment_type: '',
        waiter_id: '',
        hall_id: '',
        table_id: '',
        limit: 20,
        offset: 0,
    });

    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

    // Get bills with applied filters
    const { bills, billsLoading } = useGetBills(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    );

    // Prepare filter options
    const filterOptions = useMemo(
        () => ({
            bill_status: [
                { value: 'opened', label: t('Ochiq') || 'Opened' },
                { value: 'closed', label: t('Yopilgan') || 'Closed' },
                { value: 'paid', label: t('To\'langan') || 'Paid' },
            ],
            payment_type: [
                { value: 'cash', label: t('Naxt') || 'Cash' },
                { value: 'card', label: t('Karta') || 'Card' },
            ],
            waiter_id: waiters.map((waiter) => ({
                value: waiter.id,
                label: waiter.full_name || waiter.username || 'Unknown',
            })),
            hall_id: halls.map((hall) => ({
                value: hall.id,
                label: hall.name,
            })),
        }),
        [waiters, halls, t]
    );

    // Render bill details modal content
    const renderBillDetailsContent = useCallback((billData: any) => {
        if (!billData) return null;

        return (
            <Box>
                {/* Bill Header Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('Ofitsiant') || 'Waiter'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {billData.waiter_name}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('Stol #') || 'Table #'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {billData.table_number}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('Holat') || 'Status'}
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 700,
                                color:
                                    billData.bill_status === 'opened'
                                        ? '#FFA726'
                                        : billData.bill_status === 'closed'
                                            ? '#66BB6A'
                                            : '#42A5F5',
                            }}
                        >
                            {billData.bill_status === 'opened'
                                ? t('Ochiq') || 'Opened'
                                : billData.bill_status === 'closed'
                                    ? t('Yopilgan') || 'Closed'
                                    : t('To\'langan') || 'Paid'}
                        </Typography>
                    </Box>
                </Box>

                {/* Items Table */}
                {billData.items && billData.items.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('Tovar') || 'Items'} ({billData.items.length})
                        </Typography>
                        <Table size="small" sx={{ '& td': { py: 0.75 } }}>
                            <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('Mahsulot') || 'Product'}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', width: 60 }}>
                                        {t('Miqdor') || 'Qty'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', width: 80 }}>
                                        {t('Narx') || 'Price'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', width: 80 }}>
                                        {t('Jami') || 'Total'}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {billData.items.map((item: any, index: number) => (
                                    <TableRow key={item.id || index} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell sx={{ fontSize: '0.875rem' }}>{item.good_name}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{item.quantity}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.875rem' }}>{Number(item.price).toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                            {(Number(item.price) * item.quantity).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}

                {/* Summary */}
                <Box sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', p: 1.5, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2">{t('Taom jami') || 'Food Total'}:</Typography>
                        <Typography variant="body2">{Number(billData.food_total).toLocaleString()}</Typography>
                    </Box>
                    {Number(billData.service_amount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="body2">{t('Xizmat') || 'Service'} ({billData.service_percent}%):</Typography>
                            <Typography variant="body2">+{Number(billData.service_amount).toLocaleString()}</Typography>
                        </Box>
                    )}
                    {Number(billData.discount_amount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, color: '#66BB6A' }}>
                            <Typography variant="body2">{t('Chegirma') || 'Discount'}:</Typography>
                            <Typography variant="body2">-{Number(billData.discount_amount).toLocaleString()}</Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '2px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {t('Umumiy') || 'Grand Total'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {Number(billData.grand_total).toLocaleString()} so'm
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }, [t]);

    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'bill_no',
                headerName: t('Hisob #') || 'Bill #',
                width: 100,
            },
            {
                field: 'waiter_name',
                headerName: t('Ofitsiant') || 'Waiter',
                flex: 1,
                width: 180,
                renderCell: (params) => (
                    <RenderCellItem params={params} nameField="waiter_name" />
                ),
            },
            {
                field: 'table_number',
                headerName: t('Stol #') || 'Table #',
                width: 100,
            },
            {
                field: 'guest_count',
                headerName: t('Mehmonlar') || 'Guests',
                width: 100,
            },
            {
                field: 'grand_total',
                headerName: t('Umumiy') || 'Total',
                width: 140,
                renderCell: (params) => {
                    const amount = Number(params.row.grand_total) || 0;
                    return `${amount.toLocaleString()} so'm`;
                },
            },
            {
                field: 'service_amount',
                headerName: t('Xizmat') || 'Service',
                width: 120,
                renderCell: (params) => {
                    const amount = Number(params.row.service_amount) || 0;
                    return `${amount.toLocaleString()} so'm`;
                },
            },
            {
                field: 'discount_amount',
                headerName: t('Chegirma') || 'Discount',
                width: 120,
                renderCell: (params) => {
                    const amount = Number(params.row.discount_amount) || 0;
                    return amount > 0 ? `${amount.toLocaleString()} so'm` : '-';
                },
            },
            {
                field: 'bill_status',
                headerName: t('Holat') || 'Status',
                width: 120,
                renderCell: (params) => {
                    const status = params.row.bill_status;
                    const statusColors: Record<string, string> = {
                        opened: '#FFA726',
                        closed: '#66BB6A',
                        paid: '#42A5F5',
                    };
                    const statusLabels: Record<string, string> = {
                        opened: t('Ochiq') || 'Opened',
                        closed: t('Yopilgan') || 'Closed',
                        paid: t('To\'langan') || 'Paid',
                    };
                    return (
                        <span
                            style={{
                                color: statusColors[status] || '#000',
                                fontWeight: 500,
                            }}
                        >
                            {statusLabels[status] || status}
                        </span>
                    );
                },
            },
            {
                field: 'opened_at',
                headerName: t('Vaqt') || 'Date',
                flex: 0.5,
                width: 160,
                renderCell: (params) => {
                    const date = new Date(params.row.opened_at);
                    return date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                },
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
                        label={t('Ko\'rish') || 'View'}
                        icon={<Iconify icon="solar:eye-bold" />}
                        onClick={() => {
                            setSelectedBillId(params.row.id);
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
        handleFilterChange(newFilters);
    }, [startDate, endDate, handleFilterChange]);

    const handleResetFilters = useCallback(() => {
        setStartDate(null);
        setEndDate(null);
        setFilters({
            start: '',
            end: '',
            bill_status: '',
            payment_type: '',
            waiter_id: '',
            hall_id: '',
            table_id: '',
            limit: 20,
            offset: 0,
        });
    }, []);

    const handleStatusChange = useCallback(
        (status: string) => {
            handleFilterChange({ bill_status: status });
        },
        [handleFilterChange]
    );

    const handlePaymentTypeChange = useCallback(
        (type: string) => {
            handleFilterChange({ payment_type: type });
        },
        [handleFilterChange]
    );

    const handleWaiterChange = useCallback(
        (waiterId: string) => {
            handleFilterChange({ waiter_id: waiterId });
        },
        [handleFilterChange]
    );

    const handleHallChange = useCallback(
        (hallId: string) => {
            handleFilterChange({ hall_id: hallId });
        },
        [handleFilterChange]
    );

    return (
        <>
            {/* Filter Card - Top */}
            <Card sx={{ p: 2, mb: 2.5, mx: { xs: 0, md: 5 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5, alignItems: 'flex-end' }}>
                    {/* Start Date */}
                    <DatePicker
                        label={t('Boshlanish sana') || 'Start Date'}
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

                    {/* End Date */}
                    <DatePicker
                        label={t('Tugash sana') || 'End Date'}
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

                    {/* Status */}
                    <TextField
                        select
                        label={t('Holat') || 'Status'}
                        value={filters.bill_status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    >
                        <option value="">All</option>
                        {filterOptions.bill_status.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </TextField>

                    {/* Payment Type */}
                    <TextField
                        select
                        label={t('To\'lov turi') || 'Payment Type'}
                        value={filters.payment_type}
                        onChange={(e) => handlePaymentTypeChange(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    >
                        <option value="">All</option>
                        {filterOptions.payment_type.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </TextField>

                    {/* Waiter */}
                    <TextField
                        select
                        label={t('Ofitsiant') || 'Waiter'}
                        value={filters.waiter_id}
                        onChange={(e) => handleWaiterChange(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    >
                        <option value="">All</option>
                        {filterOptions.waiter_id.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </TextField>

                    {/* Hall */}
                    <TextField
                        select
                        label={t('Zal') || 'Hall'}
                        value={filters.hall_id}
                        onChange={(e) => handleHallChange(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    >
                        <option value="">All</option>
                        {filterOptions.hall_id.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </TextField>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Iconify icon="solar:check-circle-bold" />}
                            onClick={handleApplyDateRange}
                            sx={{ minWidth: 'auto', flex: 1 }}
                        >
                            {t('Qo\'llash') || 'Apply'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Iconify icon="solar:restart-bold" />}
                            onClick={handleResetFilters}
                            sx={{ minWidth: 'auto', flex: 1 }}
                        >
                            {t('Qayta') || 'Reset'}
                        </Button>
                    </Box>
                </Box>
            </Card>

            {/* Table */}
            <GenericTableView
                data={bills}
                loading={billsLoading}
                columns={columns}
                breadcrumbs={{
                    heading: t('Hisob-kitoblar') || 'Bills',
                    links: [
                        { name: t('app') || 'App', href: paths.menu.root },
                        { name: t('overview.reports.title') || 'Reports', href: paths.menu.reports.root },
                        {
                            name: t('Hisob-kitoblar') || 'Bills',
                            href: paths.menu.reports.bills.root,
                        },
                    ],
                }}
                filterOptions={filterOptions}
                initialFilters={filters}
                hideFilters={false}
            />

            {/* Bill Details Modal - Using GenericViewModal */}
            <GenericViewModal
                isOpen={openDetailsModal}
                onClose={() => setOpenDetailsModal(false)}
                title={bill ? `${t('Hisob #') || 'Bill #'} ${bill.bill_no}` : t('Hisob detallar') || 'Bill Details'}
                data={bill}
                renderContent={renderBillDetailsContent}
                maxWidth="lg"
                position="right"
                slideDirection="left"
            />
        </>
    );
}
