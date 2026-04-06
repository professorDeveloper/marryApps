import type { GridColumnVisibilityModel } from '@mui/x-data-grid';
import type {
  CLColumnDef,
  PersistenceAdapter,
  PersistedListConfig,
  PersistedColumnState,
} from './types';

import { useRef, useMemo, useState, useCallback } from 'react';

import { localStorageAdapter } from './persistence';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fields that are always pinned to the start and cannot be reordered */
const PINNED_FIELDS = new Set(['__checkbox__', '__rowNumber__', '__selection__']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultState(columns: CLColumnDef[]): PersistedColumnState[] {
  return columns.map((col, i) => ({
    field: col.field,
    visible: col.clHideable !== false,
    width: col.width as number | undefined,
    orderIndex: i,
  }));
}

function mergeWithPersisted(
  columns: CLColumnDef[],
  persisted: PersistedListConfig | null
): PersistedColumnState[] {
  if (!persisted) return buildDefaultState(columns);

  const persistedMap = new Map(persisted.columns.map((c) => [c.field, c]));
  const colFields = new Set(columns.map((c) => c.field));

  // Start with persisted order, skip removed columns
  const merged: PersistedColumnState[] = persisted.columns
    .filter((pc) => colFields.has(pc.field))
    .map((pc) => ({ ...pc }));

  // Append any new columns not in persisted config
  columns.forEach((col, i) => {
    if (!persistedMap.has(col.field)) {
      merged.push({
        field: col.field,
        visible: col.clHideable !== false,
        width: col.width as number | undefined,
        orderIndex: merged.length,
      });
    }
  });

  // Re-index
  merged.forEach((m, i) => {
    m.orderIndex = i;
  });

  return merged;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseColumnConfigOptions {
  persistKey: string;
  columns: CLColumnDef[];
  adapter?: PersistenceAdapter;
}

export interface UseColumnConfigReturn {
  /** Columns sorted according to user's order + visibility */
  orderedColumns: CLColumnDef[];
  /** MUI DataGrid column visibility model */
  visibilityModel: GridColumnVisibilityModel;
  /** Current column states (for the manager panel) */
  columnStates: PersistedColumnState[];
  /** Toggle a column's visibility */
  toggleColumn: (field: string) => void;
  /** Set column visibility directly */
  setColumnVisible: (field: string, visible: boolean) => void;
  /** Reorder columns via drag-and-drop (move `field` to `toIndex`) */
  moveColumn: (field: string, toIndex: number) => void;
  /** Update column width */
  resizeColumn: (field: string, width: number) => void;
  /** Reset all columns to default configuration */
  resetColumns: () => void;
  /** Programmatic visibility model change handler (from DataGrid) */
  onVisibilityModelChange: (model: GridColumnVisibilityModel) => void;
}

export function useColumnConfig({
  persistKey,
  columns,
  adapter = localStorageAdapter,
}: UseColumnConfigOptions): UseColumnConfigReturn {
  const defaultStateRef = useRef(buildDefaultState(columns));

  const [columnStates, setColumnStates] = useState<PersistedColumnState[]>(() =>
    mergeWithPersisted(columns, adapter.load(persistKey))
  );

  // Persist whenever state changes
  const persist = useCallback(
    (states: PersistedColumnState[]) => {
      adapter.save(persistKey, { columns: states, version: 1 });
    },
    [adapter, persistKey]
  );

  const updateStates = useCallback(
    (updater: (prev: PersistedColumnState[]) => PersistedColumnState[]) => {
      setColumnStates((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // Column definitions map for fast lookup
  const columnDefsMap = useMemo(
    () => new Map(columns.map((c) => [c.field, c])),
    [columns]
  );

  // Build ordered columns for DataGrid
  const orderedColumns = useMemo(() => {
    const sorted = [...columnStates].sort((a, b) => a.orderIndex - b.orderIndex);
    const result: CLColumnDef[] = [];

    for (const state of sorted) {
      const def = columnDefsMap.get(state.field);
      if (def) {
        result.push({
          ...def,
          width: state.width ?? def.width,
        });
      }
    }

    return result;
  }, [columnStates, columnDefsMap]);

  // Visibility model
  const visibilityModel = useMemo(() => {
    const model: GridColumnVisibilityModel = {};
    for (const state of columnStates) {
      model[state.field] = state.visible;
    }
    return model;
  }, [columnStates]);

  // Toggle visibility
  const toggleColumn = useCallback(
    (field: string) => {
      updateStates((prev) =>
        prev.map((s) => (s.field === field ? { ...s, visible: !s.visible } : s))
      );
    },
    [updateStates]
  );

  const setColumnVisible = useCallback(
    (field: string, visible: boolean) => {
      updateStates((prev) =>
        prev.map((s) => (s.field === field ? { ...s, visible } : s))
      );
    },
    [updateStates]
  );

  // Move column (drag-and-drop)
  const moveColumn = useCallback(
    (field: string, toIndex: number) => {
      const colDef = columnDefsMap.get(field);
      if (!colDef || colDef.reorderable === false || PINNED_FIELDS.has(field)) return;

      updateStates((prev) => {
        const sorted = [...prev].sort((a, b) => a.orderIndex - b.orderIndex);

        // Separate pinned and reorderable
        const pinned = sorted.filter(
          (s) => PINNED_FIELDS.has(s.field) || columnDefsMap.get(s.field)?.reorderable === false
        );
        const reorderable = sorted.filter(
          (s) => !PINNED_FIELDS.has(s.field) && columnDefsMap.get(s.field)?.reorderable !== false
        );

        const fromIdx = reorderable.findIndex((s) => s.field === field);
        if (fromIdx === -1) return prev;

        const [moved] = reorderable.splice(fromIdx, 1);
        const clampedTo = Math.max(0, Math.min(toIndex, reorderable.length));
        reorderable.splice(clampedTo, 0, moved);

        // Rebuild with pinned first, then reorderable
        const combined = [...pinned, ...reorderable];
        return combined.map((s, i) => ({ ...s, orderIndex: i }));
      });
    },
    [updateStates, columnDefsMap]
  );

  // Resize
  const resizeColumn = useCallback(
    (field: string, width: number) => {
      updateStates((prev) =>
        prev.map((s) => (s.field === field ? { ...s, width } : s))
      );
    },
    [updateStates]
  );

  // Reset to defaults
  const resetColumns = useCallback(() => {
    const defaults = buildDefaultState(columns);
    setColumnStates(defaults);
    adapter.clear(persistKey);
  }, [columns, adapter, persistKey]);

  // Handle DataGrid visibility model changes
  const onVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      updateStates((prev) =>
        prev.map((s) => ({
          ...s,
          visible: model[s.field] !== undefined ? !!model[s.field] : s.visible,
        }))
      );
    },
    [updateStates]
  );

  return {
    orderedColumns,
    visibilityModel,
    columnStates,
    toggleColumn,
    setColumnVisible,
    moveColumn,
    resizeColumn,
    resetColumns,
    onVisibilityModelChange,
  };
}
