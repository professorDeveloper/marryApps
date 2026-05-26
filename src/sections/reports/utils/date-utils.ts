import dayjs from 'dayjs';

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

export const getTodayUtcBoundary = (endOfDay = false): string => {
  const today = dayjs();
  return toUtcDayBoundary(today, endOfDay);
};

export const getTomorrowUtcBoundary = (endOfDay = false): string => {
  const tomorrow = dayjs().add(1, 'day');
  return toUtcDayBoundary(tomorrow, endOfDay);
};

export const toPickerDate = (value?: string): dayjs.Dayjs | null =>
  value ? dayjs(value.slice(0, 10)) : null;
