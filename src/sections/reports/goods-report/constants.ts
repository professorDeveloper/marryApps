import type dayjs from 'dayjs';

export const PERSIST_KEY = 'goods-reports-list';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const DATE_RANGES = ['day', 'week', 'month', 'year'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  day: 'D',
  week: 'W',
  month: 'M',
  year: 'Y',
};

export const toApiStartDateTime = (value: dayjs.Dayjs): string =>
  `${value.format('YYYY-MM-DD')}T00:00:00Z`;

export const toApiEndDateTime = (value: dayjs.Dayjs): string =>
  `${value.format('YYYY-MM-DD')}T23:59:59Z`;
