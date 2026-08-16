import type { TransactionReportResponse } from 'src/types/transactions';

export const FALLBACK_REPORT: TransactionReportResponse = {
  balance: { card_total: '0', cash_total: '0', total: '0', type: '' },
  closing_balance: '0',
  day_balance: '0',
  expense_groups: [],
  income_groups: [],
  opening_balance: '0',
  summary: [],
  total_expense: '0',
  total_income: '0',
};

export const sectionActionsSx = {
  minWidth: 86,
  bgcolor: (theme: any) => (theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white),
  color: (theme: any) => (theme.palette.mode === 'light' ? theme.palette.common.white : theme.palette.common.black),
  '&:hover': {
    bgcolor: (theme: any) => (theme.palette.mode === 'light' ? theme.palette.grey[800] : theme.palette.grey[200]),
  },
} as const;
