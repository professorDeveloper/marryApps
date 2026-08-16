import { getTodayUtcBoundary } from '../utils/date-utils';

export const CASHIERS_TABLE_PERSIST_KEY = 'cashbox-cashiers';

export const INITIAL_CASHIER_FILTERS = {
    search: '',
    start_date: getTodayUtcBoundary(),
    end_date: getTodayUtcBoundary(true),
};
