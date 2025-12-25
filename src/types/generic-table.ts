// Generic table types for reusable table components

// Base entity interface that all table items should extend
export interface BaseTableEntity {
  id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Generic filter interface
export interface TableFilters {
  [key: string]: string | string[] | number | number[] | boolean | undefined;
}

// Table column configuration
export interface TableColumn<T = any> {
  field: keyof T | string;
  headerName: string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'singleSelect';
  width?: number;
  flex?: number;
  minWidth?: number;
  hideable?: boolean;
  editable?: boolean;
  valueOptions?: { value: any; label: string }[];
  renderCell?: (params: any) => React.ReactNode;
}

// Table action configuration
export interface TableAction<T = any> {
  label: string;
  icon: string;
  onClick?: (row: T) => void;
  href?: string | ((row: T) => string);
  showInMenu?: boolean;
  style?: React.CSSProperties;
}

// Table configuration
export interface TableConfig<T = any> {
  title?: string;
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  filters?: {
    [key: string]: {
      type: 'select' | 'multiselect' | 'text' | 'number' | 'date';
      options?: { value: any; label: string }[];
      label: string;
      placeholder?: string;
    };
  };
  hideColumns?: string[];
  defaultSort?: { field: string; sort: 'asc' | 'desc' };
  pageSize?: number;
  pageSizeOptions?: number[];
  enableSelection?: boolean;
  enableFilters?: boolean;
  enableSearch?: boolean;
  enableExport?: boolean;
  enableColumnVisibility?: boolean;
  addButton?: {
    text: string;
    href: string;
  };
}

// API response types
export interface TableApiResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// CRUD operation types
export interface CrudOperations<T = any> {
  create?: (data: Partial<T>) => Promise<T>;
  update?: (id: string, data: Partial<T>) => Promise<T>;
  delete?: (id: string) => Promise<void>;
  deleteMany?: (ids: string[]) => Promise<void>;
}

// Table state interface
export interface TableState<T = any> {
  data: T[];
  loading: boolean;
  error: any;
  selectedRows: string[];
  filters: TableFilters;
  searchQuery: string;
  sortModel: { field: string; sort: 'asc' | 'desc' } | null;
  paginationModel: { page: number; pageSize: number };
}

// Common table props
export interface CommonTableProps<T = any> {
  data: T[];
  loading?: boolean;
  error?: any;
  totalCount?: number;
  idField?: keyof T;
  onRefresh?: () => void;
  filters?: any;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

// Filter component props
export interface FilterComponentProps {
  filters: any;
  config: {
    [key: string]: {
      type: 'select' | 'multiselect' | 'text' | 'number' | 'date';
      options?: { value: any; label: string }[];
      label: string;
      placeholder?: string;
    };
  };
}

// Export button props
export interface ExportButtonProps {
  data: any[];
  filename?: string;
  columns?: string[];
}

// Search input props
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}
