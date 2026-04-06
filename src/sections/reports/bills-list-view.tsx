import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Table,
  Button,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { useGetHalls } from 'src/actions/halls';
import { useGetUsersByRole } from 'src/actions/users';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetBills, useGetBillDetails } from 'src/actions/bills';

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
interface BillsListFilters {
    start: string;
    end: string;
    bill_status: string;
    payment_type: string;
    waiter_id: string;
    hall_id: string;
    table_id: string;
    status: string; // Adding status field for compatibility
    q: string; // Adding search field for compatibility
    limit: number;
    offset: number;
}

const initialFilters: BillsListFilters = {
    start: getTodayUtcBoundary(),
    end: getTomorrowUtcBoundary(true),
    bill_status: '',
    payment_type: '',
    waiter_id: '',
    hall_id: '',
    table_id: '',
    status: '',
    q: '',
    limit: 20,
    offset: 0,
};

export function BillsListView() {
    const { t, i18n } = useTranslation('menu');
    const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

    // Modal state
    const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [openDetailsModal, setOpenDetailsModal] = useState(false);

    // Get filter options from APIs
    const { halls } = useGetHalls();
    const { users: waiters } = useGetUsersByRole('waiter');

    // Get bill details when modal opens
    const { bill, billLoading } = useGetBillDetails(selectedBillId || '');

    // Filter states
    const [filters, setFilters] = useState<BillsListFilters>(initialFilters);
    const [draftFilters, setDraftFilters] = useState<BillsListFilters>(initialFilters);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

    // Set default date range to last 1 day on component mount
    useEffect(() => {
        const today = dayjs();
        setStartDate(today.startOf('day'));
        setEndDate(today.endOf('day'));
    }, []);

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

    // Get bills with applied filters
    const { bills, billsLoading, pagination, totals } = useGetBills(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    );

    // Update row count when pagination changes
    useEffect(() => {
        setRowCount(pagination?.total || 0);
    }, [pagination]);

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

    const isWaitersEmpty = filterOptions.waiter_id.length === 0;
    const isHallsEmpty = filterOptions.hall_id.length === 0;

    // Render bill details modal content
    const renderBillDetailsContent = useCallback((billData: any) => {
        if (!billData) return null;

        const paymentTypeLabel =
            billData.payment_type === 'cash'
                ? t('bills.cash', 'Cash')
                : billData.payment_type === 'card'
                    ? t('bills.card', 'Card')
                    : '-';

        return (
            <Box>
                {/* Bill Header Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('bills.waiter') || 'Waiter'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {billData.waiter_name || '-'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('bills.hall') || 'Hall'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {billData.hall_name || '-'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('bills.table') || 'Table #'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {billData.table_number}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                            {t('bills.status') || 'Status'}
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
                                ? t('bills.opened') || 'Opened'
                                : billData.bill_status === 'closed'
                                    ? t('bills.closed') || 'Closed'
                                    : t('bills.paid') || 'Paid'}
                        </Typography>
                    </Box>
                </Box>

                {/* Items Table */}
                {billData.items && billData.items.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('bills.items') || 'Items'} ({billData.items.length || billData.quantity || 0})
                        </Typography>
                        <Table size="small" sx={{ '& td': { py: 0.75 } }}>
                            <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('bills.product') || 'Product'}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', width: 60 }}>
                                        {t('bills.quantity') || 'Qty'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', width: 80 }}>
                                        {t('bills.price') || 'Price'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', width: 80 }}>
                                        {t('bills.total') || 'Total'}
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
                        <Typography variant="body2">{t('bills.foodCost', 'Food Cost')}:</Typography>
                        <Typography variant="body2">{Number(billData.food_cost).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2">{t('bills.foodTotal') || 'Food Total'}:</Typography>
                        <Typography variant="body2">{Number(billData.food_total).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2">{t('bills.paymentType') || 'Payment Type'}:</Typography>
                        <Typography variant="body2">{paymentTypeLabel}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2">{t('bills.closedAt', 'Closed At')}:</Typography>
                        <Typography variant="body2">
                            {billData.closed_at ? dayjs(billData.closed_at).format('YYYY-MM-DD HH:mm') : '-'}
                        </Typography>
                    </Box>
                    {Number(billData.service_amount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="body2">{t('bills.service') || 'Service'} ({billData.service_percent}%):</Typography>
                            <Typography variant="body2">+{Number(billData.service_amount).toLocaleString()}</Typography>
                        </Box>
                    )}
                    {Number(billData.discount_amount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, color: '#66BB6A' }}>
                            <Typography variant="body2">{t('bills.discount') || 'Discount'}:</Typography>
                            <Typography variant="body2">-{Number(billData.discount_amount).toLocaleString()}</Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '2px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {t('bills.grandTotal') || 'Grand Total'}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {Number(billData.grand_total).toLocaleString()} so'm
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }, [t]);

    // View bill details
    const handleViewClick = useCallback((billData: any) => {
        setSelectedBillId(billData.id);
        setSelectedBill(billData);
        setOpenDetailsModal(true);
    }, []);

    // Modal close handler
    const handleModalClose = useCallback(() => {
        setSelectedBillId(null);
        setSelectedBill(null);
        setOpenDetailsModal(false);
    }, []);

    // DataTable columns
    const columns = useMemo(
        () => [
            {
                key: 'bill_no',
                label: t('bills.billNo') || 'Bill #',
                sortable: true,
                width: '0.5fr',
                align: 'left' as const,
                getValue: (row: any) => row?.bill_no ?? '',
            },
            {
                key: 'opened_at',
                label: t('bills.date') || 'Date',
                sortable: true,
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.opened_at || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const dateObj = dayjs(value as string);
                    const currentLang = i18n.language;

                    let dayMonthLine = '';
                    let yearTimeLine = '';

                    if (currentLang.startsWith('ru')) {
                        dayMonthLine = dateObj.format('DD MMMM');
                        yearTimeLine = dateObj.format('YYYY, HH:mm');
                    } else if (currentLang.startsWith('en')) {
                        dayMonthLine = dateObj.format('DD MMMM');
                        yearTimeLine = dateObj.format('YYYY, HH:mm');
                    } else if (currentLang === 'uz-Cyrl') {
                        dayMonthLine = dateObj.format('DD MMMM');
                        yearTimeLine = dateObj.format('YYYY, HH:mm');
                    } else {
                        dayMonthLine = dateObj.format('DD MMMM');
                        yearTimeLine = dateObj.format('YYYY, HH:mm');
                    }

                    return (
                        <div style={{ lineHeight: 1.4 }}>
                            <div>{dayMonthLine}</div>
                            <div>{yearTimeLine}</div>
                        </div>
                    );
                },
            },
            {
                key: 'closed_at',
                label: t('bills.closedAt', 'Closed At'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => {
                    const closedAt = row?.closed_at || row?.paid_at;
                    if (!closedAt) return '';
                    const dateObj = dayjs(closedAt);
                    if (!dateObj.isValid()) return '';
                    return dateObj.format('DD.MM.YYYY HH:mm');
                },
            },
            {
                key: 'waiter_name',
                label: t('bills.waiter') || 'Waiter',
                sortable: true,
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.waiter_name ?? '-',
            },
            {
                key: 'hall_name',
                label: t('bills.hall') || 'Hall',
                sortable: true,
                filter: { type: 'multi' as const },
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => row?.hall_name ?? '-',
            },
            {
                key: 'table_number',
                label: t('bills.table') || 'Table #',
                sortable: true,
                width: '0.5fr',
                align: 'left' as const,
                getValue: (row: any) => row?.table_number ?? '',
            },
            {
                key: 'guest_count',
                label: t('bills.guests') || 'Guests',
                sortable: true,
                width: '0.5fr',
                align: 'left' as const,
                getValue: (row: any) => row?.guest_count ?? 0,
            },
            {
                key: 'food_cost',
                label: t('bills.foodCost', 'Food Cost'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.food_cost || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return `${amount.toLocaleString()} so'm`;
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'grand_total',
                label: t('bills.total') || 'Total',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.grand_total || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return `${amount.toLocaleString()} so'm`;
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'payment_type',
                label: t('bills.paymentType') || 'Payment Type',
                sortable: true,
                filter: { type: 'multi' as const, options: ['cash', 'card'] },
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => row?.payment_type || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const val = String(value ?? '');
                    if (val === 'cash') return t('bills.cash', 'Cash');
                    if (val === 'card') return t('bills.card', 'Card');
                    return '-';
                },
            },
            {
                key: 'service_amount',
                label: t('bills.service') || 'Service',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.service_amount || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return `${amount.toLocaleString()} so'm`;
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'discount_amount',
                label: t('bills.discount') || 'Discount',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.discount_amount || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return amount > 0 ? `${amount.toLocaleString()} so'm` : '-';
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'bill_status',
                label: t('bills.status') || 'Status',
                sortable: true,
                filter: { type: 'multi' as const, options: ['opened', 'closed', 'paid'] },
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => row?.bill_status || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const status = String(value ?? '').toLowerCase();
                    const statusColors: Record<string, string> = {
                        opened: '#FFA726',
                        closed: '#66BB6A',
                        paid: '#42A5F5',
                    };
                    const statusLabels: Record<string, string> = {
                        opened: t('bills.opened') || 'Opened',
                        closed: t('bills.closed') || 'Closed',
                        paid: t('bills.paid') || 'Paid',
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
                            onClick={() => handleViewClick(row)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:eye-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, i18n.language, handleViewClick]
    );

    // Filter handlers adapted for invoice pattern
    const handleStatusChange = useCallback(
        (status: string) => {
            setDraftFilters((prev) => ({ ...prev, bill_status: status }));
        },
        []
    );

    const handlePaymentTypeChange = useCallback(
        (type: string) => {
            setDraftFilters((prev) => ({ ...prev, payment_type: type }));
        },
        []
    );

    const handleWaiterChange = useCallback(
        (waiterId: string) => {
            setDraftFilters((prev) => ({ ...prev, waiter_id: waiterId }));
        },
        []
    );

    const handleHallChange = useCallback(
        (hallId: string) => {
            setDraftFilters((prev) => ({ ...prev, hall_id: hallId }));
        },
        []
    );

    const handleResetFilters = useCallback(() => {
        setDraftFilters(initialFilters);
        setStartDate(dayjs().startOf('day'));
        setEndDate(dayjs().endOf('day'));
        setActiveRange('day');
    }, []);

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

    // Date range application
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
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)', lg: 'repeat(7, 1fr)' },
                    gap: 1.5,
                    alignItems: 'end',
                }}
            >
                <ToggleButtonGroup
                    exclusive
                    value={activeRange}
                    onChange={(_, value) => {
                        if (!value) return;
                        applyRange(value);
                    }}
                    size="small"
                    sx={{
                        alignSelf: 'end',
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
                {/* Start Date */}
                <DatePicker
                    label={t('bills.startDate') || 'Start Date'}
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
                            sx: { cursor: 'pointer', minWidth: 200 },
                        },
                    }}
                />

                {/* End Date */}
                <DatePicker
                    label={t('bills.endDate') || 'End Date'}
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
                            sx: { cursor: 'pointer', minWidth: 200 },
                        },
                    }}
                />

                {/* Status */}
                <TextField
                    select
                    label={t('bills.status') || 'Status'}
                    value={draftFilters.bill_status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    SelectProps={{ native: true }}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                >
                    <option value="">
                        {t('ingredientReports.all') || 'All'}
                    </option>
                    {filterOptions.bill_status.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </TextField>

                {/* Payment Type */}
                <TextField
                    select
                    label={t('bills.paymentType') || 'Payment Type'}
                    value={draftFilters.payment_type}
                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                    SelectProps={{ native: true }}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                >
                    <option value="">
                        {t('ingredientReports.all') || 'All'}
                    </option>
                    {filterOptions.payment_type.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </TextField>

                {/* Waiter */}
                <NoDataTooltip enabled={isWaitersEmpty} title={noDataText}>
                    <TextField
                        select
                        label={t('bills.waiter') || 'Waiter'}
                        value={draftFilters.waiter_id}
                        onChange={(e) => handleWaiterChange(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        disabled={isWaitersEmpty}
                    >
                        <option value="">
                            {t('ingredientReports.all') || 'All'}
                        </option>
                        {filterOptions.waiter_id.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </TextField>
                </NoDataTooltip>

                {/* Hall */}
                <NoDataTooltip enabled={isHallsEmpty} title={noDataText}>
                    <TextField
                        select
                        label={t('bills.hall') || 'Hall'}
                        value={draftFilters.hall_id}
                        onChange={(e) => handleHallChange(e.target.value)}
                        SelectProps={{ native: true }}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        disabled={isHallsEmpty}
                    >
                        <option value="">
                            {t('ingredientReports.all') || 'All'}
                        </option>
                        {filterOptions.hall_id.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </TextField>
                </NoDataTooltip>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<Iconify icon="solar:restart-bold" />}
                        onClick={handleResetFilters}
                        sx={{ minWidth: 'auto', flex: 1 }}
                    >
                        {t('bills.reset') || 'Reset'}
                    </Button>
                </Box>
            </Box>
        </Box>
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
                persistKey="reports-bills-list"
                data={bills || []}
                getRowId={(row: any) => String(row?.id)}
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
                defaultConfig={{
                    order: ['bill_no', 'opened_at', 'closed_at', 'waiter_name', 'hall_name', 'table_number', 'guest_count', 'food_cost', 'grand_total', 'payment_type', 'service_amount', 'discount_amount', 'bill_status', 'actions'],
                    visibility: {
                        bill_no: true,
                        opened_at: true,
                        closed_at: true,
                        waiter_name: true,
                        hall_name: true,
                        table_number: true,
                        guest_count: true,
                        food_cost: true,
                        grand_total: true,
                        payment_type: true,
                        service_amount: true,
                        discount_amount: true,
                        bill_status: true,
                        actions: true,
                    },
                    widths: {
                        bill_no: '0.5fr',
                        opened_at: '1.2fr',
                        closed_at: '1fr',
                        waiter_name: '1.2fr',
                        hall_name: '0.8fr',
                        table_number: '0.5fr',
                        guest_count: '0.5fr',
                        food_cost: '1fr',
                        grand_total: '1fr',
                        payment_type: '0.8fr',
                        service_amount: '1fr',
                        discount_amount: '0.8fr',
                        bill_status: '0.8fr',
                        actions: '0.7fr',
                    },
                }}
                onReset={handleResetFilters}
            />
            </DashboardContent>

            <GenericViewModal
                isOpen={openDetailsModal}
                onClose={handleModalClose}
                title={bill ? `${t('bills.billNo') || 'Bill #'} ${bill.bill_no}` : t('bills.details') || 'Bill Details'}
                data={bill}
                loading={billLoading}
                renderContent={renderBillDetailsContent}
                maxWidth="lg"
                position="right"
                slideDirection="left"
            />
        </>
    );
}
