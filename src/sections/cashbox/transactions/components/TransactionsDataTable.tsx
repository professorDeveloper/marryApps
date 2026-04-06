import type { ReactNode } from 'react';
import type { ITransaction } from 'src/types/transactions';
import type { DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

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
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onReset?: () => void;
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
  page = 0,
  rowsPerPage = 20,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  onReset,
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
        width: 150,
        sortable: true,
        getValue: (row) => row.type,
      },
      {
        key: 'amount',
        label: t('common.total', 'Amount'),
        width: 130,
        sortable: true,
        align: 'right',
        mono: true,
        getValue: (row) => Number(row.amount || 0),
        renderCell: ({ value }) => Number(value as number).toLocaleString(),
        total: { aggregation: 'sum' as const },
      },
      {
        key: 'cash_register_id',
        label: t('cashbox.cashiers.title', 'Cash register'),
        width: '1fr',
        minWidth: 180,
        sortable: true,
        getValue: (row) => {
          if (row.type === 'transfer') {
            const fromName = cashRegisterMap[row.from_cash_register_id || ''] || row.from_cash_register_id || '-';
            const toName = cashRegisterMap[row.to_cash_register_id || ''] || row.to_cash_register_id || '-';
            return `${fromName} -> ${toName}`;
          }
          return cashRegisterMap[row.cash_register_id || ''] || row.cash_register_id || '-';
        },
      },
      {
        key: 'group_transaction_id',
        label: t('deductions.group', 'Group'),
        width: '1fr',
        minWidth: 150,
        sortable: true,
        getValue: (row) => groupsMap[row.group_transaction_id] || row.group_transaction_id || '-',
      },
      {
        key: 'user_id',
        label: t('users.fullName', 'User'),
        width: '1fr',
        minWidth: 180,
        sortable: true,
        getValue: (row) => usersMap[row.user_id || ''] || row.user_id || '-',
      },
      {
        key: 'pay_type',
        label: t('common.paymentType', 'Pay type'),
        width: 120,
        sortable: true,
        getValue: (row) => row.pay_type,
      },
      {
        key: 'customer_paid_amount',
        label: t('cashbox.customerPaid', 'Customer paid'),
        width: 150,
        sortable: true,
        align: 'right',
        mono: true,
        getValue: (row) => row.customer_paid_amount ? Number(row.customer_paid_amount) : 0,
        renderCell: ({ value }) => (value ? Number(value).toLocaleString() : '-'),
      },
      {
        key: 'change_amount',
        label: t('cashbox.changeAmount', 'Change'),
        width: 120,
        sortable: true,
        align: 'right',
        mono: true,
        getValue: (row) => row.change_amount ? Number(row.change_amount) : 0,
        renderCell: ({ value }) => (value ? Number(value).toLocaleString() : '-'),
      },
      {
        key: 'date',
        label: t('deductions.date', 'Date'),
        width: 140,
        sortable: true,
        getValue: (row) => (row.date ? new Date(row.date).toLocaleDateString() : ''),
      },
      {
        key: 'description',
        label: t('deductions.description', 'Description'),
        width: '1fr',
        minWidth: 220,
        sortable: true,
        getValue: (row) => row.description,
      },
      {
        key: 'actions',
        label: t('common.actions', 'Actions'),
        width: 110,
        sortable: false,
        filterable: false,
        align: 'center',
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              component={RouterLink}
              href={paths.cashbox.transactionsEdit(row.id)}
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDeleteClick(row.id)}
              sx={{ color: 'error.main' }}
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
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      rowsPerPageOptions={[10, 20, 50, 100]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      onReset={onReset || (() => {})}
      headerActions={headerActions}
      showPeriodPicker={showPeriodPicker}
      periodPickerProps={periodPickerProps}
      showPeriodButtons={showPeriodButtons}
      periodButtonProps={periodButtonProps}
    />
  );
}
