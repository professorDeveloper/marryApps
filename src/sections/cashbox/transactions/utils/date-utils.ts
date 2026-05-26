import type { TransactionFilters } from 'src/types/transactions';

import dayjs from 'dayjs';

export const getTodayUtcBoundary = (endOfDay = false): string => {
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

export const getTomorrowUtcBoundary = (endOfDay = false): string => {
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

export const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const year = value.year();
  const month = String(value.month() + 1).padStart(2, '0');
  const day = String(value.date()).padStart(2, '0');

  if (endOfDay) {
    const date = value.add(1, 'day');
    return `${date.year()}-${String(date.month() + 1).padStart(2, '0')}-${String(date.date()).padStart(2, '0')}`;
  }

  return `${year}-${month}-${day}`;
};

export const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null);

export const getInitialFilters = (): TransactionFilters => ({
  date_from: getTodayUtcBoundary(),
  date_to: getTomorrowUtcBoundary(true),
  type: '',
  cash_register_id: '',
  group_transaction_id: '',
  search: '',
  sort_by: '',
  sort_order: '',
});
