import dayjs from 'dayjs';

/**
 * Convert a dayjs date to UTC day boundary in ISO string format
 * Used for API requests that require day-range filtering
 */
export const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
    const date = new Date(
        Date.UTC(
            value.year(),
            value.month(),
            value.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0
        )
    );

    return date.toISOString().replace('.000Z', 'Z');
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
