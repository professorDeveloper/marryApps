import type { ReactNode } from 'react';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';

// ---------------------------------------------------------------------------
// Column configuration
// ---------------------------------------------------------------------------

/** Extra metadata for configurable-list columns */
export interface CLColumnMeta {
  /** Whether this column can be toggled visible/hidden (default: true) */
  clHideable?: boolean;
  /** Whether this column can be reordered via drag-and-drop (default: true) */
  reorderable?: boolean;
  /** Column group label — used for visual grouping in the manager panel */
  group?: string;
}

/** Column definition = standard MUI GridColDef + configurable-list extras */
export type CLColumnDef<R extends Record<string, any> = any> = GridColDef<R> & CLColumnMeta;

/** Runtime state of a single column persisted to storage */
export interface PersistedColumnState {
  field: string;
  visible: boolean;
  width?: number;
  orderIndex: number;
}

/** Full persisted config stored per list-view instance */
export interface PersistedListConfig {
  columns: PersistedColumnState[];
  version: number;
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

export type TotalAggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'custom';

export interface TotalRule<R = any> {
  /** Column field this total applies to */
  field: string;
  /** Aggregation type */
  aggregation: TotalAggregation;
  /** Custom aggregation function — required when aggregation is 'custom' */
  compute?: (rows: R[]) => string | number;
  /** Display label (defaults to column headerName) */
  label?: string;
  /** Format the computed value for display */
  format?: (value: number) => string;
}

// ---------------------------------------------------------------------------
// Persistence adapter
// ---------------------------------------------------------------------------

/** Abstract persistence interface — swap localStorage for backend API later */
export interface PersistenceAdapter {
  load(key: string): PersistedListConfig | null;
  save(key: string, config: PersistedListConfig): void;
  clear(key: string): void;
}

// ---------------------------------------------------------------------------
// Batch actions
// ---------------------------------------------------------------------------

export interface BatchAction {
  label: string;
  icon?: ReactNode;
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (selectedIds: string[]) => void;
}

// ---------------------------------------------------------------------------
// Main component props
// ---------------------------------------------------------------------------

export interface ConfigurableListProps<R extends Record<string, any> = any> {
  /** Unique key for persisting column config (e.g. 'deductions-list') */
  persistKey: string;

  // Data
  data: R[];
  loading: boolean;
  idField?: string;

  // Columns
  columns: CLColumnDef<R>[];

  // Pagination
  paginationMode?: 'client' | 'server';
  rowCount?: number;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];

  // Selection & batch actions
  enableSelection?: boolean;
  batchActions?: BatchAction[];
  onSelectionChange?: (ids: string[]) => void;

  // Row number column
  showRowNumbers?: boolean;

  // Totals
  totalRules?: TotalRule<R>[];

  // Events
  onRowClick?: (id: string) => void;
  onDeleteRow?: (id: string) => void;

  // Quick filter (server-side search)
  onQuickFilterChange?: (value: string) => void;

  // Persistence
  persistenceAdapter?: PersistenceAdapter;

  // Render slots
  renderFilters?: () => ReactNode;
  renderHeaderActions?: () => ReactNode;

  // Breadcrumbs
  breadcrumbs?: {
    heading: string;
    links: { name: string; href?: string; icon?: ReactNode }[];
  };
  addButton?: { label: string; href: string };

  // Reset handle — parent can call ref.resetColumns()
  onResetColumns?: () => void;
}

// ---------------------------------------------------------------------------
// Imperative handle exposed via ref
// ---------------------------------------------------------------------------

export interface ConfigurableListHandle {
  resetColumns: () => void;
}
