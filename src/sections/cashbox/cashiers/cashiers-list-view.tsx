import type { ICashier } from 'src/types/cashbox';
import type { DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';
import { CELL_SX } from 'src/sections/warehouse/deduction/components/utility-data-table/utils/constants';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Button, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCashiers } from 'src/actions/cashbox';

import { Iconify } from 'src/components/iconify';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';
import { CashierDeleteDialog } from './components/CashierDeleteDialog';
import { CASHIERS_TABLE_PERSIST_KEY, INITIAL_CASHIER_FILTERS } from './constants';
import { toUtcDayBoundary, toPickerDate } from '../utils/date-utils';

export function CashiersListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { cashiers } = useGetCashiers();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [filters, setFilters] = useState(INITIAL_CASHIER_FILTERS);
    const [draftFilters, setDraftFilters] = useState(INITIAL_CASHIER_FILTERS);
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

    // Set default date range on component mount
    useEffect(() => {
        const today = dayjs();
        setStartDate(today.startOf('day'));
        setEndDate(today.endOf('day'));
    }, []);

    // Apply date range changes
    useEffect(() => {
        setDraftFilters((prev) => ({
            ...prev,
            start_date: startDate ? toUtcDayBoundary(startDate) : '',
            end_date: endDate ? toUtcDayBoundary(endDate, true) : '',
        }));
    }, [startDate, endDate]);

    // Apply range changes
    const applyRange = useCallback((range: 'day' | 'week' | 'month' | 'year') => {
        const today = dayjs();
        let nextStart = today.startOf('day');
        let nextEnd = today.endOf('day');

        switch (range) {
            case 'day':
                nextStart = today.startOf('day');
                nextEnd = today.endOf('day');
                break;
            case 'week':
                nextStart = today.startOf('week');
                nextEnd = today.endOf('day');
                break;
            case 'month':
                nextStart = today.startOf('month');
                nextEnd = today.endOf('day');
                break;
            case 'year':
                nextStart = today.startOf('year');
                nextEnd = today.endOf('day');
                break;
        }

        setActiveRange(range);
        setStartDate(nextStart);
        setEndDate(nextEnd);
    }, []);

    const handleResetFilters = useCallback(() => {
        setDraftFilters(INITIAL_CASHIER_FILTERS);
        const today = dayjs();
        setStartDate(today.startOf('day'));
        setEndDate(today.endOf('day'));
        setActiveRange('day');
    }, []);

    // Update filters when draft filters change
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            ...draftFilters,
        }));
    }, [draftFilters]);

    // Filter cashiers based on search and date range
    const filteredCashiers = useMemo(() => {
        let filtered = cashiers;

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(cashier =>
                cashier.name.toLowerCase().includes(searchLower)
            );
        }

        // Date range filter
        if (filters.start_date || filters.end_date) {
            filtered = filtered.filter(cashier => {
                const cashierDate = new Date(cashier.created_at);
                const startDate = filters.start_date ? new Date(filters.start_date) : new Date('1970-01-01');
                const endDate = filters.end_date ? new Date(filters.end_date) : new Date('9999-12-31');
                return cashierDate >= startDate && cashierDate <= endDate;
            });
        }

        return filtered;
    }, [cashiers, filters]);

    const columns: DataTableColumn<ICashier>[] = useMemo(
        () => [
            {
                key: 'name',
                label: t('cashbox.cashiers.name'),
                sortable: true,
                filterable: true,
                width: '1.5fr',
                align: 'left',
                getValue: (row: ICashier) => row?.name || '',
                renderCell: ({ row }: { row: ICashier }) => (
                    <Box sx={CELL_SX}>
                        {row?.name || '-'}
                    </Box>
                ),
            },
            {
                key: 'created_at',
                label: t('cashbox.cashiers.created_at'),
                sortable: true,
                filterable: true,
                width: '1fr',
                align: 'left',
                getValue: (row: ICashier) =>
                    row?.created_at ? new Date(row.created_at).toLocaleDateString() : '',
                renderCell: ({ row }: { row: ICashier }) => {
                    const dateValue = row?.created_at ? new Date(row.created_at).toLocaleDateString() : '-';
                    return (
                        <Box sx={CELL_SX}>
                            {dateValue}
                        </Box>
                    );
                },
            },
            {
                key: 'actions',
                label: t('common.actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center',
                renderCell: ({ row }: { row: ICashier }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1
                    }}>
                        <IconButton
                            size="small"
                            onClick={() => router.push(`${paths.cashbox.cashiers}/${row.id}/edit`)}
                            sx={{ 
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setDeleteId(row.id);
                                setOpenDeleteDialog(true);
                            }}
                            sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                    backgroundColor: 'error.lighter',
                                    color: 'error.dark'
                                }
                            }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, router]
    );

    const startDateValue = useMemo(() => toPickerDate(draftFilters.start_date), [draftFilters.start_date]);
    const endDateValue = useMemo(() => toPickerDate(draftFilters.end_date), [draftFilters.end_date]);

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
                <DeductionUtilityDataTable
                    persistKey={CASHIERS_TABLE_PERSIST_KEY}
                    data={filteredCashiers}
                    getRowId={(row: ICashier) => String(row?.id)}
                    columns={columns}
                    defaultConfig={{
                        order: ['name', 'created_at', 'actions'],
                        visibility: {
                            name: true,
                            created_at: true,
                            actions: true,
                        },
                        widths: {
                            name: '1.5fr',
                            created_at: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={handleResetFilters}
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
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            href={`${paths.cashbox.cashiers}/new`}
                            size="small"
                        >
                            {t('common.add', 'Add')}
                        </Button>
                    }
                />
            </DashboardContent>

            <CashierDeleteDialog
                open={openDeleteDialog}
                cashierId={deleteId}
                onClose={() => {
                    setOpenDeleteDialog(false);
                    setDeleteId(null);
                }}
                onSuccess={() => {
                    setDeleteId(null);
                }}
            />
        </>
    );
}
