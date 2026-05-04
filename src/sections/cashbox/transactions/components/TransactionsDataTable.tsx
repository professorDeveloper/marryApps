import type { ReactNode } from 'react';
import type { ITransaction } from 'src/types/transactions';
import type { DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Chip, IconButton, Tooltip } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { CELL_SX } from 'src/sections/warehouse/deduction/components/utility-data-table/utils/constants';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';

interface TransactionsDataTableProps {
  data: ITransaction[];
  loading: boolean;
  cashRegisterMap: Record<string, string>;
  groupsMap: Record<string, string>;
  usersMap: Record<string, string>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onDeleteClick: (id: string) => void;
  onCreateClick?: () => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onReset?: () => void;
  onSortChange?: (sort: { key: string | null; dir: 'asc' | 'desc' | null }) => void;
  filters?: Record<string, { type: 'text' | 'multi'; value: string | string[] }>;
  onFiltersChange?: (filters: Record<string, { type: 'text' | 'multi'; value: string | string[] }>) => void;
  headerActions?: ReactNode;
  showPeriodPicker?: boolean;
  periodPickerProps?: {
    startDate: Date | null;
    endDate: Date | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
  };
  showPeriodButtons?: boolean;
  periodButtonProps?: {
    activePeriod: 'day' | 'week' | 'month' | 'year';
    onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => void;
  };
}

export function TransactionsDataTable({
  data,
  loading,
  cashRegisterMap,
  groupsMap,
  usersMap,
  searchValue = '',
  onSearchChange,
  onDeleteClick,
  onCreateClick,
  page = 0,
  rowsPerPage = 20,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  onReset,
  onSortChange,
  filters,
  onFiltersChange,
  headerActions,
  showPeriodPicker = false,
  periodPickerProps,
  showPeriodButtons = false,
  periodButtonProps,
}: TransactionsDataTableProps) {
  const { t } = useTranslation('menu');
  const columns = useMemo<DataTableColumn<ITransaction>[]>(
    () => [
      {
        key: 'type',
        label: t('common.type', 'Type'),
        width: 140,
        sortable: true,
        filterable: true,
        getValue: (row) => row.type,
        filter: {
          type: 'multi',
          options: ['income', 'expense', 'transfer', 'bill_payment'],
          getOptionLabel: (v) => {
            const labels: Record<string, string> = {
              income: t('transactions.typeIncome', 'Income'),
              expense: t('transactions.typeExpense', 'Expense'),
              transfer: t('transactions.typeTransfer', 'Transfer'),
              bill_payment: t('transactions.typeBillPayment', 'Bill Payment'),
            };
            return labels[v] || v;
          },
        },
        renderCell: ({ row }) => {
          const typeConfig: Record<string, { label: string; color: 'success' | 'error' | 'info' | 'warning' }> = {
            income: { label: t('transactions.typeIncome', 'Income'), color: 'success' },
            expense: { label: t('transactions.typeExpense', 'Expense'), color: 'error' },
            transfer: { label: t('transactions.typeTransfer', 'Transfer'), color: 'info' },
            bill_payment: { label: t('transactions.typeBillPayment', 'Bill Payment'), color: 'warning' },
          };
          const config = typeConfig[row.type];
          return (
            <Box sx={{ ...CELL_SX, justifyContent: 'center' }}>
              {config ? (
                <Chip size="small" color={config.color} label={config.label} />
              ) : (
                row.type || '-'
              )}
            </Box>
          );
        },
      },
      {
        key: 'amount',
        label: t('common.total', 'Amount'),
        width: 130,
        sortable: true,
        align: 'right',
        mono: true,
        getValue: (row) => Number(row.amount || 0),
        renderCell: ({ value }) => {
          const amountValue = Number(value as number).toLocaleString();
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {amountValue}
            </Box>
          );
        },
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'cash_register_id',
        label: t('cashbox.cashiers.title', 'Cash register'),
        width: '1fr',
        minWidth: 180,
        sortable: true,
        filterable: true,
        getValue: (row) => {
          if (row.type === 'transfer') {
            const fromName = cashRegisterMap[row.from_cash_register_id || ''] || row.from_cash_register_id || '-';
            const toName = cashRegisterMap[row.to_cash_register_id || ''] || row.to_cash_register_id || '-';
            return `${fromName} -> ${toName}`;
          }
          return cashRegisterMap[row.cash_register_id || ''] || row.cash_register_id || '-';
        },
        filter: {
          type: 'multi',
          options: Object.keys(cashRegisterMap),
          getOptionLabel: (v) => cashRegisterMap[v] || v,
        },
        renderCell: ({ row }) => {
          if (row.type === 'transfer') {
            const fromName = cashRegisterMap[row.from_cash_register_id || ''] || row.from_cash_register_id || '-';
            const toName = cashRegisterMap[row.to_cash_register_id || ''] || row.to_cash_register_id || '-';
            const registerValue = `${fromName} -> ${toName}`;
            return (
              <Tooltip title={registerValue} placement="top" arrow>
                <Box sx={{
                  ...CELL_SX,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>
                  {registerValue}
                </Box>
              </Tooltip>
            );
          }

          const mappedName = cashRegisterMap[row.cash_register_id || ''];
          if (mappedName) {
            return (
              <Tooltip title={mappedName} placement="top" arrow>
                <Box sx={{
                  ...CELL_SX,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>
                  {mappedName}
                </Box>
              </Tooltip>
            );
          }

          // Cashier not found (deleted) - show info icon chip
          if (row.cash_register_id) {
            const deletedTooltip = t('cashbox.cashierDeleted', 'This cashier has been deleted. The reference is preserved for historical records but the cashier details are no longer available.');
            return (
              <Tooltip title={deletedTooltip} placement="top" arrow>
                <Chip
                  size="small"
                  color="info"
                  icon={<Iconify icon="solar:info-circle-bold" width={18} />}
                  sx={{ cursor: 'help', '& .MuiChip-label': { display: 'none' } }}
                />
              </Tooltip>
            );
          }

          return (
            <Box sx={CELL_SX}>
              {'-'}
            </Box>
          );
        },
      },
      {
        key: 'group_transaction_id',
        label: t('deductions.group', 'Group'),
        width: '1fr',
        minWidth: 150,
        sortable: true,
        filterable: true,
        getValue: (row) => groupsMap[row.group_transaction_id] || row.group_transaction_id || '-',
        filter: {
          type: 'multi',
          options: Object.keys(groupsMap),
          getOptionLabel: (v) => groupsMap[v] || v,
        },
        renderCell: ({ row }) => {
          const mappedName = groupsMap[row.group_transaction_id || ''];
          const displayValue = mappedName || '-';
          const tooltipValue = mappedName || row.group_transaction_id || '-';
          return (
            <Tooltip title={tooltipValue} placement="top" arrow>
              <Box sx={{
                ...CELL_SX,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {displayValue}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        key: 'user_id',
        label: t('users.fullName', 'User'),
        width: '1fr',
        minWidth: 180,
        sortable: false,
        getValue: (row) => usersMap[row.user_id || ''] || row.user_id || '-',
        renderCell: ({ row }) => {
          const mappedName = usersMap[row.user_id || ''];
          const displayValue = mappedName || (row.user_id ? row.user_id.slice(0, 8) + '...' : '-');
          const tooltipValue = mappedName || row.user_id || '-';
          return (
            <Tooltip title={tooltipValue} placement="top" arrow>
              <Box sx={{
                ...CELL_SX,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}>
                {displayValue}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        key: 'pay_type',
        label: t('common.paymentType', 'Pay type'),
        width: 120,
        sortable: true,
        filterable: true,
        getValue: (row) => row.pay_type,
        filter: {
          type: 'multi',
          options: ['cash', 'card', 'transfer'],
          getOptionLabel: (v) => {
            const labels: Record<string, string> = {
              cash: t('paymentTypes.cash', 'Cash'),
              card: t('paymentTypes.card', 'Card'),
              transfer: t('paymentTypes.transfer', 'Transfer'),
            };
            return labels[v] || v;
          },
        },
        renderCell: ({ row }) => {
          const payTypeLabels: Record<string, string> = {
            cash: t('paymentTypes.cash', 'Cash'),
            card: t('paymentTypes.card', 'Card'),
            transfer: t('paymentTypes.transfer', 'Transfer'),
          };
          const label = payTypeLabels[row.pay_type || ''] || row.pay_type;
          return (
            <Box sx={{ ...CELL_SX, justifyContent: 'center' }}>
              {row.pay_type ? (
                <Chip size="small" variant="outlined" label={label} />
              ) : (
                '-'
              )}
            </Box>
          );
        },
      },
      {
        key: 'customer_paid_amount',
        label: t('cashbox.customerPaid', 'Customer paid'),
        width: 150,
        sortable: false,
        align: 'right',
        mono: true,
        getValue: (row) => row.customer_paid_amount != null ? Number(row.customer_paid_amount) : undefined,
        renderCell: ({ row, value }) => {
          if (row.customer_paid_amount == null) return <Box sx={CELL_SX}>-</Box>;
          const paidValue = Number(value).toLocaleString();
          return (
            <Box sx={CELL_SX}>
              {paidValue}
            </Box>
          );
        },
      },
      {
        key: 'change_amount',
        label: t('cashbox.changeAmount', 'Change'),
        width: 120,
        sortable: false,
        align: 'right',
        mono: true,
        getValue: (row) => row.change_amount != null ? Number(row.change_amount) : undefined,
        renderCell: ({ row, value }) => {
          if (row.change_amount == null) return <Box sx={CELL_SX}>-</Box>;
          const changeValue = Number(value).toLocaleString();
          return (
            <Box sx={CELL_SX}>
              {changeValue}
            </Box>
          );
        },
      },
      {
        key: 'date',
        label: t('deductions.date', 'Date'),
        width: 140,
        sortable: true,
        getValue: (row) => (row.date ? new Date(row.date).toLocaleDateString() : ''),
        renderCell: ({ row }) => {
          const dateValue = row.date ? new Date(row.date).toLocaleDateString() : '-';
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 1.5, 
              px: 1,
              color: 'text.primary',
              fontSize: '0.875rem',
              fontWeight: 400
            }}>
              {dateValue}
            </Box>
          );
        },
      },
      {
        key: 'description',
        label: t('deductions.description', 'Description'),
        width: '1fr',
        minWidth: 220,
        sortable: false,
        getValue: (row) => row.description,
        renderCell: ({ row }) => {
          const description = row.description || '-';
          return (
            <Tooltip title={description} placement="top" arrow>
              <Box
                sx={{
                  ...CELL_SX,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {description}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        key: 'actions',
        label: t('common.actions', 'Actions'),
        width: 110,
        sortable: false,
        filterable: false,
        align: 'center',
        renderCell: ({ row }) => (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            alignItems: 'center', 
            py: 1.5, 
            px: 1
          }}>
            <IconButton
              size="small"
              component={RouterLink}
              href={paths.cashbox.transactionsEdit(row.id)}
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
              onClick={() => onDeleteClick(row.id)}
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
    [cashRegisterMap, groupsMap, t, usersMap, onDeleteClick]
  );

  return (
    <DataTable<ITransaction>
      persistKey="cashbox-transactions-list"
      data={data}
      columns={columns}
      defaultConfig={{
        order: ['type', 'amount', 'cash_register_id', 'group_transaction_id', 'user_id', 'pay_type', 'customer_paid_amount', 'change_amount', 'date', 'description', 'actions'],
        visibility: {
          type: true,
          amount: true,
          cash_register_id: true,
          group_transaction_id: true,
          user_id: true,
          pay_type: true,
          customer_paid_amount: true,
          change_amount: true,
          date: true,
          description: true,
          actions: true,
        },
        widths: {
          type: 150,
          amount: 130,
          cash_register_id: '1fr',
          group_transaction_id: '1fr',
          user_id: '1fr',
          pay_type: 120,
          customer_paid_amount: 150,
          change_amount: 120,
          date: 140,
          description: '1fr',
          actions: 110,
        },
      }}
      getRowId={(row) => String(row.id)}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onSortChange={onSortChange}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      rowsPerPageOptions={[10, 20, 50, 100]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      onReset={onReset || (() => {})}
      headerActions={
        onCreateClick ? (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={onCreateClick}
            size="small"
          >
            {t('transactions.createTransaction', 'Create Transaction')}
          </Button>
        ) : (
          headerActions
        )
      }
      showPeriodPicker={showPeriodPicker}
      periodPickerProps={periodPickerProps}
      showPeriodButtons={showPeriodButtons}
      periodButtonProps={periodButtonProps}
    />
  );
}
