import dayjs from 'dayjs';

/**
 * Convert a dayjs date to UTC day boundary in ISO string format
 * Used for API requests that require day-range filtering
 */
export const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
    const year = value.year();
    const month = String(value.month() + 1).padStart(2, '0');
    const day = String(value.date()).padStart(2, '0');

    // For endOfDay, add one day to include the full end date
    if (endOfDay) {
        const date = value.add(1, 'day');
        return `${date.year()}-${String(date.month() + 1).padStart(2, '0')}-${String(date.date()).padStart(2, '0')}`;
    }

    return `${year}-${month}-${day}`;
};

/**
 * Get today's UTC boundary in ISO string format
 */
export const getTodayUtcBoundary = (endOfDay = false): string => {
    const now = dayjs();
    return toUtcDayBoundary(now, endOfDay);
};

/**
 * Get tomorrow's UTC boundary in ISO string format
 */
export const getTomorrowUtcBoundary = (endOfDay = false): string => {
    const tomorrow = dayjs().add(1, 'day');
    return toUtcDayBoundary(tomorrow, endOfDay);
};

/**
 * Convert ISO date string to dayjs picker date
 */
export const toPickerDate = (value?: string): dayjs.Dayjs | null =>
    value ? dayjs(value.slice(0, 10)) : null;
