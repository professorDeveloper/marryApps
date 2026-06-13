import type { BillsListFilters } from './types';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Chip,
    MenuItem,
    TextField,
} from '@mui/material';

import { useMetadata } from 'src/hooks/use-metadata';
import { useTimeFilter } from 'src/hooks/use-time-filter';
import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetBills, useGetBillDetails } from 'src/actions/bills';

import { GenericViewModal } from 'src/components/generic-view-view/GenericViewModal';

import { DataTable } from 'src/sections/common/data-table';
import { CELL_SX } from 'src/sections/common/data-table/utils/constants';

import { MetadataEntity } from 'src/types/metadata';

import { fmtNum } from './utils/format';
import { BillReceiptDetail } from './components/bill-receipt-detail';

const BILL_STATUS_CHIP_COLOR: Record<string, 'info' | 'warning' | 'success'> = {
    opened: 'info',
    closed: 'warning',
    paid: 'success',
};

const DATE_TIME_CELL_SX = { lineHeight: 1.2, fontSize: '0.85em' };

const SERVICE_CELL_SX = {
    ...CELL_SX,
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.2,
    fontSize: '0.85em',
} as const;

const SERVICE_PERCENT_SX = { color: 'text.secondary' };

const filterSelectSx = {
    minWidth: { xs: '100%', sm: 140 },
    '& .MuiInputBase-root': { height: 36, fontSize: 13.5, backgroundColor: 'var(--bg2)', borderRadius: '6px', fontFamily: 'var(--font-sans)' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--brand)', boxShadow: '0 0 0 2px var(--accent-soft)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

const renderDateTimeCell = ({ value }: { value: unknown }) => {
    const dateObj = dayjs(value as string);
    if (!dateObj.isValid()) return '';

    return (
        <Box sx={CELL_SX}>
            <Box sx={DATE_TIME_CELL_SX}>
                <Box>{dateObj.format('DD.MM.YYYY')}</Box>
                <Box>{dateObj.format('HH:mm')}</Box>
            </Box>
        </Box>
    );
};

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const getTodayUtcBoundary = (): string => {
    const today = dayjs();
    return toUtcDayBoundary(today);
};

const initialFilters: BillsListFilters = {
    start: getTodayUtcBoundary(),
    end: getTodayUtcBoundary(),
    bill_status: [],
    payment_type: [],
    waiter_id: '',
    hall_id: [],
    table_id: '',
    status: '',
    q: '',
    limit: 20,
    offset: 0,
};

export function BillsListView() {
    const { t, i18n } = useTranslation('menu');
    // Modal state
    const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [openDetailsModal, setOpenDetailsModal] = useState(false);

    // Metadata (halls, users, cafetables)
    const { data: metadata } = useMetadata([MetadataEntity.HALLS, MetadataEntity.USERS, MetadataEntity.CAFE_TABLES]);
    const halls = (metadata.halls || []) as any[];
    const users = (metadata.users || []) as any[];
    const cafetables = (metadata.cafetables || []) as any[];
    const cafeTableMap = useMemo(
        () => new Map(cafetables.map((tbl) => [tbl.id, tbl.number ?? tbl.name])),
        [cafetables]
    );

    // Exclude deleted entities from filter options (their data may still appear in bill rows)
    const activeHalls = useMemo(() => halls.filter((h: any) => !h.is_deleted), [halls]);
    const activeUsers = useMemo(() => users.filter((u: any) => !u.is_deleted), [users]);
    const activeCafetables = useMemo(() => cafetables.filter((tbl: any) => !tbl.is_deleted), [cafetables]);

    // Get bill details when modal opens
    const { bill, billLoading } = useGetBillDetails(selectedBillId || '');

    // Resolve global rows per page and time filter BEFORE state declarations so lazy init is correct
    const { rowsPerPage: globalRowsPerPage } = usePaginationRows();
    const { startDate, endDate, activePeriod: activeRange, setDates, applyRange } = useTimeFilter();

    // Filter states — lazy init so initial values match Redux/localStorage, preventing extra requests
    const [filters, setFilters] = useState<BillsListFilters>(() => ({
        ...initialFilters,
        limit: globalRowsPerPage,
        start: startDate ? toUtcDayBoundary(startDate) : getTodayUtcBoundary(),
        end: endDate ? toUtcDayBoundary(endDate, true) : getTodayUtcBoundary(),
    }));
    const [draftFilters, setDraftFilters] = useState<BillsListFilters>(() => ({
        ...initialFilters,
        limit: globalRowsPerPage,
        start: startDate ? toUtcDayBoundary(startDate) : getTodayUtcBoundary(),
        end: endDate ? toUtcDayBoundary(endDate, true) : getTodayUtcBoundary(),
    }));
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: globalRowsPerPage });

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, pageSize: globalRowsPerPage }));
    }, [globalRowsPerPage]);

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


    // Render bill details modal content
    const renderBillDetailsContent = useCallback(
        (billData: any) => <BillReceiptDetail billData={billData} cafeTableMap={cafeTableMap} t={t} />,
        [t, cafeTableMap]
    );

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

    const statusLabels = useMemo<Record<string, string>>(
        () => ({
            opened: t('bills.opened') || 'Opened',
            closed: t('bills.closed') || 'Closed',
            paid: t('bills.paid') || 'Paid',
        }),
        [t]
    );

    const paymentTypeLabels = useMemo<Record<string, string>>(
        () => ({
            cash: t('bills.cash'),
            card: t('bills.card'),
        }),
        [t]
    );

    // DataTable columns
    const columns = useMemo(
        () => [
            {
                key: 'bill_no',
                label: '#',
                sortable: true,
                width: '0.4fr',
                align: 'left' as const,
                getValue: (row: any) => row?.bill_no ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.bill_no || '-'}
                    </Box>
                ),
            },
            {
                key: 'bill_status',
                label: t('bills.status') || 'Status',
                sortable: true,
                width: '0.9fr',
                align: 'left' as const,
                getValue: (row: any) => row?.bill_status || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const status = String(value ?? '').toLowerCase();
                    return (
                        <Chip
                            label={statusLabels[status] || status}
                            color={BILL_STATUS_CHIP_COLOR[status] ?? 'default'}
                            size="small"
                            variant="soft"
                        />
                    );
                },
            },
            {
                key: 'opened_at',
                label: t('bills.opened'),
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                renderCell: renderDateTimeCell,
            },
            {
                key: 'closed_at',
                label: t('bills.closed'),
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                renderCell: renderDateTimeCell,
            },
            {
                key: 'waiter_name',
                label: t('bills.waiter') || 'Waiter',
                sortable: true,
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.waiter_name ?? '-',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.waiter_name || '-'}
                    </Box>
                ),
            },
            {
                key: 'hall_id',
                label: t('bills.hall') || 'Hall',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.hall_name ?? '-',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.hall_name || '-'}
                    </Box>
                ),
            },
            {
                key: 'table_number',
                label: t('bills.table') || 'Table',
                sortable: true,
                width: '0.6fr',
                align: 'left' as const,
                getValue: (row: any) => row?.table_number ?? '-',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.table_number || '-'}
                    </Box>
                ),
            },
            {
                key: 'guest_count',
                label: t('bills.guests'),
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => row?.guest_count ?? 0,
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.guest_count || 0}
                    </Box>
                ),
            },
            {
                key: 'food_cost',
                label: t('bills.foodCost'),
                sortable: true,
                width: '1.4fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.food_cost || 0),
                renderCell: ({ value }: { value: unknown }) => (
                    <Box sx={CELL_SX}>{fmtNum(Number(value ?? 0))}</Box>
                ),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'food_total',
                label: t('bills.foodTotal') || 'Food Total',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.food_total || 0),
                renderCell: ({ value }: { value: unknown }) => (
                    <Box sx={CELL_SX}>{fmtNum(Number(value ?? 0))}</Box>
                ),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'payment_type',
                label: t('bills.paymentType') || 'Payment type',
                sortable: true,
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.payment_type || '',
                renderCell: ({ value }: { value: unknown }) => (
                    <Box sx={CELL_SX}>{paymentTypeLabels[String(value ?? '')] || '-'}</Box>
                ),
            },
            {
                key: 'service_amount',
                label: t('bills.service') || 'Service',
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.service_amount || 0),
                renderCell: ({ row }: { row: any }) => {
                    const percent = Number(row?.service_percent || 0);
                    const amount = Number(row?.service_amount || 0);
                    return (
                        <Box sx={SERVICE_CELL_SX}>
                            <Box sx={SERVICE_PERCENT_SX}>{percent > 0 ? `${percent.toFixed(2)}%` : '-'}</Box>
                            <Box>{fmtNum(amount)}</Box>
                        </Box>
                    );
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
                    return <Box sx={CELL_SX}>{amount > 0 ? fmtNum(amount) : '-'}</Box>;
                },
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'grand_total',
                label: t('bills.total') || 'Total',
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                mono: true,
                getValue: (row: any) => Number(row?.grand_total || 0),
                renderCell: ({ value }: { value: unknown }) => (
                    <Box sx={CELL_SX}>{fmtNum(Number(value ?? 0))}</Box>
                ),
                total: { aggregation: 'sum' as const },
            },
        ],
        [t, i18n.language, halls, statusLabels, paymentTypeLabels]
    );

    // Filter handlers adapted for invoice pattern
    const handleStatusChange = useCallback(
        (status: string) => {
            setDraftFilters((prev) => ({ ...prev, bill_status: status ? [status] : [] }));
        },
        []
    );

    const handlePaymentTypeChange = useCallback(
        (type: string) => {
            setDraftFilters((prev) => ({ ...prev, payment_type: type ? [type] : [] }));
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
            setDraftFilters((prev) => ({ ...prev, hall_id: hallId ? [hallId] : [] }));
        },
        []
    );

    const handleTableChange = useCallback(
        (tableId: string) => {
            setDraftFilters((prev) => ({ ...prev, table_id: tableId }));
        },
        []
    );

    const handleResetFilters = useCallback(() => {
        setDraftFilters((prev) => ({
            ...initialFilters,
            start: prev.start,
            end: prev.end,
        }));
    }, []);

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
                    toolbarActions={
                        <>
                            <TextField
                                select size="small" label={t('bills.status') || 'Status'}
                                value={draftFilters.bill_status?.[0] || ''}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {['opened', 'closed', 'paid'].map((s) => (
                                    <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('bills.paymentType') || 'Payment Type'}
                                value={draftFilters.payment_type?.[0] || ''}
                                onChange={(e) => handlePaymentTypeChange(e.target.value)}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                <MenuItem value="cash">{t('bills.cash')}</MenuItem>
                                <MenuItem value="card">{t('bills.card')}</MenuItem>
                            </TextField>
                            <TextField
                                select size="small" label={t('bills.waiter') || 'Waiter'}
                                value={draftFilters.waiter_id || ''}
                                onChange={(e) => handleWaiterChange(e.target.value)}
                                sx={{ ...filterSelectSx, minWidth: { xs: '100%', sm: 160 } }}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {activeUsers.map((u) => (
                                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('bills.hall') || 'Hall'}
                                value={draftFilters.hall_id?.[0] || ''}
                                onChange={(e) => handleHallChange(e.target.value)}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {activeHalls.map((h) => (
                                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('bills.table') || 'Table'}
                                value={draftFilters.table_id || ''}
                                onChange={(e) => handleTableChange(e.target.value)}
                                sx={{ ...filterSelectSx, minWidth: { xs: '100%', sm: 120 } }}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {activeCafetables.map((tbl) => (
                                    <MenuItem key={tbl.id} value={tbl.id}>{tbl.name}</MenuItem>
                                ))}
                            </TextField>
                        </>
                    }
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount: rowCount,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: handlePaginationPageChange,
                        onRowsPerPageChange: handlePaginationRowsPerPageChange,
                    }}
                    showRowNumbers={false}
                    periodFilter={{
                        startDate: startDate ? startDate.toDate() : null,
                        endDate: endDate ? endDate.toDate() : null,
                        onStartDateChange: (date: Date | null) => { setDates(date ? dayjs(date) : null, endDate, 'day'); },
                        onEndDateChange: (date: Date | null) => { setDates(startDate, date ? dayjs(date) : null, 'day'); },
                        activePeriod: activeRange,
                        onPeriodChange: applyRange,
                    }}
                    defaultConfig={{
                        order: ['bill_no', 'bill_status', 'opened_at', 'closed_at', 'waiter_name', 'hall_id', 'table_number', 'guest_count', 'payment_type', 'food_cost', 'food_total',  'discount_amount', 'service_amount','grand_total'],
                        visibility: {
                            bill_no: true,
                            bill_status: true,
                            opened_at: true,
                            closed_at: true,
                            waiter_name: true,
                            hall_id: true,
                            table_number: true,
                            guest_count: true,
                            food_cost: true,
                            food_total: true,
                            grand_total: true,
                            payment_type: true,
                            service_amount: true,
                            discount_amount: true,
                        },
                        widths: {
                            bill_no: '0.4fr',
                            bill_status: '0.9fr',
                            opened_at: '0.8fr',
                            closed_at: '0.8fr',
                            waiter_name: '1.2fr',
                            hall_id: '1fr',
                            table_number: '0.6fr',
                            guest_count: '0.8fr',
                            food_cost: '1.4fr',
                            food_total: '1fr',
                            grand_total: '0.8fr',
                            payment_type: '1.2fr',
                            service_amount: '1fr',
                            discount_amount: '0.8fr',
                        },
                    }}
                    onReset={handleResetFilters}
                    onRowClick={handleViewClick}
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
                paperSx={{ width: { md: '440px' }, maxWidth: { md: '440px' } }}
            />
        </>
    );
}
