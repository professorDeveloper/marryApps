import type { ReactNode } from 'react';

export type FilterState = Record<string, { type: 'text' | 'multi'; value: string | string[] }>;

export type DataTableProps<T> = {
  persistKey: string;
  data: T[];
  columns: Array<any>; // DataTableColumn<T> from main types
  defaultConfig: any; // DataTableDefaultConfig from main types
  onReset: () => void;

  headerActions?: ReactNode;

  showPeriodPicker?: boolean;
  periodPickerProps?: {
    startDate?: Date | null;
    endDate?: Date | null;
    onStartDateChange?: (date: Date | null) => void;
    onEndDateChange?: (date: Date | null) => void;
  };
  showPeriodButtons?: boolean;
  periodButtonProps?: {
    activePeriod?: 'day' | 'week' | 'month' | 'year';
    onPeriodChange?: (period: 'day' | 'week' | 'month' | 'year') => void;
  };

  showRowNumbers?: boolean;
  batchActions?: Array<any>; // BatchAction<T> from main types
  rowActions?: Array<any>; // RowAction<T> from main types
  getRowId: (row: T) => string;
  onCellEdit?: (args: { row: T; key: string; value: unknown }) => void | Promise<void>;
  storageStrategy?: any; // StorageStrategy from main types

  searchValue?: string;
  onSearchChange?: (value: string) => void;

  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  rowsPerPageOptions?: number[];
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;

  emptyTitle?: string;
  emptySubtitle?: string;
};
