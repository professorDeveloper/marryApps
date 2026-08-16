import type { TransactionReportResponse } from 'src/types/transactions';

export const toNumber = (value?: string) => Number(value || 0);

export const toNumberText = (value?: string) => toNumber(value).toLocaleString();

export const toApiDateTime = (value: import('dayjs').Dayjs) => value.format('YYYY-MM-DDTHH:mm:ssZ');

export function normalizeReport(
  input: Partial<TransactionReportResponse> | null | undefined
): TransactionReportResponse {
  return {
    balance: {
      card_total: input?.balance?.card_total ?? '0',
      cash_total: input?.balance?.cash_total ?? '0',
      total: input?.balance?.total ?? '0',
      type: input?.balance?.type ?? '',
    },
    closing_balance: input?.closing_balance ?? '0',
    day_balance: input?.day_balance ?? '0',
    expense_groups: Array.isArray(input?.expense_groups) ? input.expense_groups : [],
    income_groups: Array.isArray(input?.income_groups) ? input.income_groups : [],
    opening_balance: input?.opening_balance ?? '0',
    summary: Array.isArray(input?.summary) ? input.summary : [],
    total_expense: input?.total_expense ?? '0',
    total_income: input?.total_income ?? '0',
  };
}

export function buildCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (value: string | number) => {
    const normalized = String(value ?? '');
    if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  const csv = [headers.join(','), ...rows.map((row) => row.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
