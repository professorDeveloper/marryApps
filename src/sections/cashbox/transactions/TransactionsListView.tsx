import type { ITransaction, TransactionFilters } from 'src/types/transactions';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import {
  Dialog,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useTransactionsAPI } from 'src/hooks/use-transactions-api';

import { DashboardContent } from 'src/layouts/dashboard';

import { TransactionsDataTable } from './components/TransactionsDataTable';

const getTodayUtcBoundary = (endOfDay = false): string => {
  const now = dayjs();
  const year = now.year();
  const month = String(now.month() + 1).padStart(2, '0');
  const day = String(now.date()).padStart(2, '0');

  if (endOfDay) {
    const date = now.add(1, 'day');
    return `${date.year()}-${String(date.month() + 1).padStart(2, '0')}-${String(date.date()).padStart(2, '0')}`;
  }

  return `${year}-${month}-${day}`;
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
  const now = dayjs().add(1, 'day');
  const year = now.year();
  const month = String(now.month() + 1).padStart(2, '0');
  const day = String(now.date()).padStart(2, '0');

  if (endOfDay) {
    const date = now.add(1, 'day');
    return `${date.year()}-${String(date.month() + 1).padStart(2, '0')}-${String(date.date()).padStart(2, '0')}`;
  }

  return `${year}-${month}-${day}`;
};

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const year = value.year();
  const month = String(value.month() + 1).padStart(2, '0');
  const day = String(value.date()).padStart(2, '0');

  if (endOfDay) {
    const date = value.add(1, 'day');
    return `${date.year()}-${String(date.month() + 1).padStart(2, '0')}-${String(date.date()).padStart(2, '0')}`;
  }

  return `${year}-${month}-${day}`;
};

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null);

const getInitialFilters = (): TransactionFilters => {
  const today = dayjs();

  return {
    date_from: getTodayUtcBoundary(),
    date_to: getTomorrowUtcBoundary(true),
    type: '',
    cash_register_id: '',
    group_transaction_id: '',
    search: '',
    sort_by: '',
    sort_order: '',
  };
};

const INITIAL_FILTERS: TransactionFilters = getInitialFilters();

export function TransactionsListView() {
  const { t } = useTranslation('menu');
  const navigate = useNavigate();
  const {
    getTransactions,
    deleteTransaction,
    getTransactionGroups,
    getCashRegisters,
    getBranches,
    getStaffUsers,
  } = useTransactionsAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ITransaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(getInitialFilters);
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [cashRegisterMap, setCashRegisterMap] = useState<Record<string, string>>({});
  const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
  const [columnFilters, setColumnFilters] = useState<Record<string, { type: 'text' | 'multi'; value: string | string[] }>>({});

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Set default date range on component mount
  useEffect(() => {
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
  }, []);

  // Apply search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearchQuery,
    }));
  }, [debouncedSearchQuery]);

  // Apply sort changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortState.key || '',
      sort_order: sortState.dir || '',
    }));
  }, [sortState]);

  // Apply column filter changes
  useEffect(() => {
    const getFilterValue = (value: unknown): string => {
      if (Array.isArray(value)) return value.join(',');
      if (typeof value === 'string') return value;
      return '';
    };

    setFilters((prev) => ({
      ...prev,
      type: getFilterValue(columnFilters.type?.value),
      pay_type: getFilterValue(columnFilters.pay_type?.value),
      cash_register_id: getFilterValue(columnFilters.cash_register_id?.value),
      group_transaction_id: getFilterValue(columnFilters.group_transaction_id?.value),
    }));
  }, [columnFilters]);

  // Apply date range changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      date_from: startDate ? toUtcDayBoundary(startDate) : '',
      date_to: endDate ? toUtcDayBoundary(endDate, true) : '',
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

  const loadData = useCallback(
    async (nextFilters: TransactionFilters = {}) => {
      setLoading(true);
      try {
        const [transactions, groups, cashRegisters, branches, users] = await Promise.all([
          getTransactions(nextFilters),
          getTransactionGroups(),
          getCashRegisters(),
          getBranches(),
          getStaffUsers(),
        ]);

        setRows(transactions);
        setGroupsMap(
          groups.reduce(
            (acc, item) => ({
              ...acc,
              [item.id]: item.name || item.id,
            }),
            {} as Record<string, string>
          )
        );
        setCashRegisterMap(
          cashRegisters.reduce(
            (acc, item) => ({
              ...acc,
              [item.id]: item.name || item.id,
            }),
            {} as Record<string, string>
          )
        );
        setBranchesMap(
          branches.reduce(
            (acc, item) => ({
              ...acc,
              [item.id]: item.name || item.id,
            }),
            {} as Record<string, string>
          )
        );
        setUsersMap(
          users.reduce(
            (acc, item) => ({
              ...acc,
              [item.id]: item.full_name || item.username || item.id,
            }),
            {} as Record<string, string>
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [getBranches, getCashRegisters, getStaffUsers, getTransactionGroups, getTransactions]
  );

  useEffect(() => {
    loadData(INITIAL_FILTERS);
  }, [loadData]);

  // Auto-apply filters when any filter changes
  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    await deleteTransaction(deleteId);
    setOpenConfirm(false);
    setDeleteId(null);
    await loadData(filters);
  }, [deleteId, deleteTransaction, filters, loadData]);

  const handleResetFilters = useCallback(() => {
    setFilters(getInitialFilters());
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortState({ key: null, dir: null });
    setColumnFilters({});
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setActiveRange('day');
  }, []);

  const handleSortChange = useCallback((sort: { key: string | null; dir: 'asc' | 'desc' | null }) => {
    setSortState({ key: sort.key, dir: sort.dir });
  }, []);

  const handleFiltersChange = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
    setOpenConfirm(true);
  }, []);

  const handleCreateClick = useCallback(() => {
    navigate(paths.cashbox.transactionsNew);
  }, [navigate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

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
        <TransactionsDataTable
          data={rows}
          loading={loading}
          cashRegisterMap={cashRegisterMap}
          groupsMap={groupsMap}
          usersMap={usersMap}
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onDeleteClick={handleDeleteClick}
          onCreateClick={handleCreateClick}
          onReset={handleResetFilters}
          filters={columnFilters}
          onFiltersChange={setColumnFilters}
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
        />
      </DashboardContent>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>{t('common.confirmDelete', 'Confirm Delete')}</DialogTitle>
        <DialogContent>
          <p>{t('common.deleteConfirmation', 'Are you sure you want to delete this transaction?')}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} variant="outlined">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
