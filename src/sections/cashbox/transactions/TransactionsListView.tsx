import type { ITransaction, TransactionFilters } from 'src/types/transactions';

import dayjs from 'dayjs';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Dialog,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useTimeFilter } from 'src/hooks/use-time-filter';
import { useTransactionsAPI } from 'src/hooks/use-transactions-api';

import { DashboardContent } from 'src/layouts/dashboard';

import { toUtcDayBoundary } from './utils/date-utils';
import { TransactionsDataTable } from './components/TransactionsDataTable';

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
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [cashRegisterMap, setCashRegisterMap] = useState<Record<string, string>>({});
  const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { startDate, endDate, activePeriod: activeRange, setDates, applyRange, reset: resetTimeFilter } = useTimeFilter();
  const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
  const [columnFilters, setColumnFilters] = useState<Record<string, { type: 'text' | 'multi'; value: string | string[] }>>({});

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Derive the active filters from search/sort/column/date state.
  // Combining these into one memo (instead of separate effects that each
  // call setFilters) avoids cascading re-renders that each re-trigger loadData.
  const filters = useMemo<TransactionFilters>(() => {
    const getFilterValue = (value: unknown): string => {
      if (Array.isArray(value)) return value.join(',');
      if (typeof value === 'string') return value;
      return '';
    };

    return {
      search: debouncedSearchQuery,
      sort_by: sortState.key || '',
      sort_order: sortState.dir || '',
      type: getFilterValue(columnFilters.type?.value),
      pay_type: getFilterValue(columnFilters.pay_type?.value),
      cash_register_id: getFilterValue(columnFilters.cash_register_id?.value),
      group_transaction_id: getFilterValue(columnFilters.group_transaction_id?.value),
      date_from: startDate ? toUtcDayBoundary(startDate) : '',
      date_to: endDate ? toUtcDayBoundary(endDate, true) : '',
    };
  }, [debouncedSearchQuery, sortState, columnFilters, startDate, endDate]);

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

  // Load data whenever the derived filters change (including on mount)
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
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortState({ key: null, dir: null });
    setColumnFilters({});
    resetTimeFilter();
  }, [resetTimeFilter]);

  const handleSortChange = useCallback((sort: { key: string | null; dir: 'asc' | 'desc' | null }) => {
    setSortState({ key: sort.key, dir: sort.dir });
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
          search={{ value: searchQuery, onChange: handleSearchChange }}
          onSortChange={handleSortChange}
          onDeleteClick={handleDeleteClick}
          onCreateClick={handleCreateClick}
          onReset={handleResetFilters}
          filters={columnFilters}
          onFiltersChange={setColumnFilters}
          periodFilter={{
            startDate: startDate ? startDate.toDate() : null,
            endDate: endDate ? endDate.toDate() : null,
            onStartDateChange: (date: Date | null) => {
              setDates(date ? dayjs(date) : null, endDate, 'day');
            },
            onEndDateChange: (date: Date | null) => {
              setDates(startDate, date ? dayjs(date) : null, 'day');
            },
            activePeriod: activeRange,
            onPeriodChange: applyRange,
          }}
        />
      </DashboardContent>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <p>{t('common.deleteConfirmation')}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} variant="outlined">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
