import type dayjs from 'dayjs';
import type { DateRange } from './constants';

export interface GoodsReportFilters {
  start_date: string;
  end_date: string;
  department_id: string;
  category_id: string;
  good_id: string;
  waiter_id: string;
  hall_id: string;
  table_id: string;
  limit: number;
  offset: number;
}

export interface GoodsReportFiltersProps {
  filters: GoodsReportFilters;
  activeRange: DateRange;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  onStartDateChange: (value: dayjs.Dayjs | null) => void;
  onEndDateChange: (value: dayjs.Dayjs | null) => void;
  onRangeChange: (range: DateRange) => void;
  onFilterChange: (updates: Record<string, string>) => void;
  onReset: () => void;
}
