import type { ReactNode } from 'react';
import type { RowAction, SortState, SearchMode, BatchAction, SearchOutput, SortDirection, DataTableColumn, StorageStrategy, DataTableDefaultConfig } from '../types/types';

// ---------------------------------------------------------------------------
// Grouped prop shapes (exported so consumers can type-check their objects)
// ---------------------------------------------------------------------------

export type DataTablePaginationProps = {
  page: number;
  rowsPerPage?: number;
  totalCount: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
};

export type DataTableSearchProps = {
  value?: string;
  onChange?: (value: string) => void;
  mode?: SearchMode;
  allowFreeText?: boolean;
  options?: { id: string; label: string }[];
  onSearch?: (data: SearchOutput) => void;
  placeholder?: string;
  /** Simple mode: fire search automatically this many ms after typing stops. */
  debounceMs?: number;
};

export type DataTablePeriodFilterProps = {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange?: (date: Date | null) => void;
  onEndDateChange?: (date: Date | null) => void;
  activePeriod?: 'day' | 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'day' | 'week' | 'month' | 'year') => void;
};

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { useTranslate } from 'src/locales/use-locales';

import { Iconify } from 'src/components/iconify';

import { DataTableBody } from './DataTableBody';
import { DataTableHeader } from './DataTableHeader';
import { DataTableToolbar } from './DataTableToolbar';
import { localStorageStrategy } from '../utils/storage';
import { DataTablePagination } from './DataTablePagination';
import { DataTableColumnMenu } from './DataTableColumnMenu';
import { DataTableTotalsFooter } from './DataTableTotalsFooter';
import { DataTableFilterPopover } from './DataTableFilterPopover';
import { useDataTableSettingsActions } from '../context/DataTableActionsContext';
import { isSpecial, formatTotal, computeTotal, buildPersisted } from '../utils/helpers';
import {
  clamp,
  mergeConfig,
  getCellValue,
  toComparable,
  buildGridTemplate,
  computeMinTableWidth,
} from '../utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterState = Record<string, { type: 'text' | 'multi'; value: string | string[] }>;

export type DataTableProps<T> = {
  // Core
  persistKey: string;
  data: T[];
  columns: Array<DataTableColumn<T>>;
  defaultConfig: DataTableDefaultConfig;
  getRowId: (row: T) => string;
  onReset?: () => void;
  storageStrategy?: StorageStrategy;

  // Toolbar slots
  headerActions?: ReactNode;
  toolbarActions?: ReactNode;
  filterRow?: ReactNode;

  // Feature groups
  search?: DataTableSearchProps;
  pagination?: DataTablePaginationProps;
  periodFilter?: DataTablePeriodFilterProps;

  // Column filters + sort
  filters?: Record<string, { type: 'text' | 'multi'; value: string | string[] }>;
  onFiltersChange?: (filters: Record<string, { type: 'text' | 'multi'; value: string | string[] }>) => void;
  onSortChange?: (sort: SortState) => void;

  // Row behaviour
  showRowNumbers?: boolean;
  showTotals?: boolean;
  onRowClick?: (row: T) => void;
  onRowHover?: (row: T) => void;
  onCellEdit?: (args: { row: T; key: string; value: unknown }) => void | Promise<void>;
  batchActions?: Array<BatchAction<T>>;
  rowActions?: Array<RowAction<T>>;

  // Empty state
  emptyTitle?: string;
  emptySubtitle?: string;
};

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

// Stable reference for the `batchActions`/`rowActions` defaults: a fresh `[]`
// per render would change identity every time, breaking memo() on DataTableRow.
const EMPTY_ARRAY: never[] = [];

export function DataTable<T>({
  persistKey,
  data,
  columns,
  defaultConfig,
  onReset,
  headerActions,
  toolbarActions,
  filterRow,
  periodFilter,
  showRowNumbers = true,
  batchActions = EMPTY_ARRAY,
  rowActions = EMPTY_ARRAY,
  getRowId,
  onCellEdit,
  search,
  pagination,
  filters: controlledFilters,
  onFiltersChange,
  onSortChange,
  storageStrategy = localStorageStrategy,
  emptyTitle = 'No results',
  emptySubtitle = 'Try adjusting filters or columns.',
  onRowClick,
  onRowHover,
  showTotals = true,
}: DataTableProps<T>) {
  // Unpack grouped props
  const {
    page = 0,
    rowsPerPage: propRowsPerPage,
    totalCount,
    rowsPerPageOptions = [10, 20, 50, 100],
    onPageChange,
    onRowsPerPageChange,
  } = pagination ?? {};

  const {
    value: searchValue = '',
    onChange: onSearchChange,
    mode: searchMode,
    allowFreeText,
    options: searchOptions,
    onSearch,
    placeholder: searchPlaceholder,
    debounceMs: searchDebounceMs,
  } = search ?? {};

  const showPeriodPicker = Boolean(periodFilter && (periodFilter.startDate !== undefined || periodFilter.onStartDateChange));
  const showPeriodButtons = Boolean(periodFilter?.onPeriodChange);
  const periodPickerProps = periodFilter ? {
    startDate: periodFilter.startDate,
    endDate: periodFilter.endDate,
    onStartDateChange: periodFilter.onStartDateChange,
    onEndDateChange: periodFilter.onEndDateChange,
  } : undefined;
  const periodButtonProps = periodFilter ? {
    activePeriod: periodFilter.activePeriod,
    onPeriodChange: periodFilter.onPeriodChange,
  } : undefined;

  const serverPagination = Boolean(onPageChange);
  const effectiveTotalCount = totalCount ?? data.length;
  const showCheckboxes = batchActions.length > 0;

  // Use global rows per page if not explicitly provided by parent
  const { rowsPerPage: globalRowsPerPage, setRowsPerPage: setGlobalRowsPerPage } = usePaginationRows();
  const rowsPerPage = propRowsPerPage !== undefined ? propRowsPerPage : globalRowsPerPage;

  // ---- Config persistence ------------------------------------------------
  const persisted = useMemo(() => storageStrategy.load(persistKey), [storageStrategy, persistKey]);
  const merged = useMemo(
    () => mergeConfig(columns, defaultConfig, persisted),
    [columns, defaultConfig, persisted]
  );

  const [order, setOrder] = useState<string[]>(merged.order);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(merged.visibility);
  const [widths, setWidths] = useState<Record<string, number | string>>(merged.widths);

  const getDefaultWidths = useCallback(() => {
    const defaults: Record<string, number | string> = {};
    for (const col of columns) {
      if (col.width !== undefined) {
        defaults[col.key] = col.width;
      }
    }
    return defaults;
  }, [columns]);

  const persist = useCallback(
    (next: {
      order?: string[];
      visibility?: Record<string, boolean>;
      widths?: Record<string, number | string>;
    }) => {
      const nextOrder = next.order ?? order;
      const nextVisibility = next.visibility ?? visibility;
      const nextWidths = next.widths ?? widths;
      storageStrategy.save(persistKey, buildPersisted(nextOrder, nextVisibility, nextWidths));
    },
    [storageStrategy, persistKey, order, visibility, widths]
  );

  useEffect(() => {
    setOrder((prev) => {
      const keySet = new Set(columns.map((c) => c.key));
      const base = prev.filter((k) => keySet.has(k));
      const missing = columns.map((c) => c.key).filter((k) => !base.includes(k));
      const next = [...base, ...missing];
      if (next.join('|') !== prev.join('|')) persist({ order: next });
      return next;
    });
    setVisibility((prev) => {
      const next = { ...prev };
      for (const c of columns) {
        if (next[c.key] == null) next[c.key] = c.defaultVisible ?? true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  // ---- Derived columns ---------------------------------------------------
  const visibleColumns = useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]));
    return order
      .filter((k) => !isSpecial(k))
      .map((k) => byKey.get(k))
      .filter(Boolean)
      .filter(
        (c) => visibility[(c as DataTableColumn<T>).key] !== false
      ) as Array<DataTableColumn<T>>;
  }, [columns, order, visibility]);

  const gridTemplateColumns = useMemo(
    () => buildGridTemplate(visibleColumns, widths, { showCheckboxes, showRowNumbers }),
    [visibleColumns, widths, showCheckboxes, showRowNumbers]
  );

  const minTableWidth = useMemo(
    () => computeMinTableWidth(visibleColumns, widths, { showCheckboxes, showRowNumbers }),
    [visibleColumns, widths, showCheckboxes, showRowNumbers]
  );

  // ---- Sort & Filter -----------------------------------------------------
  const [sort, setSort] = useState<{ key: string | null; dir: SortDirection }>({
    key: null,
    dir: null,
  });

  const handleSortChange = useCallback(
    (newSort: { key: string | null; dir: SortDirection }) => {
      setSort(newSort);
      if (onSortChange) {
        onSortChange(newSort);
      }
    },
    [onSortChange]
  );

  const [internalFilters, setInternalFilters] = useState<FilterState>({});
  const isFilterControlled = Boolean(controlledFilters && onFiltersChange);
  const filters = isFilterControlled ? controlledFilters : internalFilters;

  const updateFilters = useCallback(
    (next: FilterState) => {
      if (isFilterControlled && onFiltersChange) {
        onFiltersChange(next);
      } else {
        setInternalFilters(next);
      }
    },
    [isFilterControlled, onFiltersChange]
  );

  // Note: If onSortChange is provided, sorting is done on the server side; DataTable only manages UI state
  // Otherwise, do client-side sorting
  const sortedData = useMemo(() => {
    // If onSortChange is provided, the parent component handles API sorting
    if (onSortChange) return data;

    if (!sort.key || !sort.dir) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;

    const dir = sort.dir === 'asc' ? 1 : -1;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = toComparable(getCellValue(col, a));
      const bv = toComparable(getCellValue(col, b));
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [data, sort, columns, onSortChange]);

  // ---- Totals ------------------------------------------------------------
  const totals = useMemo(() => {
    const map: Record<string, string> = {};
    for (const col of visibleColumns) {
      if (!col.total) continue;
      const v = computeTotal(col, sortedData);
      map[col.key] = v == null ? '' : formatTotal(col, v);
    }
    return map;
  }, [visibleColumns, sortedData]);

  // ---- Selection ---------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectedRows = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return sortedData.filter((r) => selectedIds.has(getRowId(r)));
  }, [selectedIds, sortedData, getRowId]);

  const allVisibleSelected = useMemo(() => {
    if (!showCheckboxes || sortedData.length === 0) return false;
    for (const r of sortedData) {
      if (!selectedIds.has(getRowId(r))) return false;
    }
    return true;
  }, [showCheckboxes, sortedData, selectedIds, getRowId]);

  const someVisibleSelected = useMemo(() => {
    if (!showCheckboxes || sortedData.length === 0) return false;
    let any = false;
    let all = true;
    for (const r of sortedData) {
      const has = selectedIds.has(getRowId(r));
      any ||= has;
      all &&= has;
    }
    return any && !all;
  }, [showCheckboxes, sortedData, selectedIds, getRowId]);

  const toggleAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !allVisibleSelected;
      if (shouldSelectAll) {
        sortedData.forEach((r) => next.add(getRowId(r)));
      } else {
        sortedData.forEach((r) => next.delete(getRowId(r)));
      }
      return next;
    });
  }, [allVisibleSelected, sortedData, getRowId]);

  const toggleSelected = useCallback((rowId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  // ---- Column menu -------------------------------------------------------
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);

  const toggleColumnVisibility = useCallback(
    (key: string) => {
      setVisibility((prev) => {
        const next = { ...prev, [key]: !(prev[key] !== false) };
        persist({ visibility: next });
        return next;
      });
    },
    [persist]
  );

  // ---- Reset -------------------------------------------------------------
  const reset = useCallback(() => {
    storageStrategy.clear(persistKey);
    const defaults = mergeConfig(columns, defaultConfig, null);
    setOrder(defaults.order);
    setVisibility(defaults.visibility);
    setWidths(getDefaultWidths());
    handleSortChange({ key: null, dir: null });
    setSelectedIds(new Set());
    onReset?.();
  }, [storageStrategy, persistKey, columns, defaultConfig, getDefaultWidths, handleSortChange, onReset]);

  // ---- Settings slot in tabs bar -----------------------------------------
  const { setSettingsSlot, clearSettingsSlot } = useDataTableSettingsActions();
  const { t, i18n } = useTranslate('common');

  useEffect(() => {
    setSettingsSlot(
      <>
        <Tooltip title={t('dataTable.columnSettings')}>
          <IconButton
            size="small"
            aria-label={t('dataTable.columnSettings')}
            onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
          >
            <Iconify icon="solar:settings-bold-duotone" width={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('dataTable.resetToDefault')}>
          <IconButton size="small" aria-label={t('dataTable.resetToDefault')} onClick={reset}>
            <Iconify icon="solar:restart-bold" width={18} />
          </IconButton>
        </Tooltip>
      </>
    );
    return () => clearSettingsSlot();
  // `t` is deliberately excluded: react-i18next hands back a new `t` reference on
  // every render, which would re-run this effect (and churn the shared settings-slot
  // context the whole dashboard layout consumes) on every render of DataTable.
  // `i18n.language` is a stable primitive that only changes when the language does.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, i18n.language]);

  // ---- Filters -----------------------------------------------------------
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [filterKey, setFilterKey] = useState<string | null>(null);

  const openFilter = useCallback((key: string, el: HTMLElement) => {
    setFilterKey(key);
    setFilterAnchor(el);
  }, []);

  const closeFilter = useCallback(() => {
    setFilterAnchor(null);
    setFilterKey(null);
  }, []);

  // Cleanup filter popover on unmount to prevent DOM errors
  useEffect(() => () => {
      closeFilter();
    }, [closeFilter]);

  const setTextFilter = useCallback((key: string, value: string) => {
    updateFilters({ ...filters, [key]: { type: 'text', value } });
  }, [filters, updateFilters]);

  const setMultiFilter = useCallback((key: string, value: string[]) => {
    updateFilters({ ...filters, [key]: { type: 'multi', value } });
  }, [filters, updateFilters]);

  const clearFilter = useCallback((key: string) => {
    const next = { ...filters };
    delete next[key];
    updateFilters(next);
  }, [filters, updateFilters]);

  // ---- Reorder -----------------------------------------------------------
  const reorder = useCallback(
    (fromKey: string, toKey: string) => {
      if (fromKey === toKey) return;
      const fromCol = columns.find((c) => c.key === fromKey);
      const toCol = columns.find((c) => c.key === toKey);
      if (!fromCol || !toCol) return;
      if (fromCol.reorderable === false || toCol.reorderable === false) return;

      setOrder((prev) => {
        const next = prev.filter((k) => k !== fromKey);
        const idx = next.indexOf(toKey);
        if (idx === -1) return prev;
        next.splice(idx, 0, fromKey);
        persist({ order: next });
        return next;
      });
    },
    [columns, persist]
  );

  // ---- Resize ------------------------------------------------------------
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
    nextColKey: string | null;
    nextColStartWidth: number;
    min: number;
    max: number;
    nextMin: number;
    nextMax: number;
  } | null>(null);

  const onResizeStart = useCallback(
    (key: string, e: React.PointerEvent) => {
      const colIndex = visibleColumns.findIndex((c) => c.key === key);
      if (colIndex === -1) return;

      const col = visibleColumns[colIndex];
      const nextCol = visibleColumns[colIndex + 1];
      if (!col) return;

      const startWidth = widths[key] ?? (typeof col.width === 'number' ? col.width : 160);
      const numericStartWidth = typeof startWidth === 'string' ? 160 : startWidth;

      const nextColStartWidth = nextCol
        ? widths[nextCol.key] ?? (typeof nextCol.width === 'number' ? nextCol.width : 160)
        : 0;
      const numericNextColStartWidth = typeof nextColStartWidth === 'string' ? 160 : nextColStartWidth;

      resizingRef.current = {
        key,
        startX: e.clientX,
        startWidth: numericStartWidth,
        nextColKey: nextCol?.key ?? null,
        nextColStartWidth: numericNextColStartWidth,
        min: col.minWidth ?? 120,
        max: col.maxWidth ?? 560,
        nextMin: nextCol?.minWidth ?? 120,
        nextMax: nextCol?.maxWidth ?? 560,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [visibleColumns, widths]
  );

  const onResizeMove = useCallback(
    (e: React.PointerEvent) => {
      const active = resizingRef.current;
      if (!active) return;
      const dx = e.clientX - active.startX;
      const nextW = clamp(active.startWidth + dx, active.min, active.max);

      setWidths((prev) => {
        const next = { ...prev, [active.key]: nextW };

        // If there's a next column and dx is positive (expanding current), reduce next column
        if (active.nextColKey && dx !== 0) {
          const nextColNewWidth = active.nextColStartWidth - dx;
          const clampedNextColWidth = clamp(nextColNewWidth, active.nextMin, active.nextMax);
          next[active.nextColKey] = clampedNextColWidth;
        }

        persist({ widths: next });
        return next;
      });
    },
    [persist]
  );

  const onResizeEnd = useCallback(() => {
    resizingRef.current = null;
  }, []);

  // ---- Editing -----------------------------------------------------------
  const [editing, setEditing] = useState<{ rowId: string; key: string } | null>(null);
  const startEdit = useCallback((rowId: string, key: string) => {
    setEditing({ rowId, key });
  }, []);
  const cancelEdit = useCallback(() => setEditing(null), []);

  // `sortedData` gets a new array identity whenever the user (re)sorts or data
  // refetches. Reading it via a ref keeps `commitEdit`'s identity stable across
  // those changes, so it doesn't break memo() on every visible DataTableRow.
  const sortedDataRef = useRef(sortedData);
  sortedDataRef.current = sortedData;

  const commitEdit = useCallback(
    async (rowId: string, key: string, value: unknown) => {
      setEditing(null);
      const row = sortedDataRef.current.find((r) => getRowId(r) === rowId);
      if (!row) return;
      await onCellEdit?.({ row, key, value });
    },
    [getRowId, onCellEdit]
  );

  // ---- Refs --------------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const headerDragKey = useRef<string | null>(null);

  // ---- Render ------------------------------------------------------------
  return (
    <div style={{ marginTop: 16, height: 'min(88vh, 880px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div style={{ flexShrink: 0 }}>
        <DataTableToolbar<T>
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchMode={searchMode}
          allowFreeText={allowFreeText}
          searchOptions={searchOptions}
          onSearch={onSearch}
          searchPlaceholder={searchPlaceholder}
          searchDebounceMs={searchDebounceMs}
          showPeriodPicker={showPeriodPicker}
          periodPickerProps={periodPickerProps}
          showPeriodButtons={showPeriodButtons}
          periodButtonProps={periodButtonProps}
          showCheckboxes={showCheckboxes}
          selectedRows={selectedRows}
          batchActions={batchActions}
          headerActions={headerActions}
          toolbarActions={toolbarActions}
          filterRow={filterRow}
        />
      </div>

      <DataTableColumnMenu<T>
        anchorEl={columnMenuAnchor}
        onClose={() => setColumnMenuAnchor(null)}
        columns={columns}
        visibility={visibility}
        onToggleVisibility={toggleColumnVisibility}
      />

      {/* Main Table Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowX: 'auto' }}>
          <DataTableHeader<T>
            gridTemplateColumns={gridTemplateColumns}
            minTableWidth={minTableWidth}
            showCheckboxes={showCheckboxes}
            showRowNumbers={showRowNumbers}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            toggleAllVisible={toggleAllVisible}
            visibleColumns={visibleColumns}
            sort={sort}
            onSortChange={handleSortChange}
            filters={filters ?? {}}
            onOpenFilter={openFilter}
            onReorder={reorder}
            onResizeStart={onResizeStart}
            onResizeMove={onResizeMove}
            onResizeEnd={onResizeEnd}
            headerDragKey={headerDragKey}
          />

          <DataTableFilterPopover<T>
            anchorEl={filterAnchor}
            filterKey={filterKey}
            columns={columns}
            filters={filters ?? {}}
            data={data}
            onClose={closeFilter}
            onSetTextFilter={setTextFilter}
            onSetMultiFilter={setMultiFilter}
            onClearFilter={clearFilter}
          />

          <DataTableBody<T>
            data={sortedData}
            columns={columns}
            colOrder={order}
            visibility={visibility}
            widths={widths}
            minTableWidth={minTableWidth}
            showRowNumbers={showRowNumbers}
            showCheckboxes={showCheckboxes}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            rowActions={rowActions}
            editing={editing}
            startEdit={startEdit}
            commitEdit={commitEdit}
            cancelEdit={cancelEdit}
            getRowId={getRowId}
            scrollRef={scrollRef}
            emptyTitle={emptyTitle}
            emptySubtitle={emptySubtitle}
            onRowClick={onRowClick}
            onRowHover={onRowHover}
            pageOffset={page * rowsPerPage}
          />

          {showTotals && (
            <DataTableTotalsFooter<T>
              gridTemplateColumns={gridTemplateColumns}
              minTableWidth={minTableWidth}
              showCheckboxes={showCheckboxes}
              showRowNumbers={showRowNumbers}
              visibleColumns={visibleColumns}
              totals={totals}
            />
          )}
        </Box>

        {/* Pagination (attached to main card) */}
        {serverPagination && onPageChange && (
          <DataTablePagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={effectiveTotalCount}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={onPageChange}
            onRowsPerPageChange={(newRowsPerPage) => {
              setGlobalRowsPerPage(newRowsPerPage);
              onRowsPerPageChange?.(newRowsPerPage);
            }}
          />
        )}
      </div>
    </div>
  );
}
