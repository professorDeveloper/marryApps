import type { GridColDef } from '@mui/x-data-grid';
import type { ITransaction, TransactionFilters } from 'src/types/transactions';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTransactionsAPI } from 'src/hooks/use-transactions-api';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

const INITIAL_FILTERS: TransactionFilters = {
  date_from: '',
  date_to: '',
  type: '',
  cash_register_id: '',
  group_id: '',
};

export function TransactionsListView() {
  const { t } = useTranslation('menu');
  const { getTransactions, deleteTransaction, getTransactionGroups, getCashRegisters } = useTransactionsAPI();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ITransaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(INITIAL_FILTERS);
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({});
  const [cashRegisterMap, setCashRegisterMap] = useState<Record<string, string>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  const loadData = useCallback(
    async (nextFilters: TransactionFilters = {}) => {
      setLoading(true);
      try {
        const [transactions, groups, cashRegisters] = await Promise.all([
          getTransactions(nextFilters),
          getTransactionGroups(),
          getCashRegisters(),
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
      } finally {
        setLoading(false);
      }
    },
    [getCashRegisters, getTransactionGroups, getTransactions]
  );

  useEffect(() => {
    loadData(INITIAL_FILTERS);
  }, [loadData]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    await deleteTransaction(deleteId);
    setOpenConfirm(false);
    setDeleteId(null);
    await loadData(filters);
  }, [deleteId, deleteTransaction, filters, loadData]);

  const handleApplyFilters = useCallback(async () => {
    await loadData(filters);
  }, [filters, loadData]);

  const handleResetFilters = useCallback(async () => {
    setFilters(INITIAL_FILTERS);
    await loadData(INITIAL_FILTERS);
  }, [loadData]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'type',
        headerName: t('common.type', 'Type'),
        width: 150,
      },
      {
        field: 'amount',
        headerName: t('common.total', 'Amount'),
        width: 130,
        renderCell: (params) => Number(params.row.amount || 0).toLocaleString(),
      },
      {
        field: 'cash_register_id',
        headerName: t('cashbox.cashiers.title', 'Cash register'),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          if (params.row.type === 'transfer') {
            const fromName =
              cashRegisterMap[params.row.from_cash_register_id] || params.row.from_cash_register_id || '-';
            const toName = cashRegisterMap[params.row.to_cash_register_id] || params.row.to_cash_register_id || '-';
            return `${fromName} -> ${toName}`;
          }
          return cashRegisterMap[params.row.cash_register_id] || params.row.cash_register_id || '-';
        },
      },
      {
        field: 'group_transaction_id',
        headerName: t('deductions.group', 'Group'),
        flex: 1,
        minWidth: 150,
        renderCell: (params) =>
          groupsMap[params.row.group_transaction_id] || params.row.group_transaction_id || '-',
      },
      {
        field: 'pay_type',
        headerName: t('common.paymentType', 'Pay type'),
        width: 120,
      },
      {
        field: 'date',
        headerName: t('deductions.date', 'Date'),
        width: 140,
        renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
      },
      {
        field: 'description',
        headerName: t('deductions.description', 'Description'),
        flex: 1,
        minWidth: 220,
      },
      {
        type: 'actions',
        field: 'actions',
        headerName: t('common.actions', 'Actions'),
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          <CustomGridActionsCellItem
            key="edit"
            icon={<Iconify icon="solar:pen-bold" />}
            label={t('common.edit', 'Edit')}
            href={paths.cashbox.transactionsEdit(params.row.id)}
          />,
          <CustomGridActionsCellItem
            key="delete"
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            label={t('common.delete', 'Delete')}
            style={{ color: '#FB6633' }}
            onClick={() => {
              setDeleteId(params.row.id);
              setOpenConfirm(true);
            }}
          />,
        ],
      },
    ],
    [cashRegisterMap, groupsMap, t]
  );

  const renderFilters = useCallback(
    () => (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5 }}>
        {/* Start Date */}
        <DatePicker
          label={t('ingredientReports.startDate', 'Start date')}
          value={filters.date_from ? dayjs(filters.date_from) : null}
          onChange={(date) => setFilters((prev) => ({ ...prev, date_from: date ? date.format('YYYY-MM-DD') : '' }))}
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
          label={t('ingredientReports.endDate', 'End date')}
          value={filters.date_to ? dayjs(filters.date_to) : null}
          onChange={(date) => setFilters((prev) => ({ ...prev, date_to: date ? date.format('YYYY-MM-DD') : '' }))}
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

        {/* Type */}
        <FormControl fullWidth size="small">
          <InputLabel>{t('common.type', 'Type')}</InputLabel>
          <Select
            value={filters.type || ''}
            label={t('common.type', 'Type')}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value as any }))}
          >
            <MenuItem value="">
              <em>{t('ingredientReports.all', 'All')}</em>
            </MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
          </Select>
        </FormControl>

        {/* Cash Register */}
        <FormControl fullWidth size="small">
          <InputLabel>{t('cashbox.cashiers.title', 'Cash register')}</InputLabel>
          <Select
            value={filters.cash_register_id || ''}
            label={t('cashbox.cashiers.title', 'Cash register')}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, cash_register_id: event.target.value }))
            }
          >
            <MenuItem value="">
              <em>{t('ingredientReports.all', 'All')}</em>
            </MenuItem>
            {Object.entries(cashRegisterMap).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Group */}
        <FormControl fullWidth size="small">
          <InputLabel>{t('deductions.group', 'Group')}</InputLabel>
          <Select
            value={filters.group_id || ''}
            label={t('deductions.group', 'Group')}
            onChange={(event) => setFilters((prev) => ({ ...prev, group_id: event.target.value }))}
          >
            <MenuItem value="">
              <em>{t('ingredientReports.all', 'All')}</em>
            </MenuItem>
            {Object.entries(groupsMap).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilters}
            fullWidth
          >
            {t('bills.reset', 'Reset')}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyFilters}
            fullWidth
          >
            {t('bills.apply', 'Apply')}
          </Button>
        </Box>
      </Box>
    ),
    [cashRegisterMap, filters.cash_register_id, filters.date_from, filters.date_to, filters.group_id, filters.type, groupsMap, handleApplyFilters, handleResetFilters, t]
  );

  return (
    <>
      <GenericTableView
        data={rows}
        columns={columns}
        loading={loading}
        hideCheckboxes
        hideFilters
        breadcrumbs={{
          heading: t('cashbox.sidebar.transactions', 'Transactions'),
          links: [
            { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
            { name: t('cashbox.sidebar.title', 'Cashbox'), href: paths.cashbox.root },
            { name: t('cashbox.sidebar.transactions', 'Transactions') },
          ],
        }}
        headerActions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              component={RouterLink}
              href={`${paths.cashbox.transactionsNew}?kind=income`}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add income
            </Button>
            <Button
              component={RouterLink}
              href={`${paths.cashbox.transactionsNew}?kind=expense`}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add expense
            </Button>
            <Button
              component={RouterLink}
              href={`${paths.cashbox.transactionsNew}?kind=transfer`}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add transfer
            </Button>
          </Stack>
        }
        renderFilters={renderFilters}
      />

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('common.deleteConfirmTitle', 'Confirm delete')}</DialogTitle>
        <DialogContent>{t('common.deleteConfirmMessage', 'Are you sure?')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
