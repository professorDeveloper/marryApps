import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc' | null;
export type TotalAggregation = 'sum' | 'avg' | 'count' | 'custom';

export type ColumnFilter<T> =
  | { type: 'text'; value: string }
  | { type: 'multi'; value: string[]; options?: string[]; getOptionLabel?: (v: string) => string };

export type ColumnTotalRule<T> =
  | {
      aggregation: Exclude<TotalAggregation, 'custom'>;
      format?: (value: number) => string;
      label?: string;
    }
  | {
      aggregation: 'custom';
      compute: (rows: T[]) => string | number;
      label?: string;
    };

export interface DataTableColumn<T> {
  key: string;
  label: string;
  /** Width in px (number) or CSS value like '20%', '1fr', 'minmax(120px, 1fr)' */
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  /** Default visible (if omitted, default true). */
  defaultVisible?: boolean;

  /** Dense “specialist tool” alignment; numbers/dates should set `mono`. */
  align?: 'left' | 'center' | 'right';
  mono?: boolean;

  /** Header interactions */
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  toggleable?: boolean;
  reorderable?: boolean;

  /** Value + rendering */
  getValue?: (row: T) => unknown;
  renderCell?: (args: { row: T; value: unknown }) => ReactNode;
  renderEdit?: (args: {
    row: T;
    value: unknown;
    onCommit: (next: unknown) => void;
    onCancel: () => void;
  }) => ReactNode;

  /** Filter UI behavior */
  filter?: {
    type: 'text' | 'multi';
    placeholder?: string;
    /** For multi-select filters (optional; falls back to unique values from `data`) */
    options?: string[];
    /** For multi-select filters (optional) */
    getOptionLabel?: (v: string) => string;
    /** For multi-select filters: max number of options that can be selected (default: 1) */
    maxSelections?: number;
  };

  /** Totals footer behavior */
  total?: ColumnTotalRule<T>;
}

export interface DataTableDefaultConfig {
  order: string[];
  visibility: Record<string, boolean>;
  widths?: Record<string, number | string>;
}

export interface PersistedDataTableConfig {
  version: number;
  order: string[];
  visibility: Record<string, boolean>;
  widths: Record<string, number | string>;
}

export interface StorageStrategy {
  load: (key: string) => PersistedDataTableConfig | null;
  save: (key: string, config: PersistedDataTableConfig) => void;
  clear: (key: string) => void;
}

export interface BatchAction<T> {
  label: string;
  icon?: ReactNode;
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (selectedRows: T[]) => void;
}

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
}

export interface SortState {
  key: string | null;
  dir: SortDirection;
}

