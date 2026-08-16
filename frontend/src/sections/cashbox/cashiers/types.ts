import type { ICashier } from 'src/types/cashbox';

export type { ICashier };

export interface CashierFilters {
    search: string;
    start_date: string;
    end_date: string;
}
