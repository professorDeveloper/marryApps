# DataTable — Full Reference

Canonical implementation (the one that should be used going forward):

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/
```

> ⚠️ There is a second, hand-forked copy at
> `/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/warehouse/deduction/components/utility-data-table/`.
> It duplicates every file in the canonical folder but has drifted out of sync (see
> [Forked copy](#forked-copy-utility-data-table) at the bottom). Do not add new features there —
> port them to the canonical folder and delete the fork when possible.

## 1. Directory layout

```
src/sections/common/data-table/
├── index.ts                              # public barrel export
├── components/
│   ├── DataTable.tsx                     # main component — owns ALL state
│   ├── DataTableHeader.tsx                # sticky header row: sort/filter/reorder/resize
│   ├── DataTableBody.tsx                 # virtualized row list (@tanstack/react-virtual)
│   ├── DataTableRow.tsx                  # single row, memoized
│   ├── DataTableToolbar.tsx              # search / period filter / batch actions bar
│   ├── ToolbarSearch.tsx                 # simple debounced search OR chip-based advanced search
│   ├── DataTablePagination.tsx           # page controls (standalone, non-generic)
│   ├── DataTableColumnMenu.tsx           # column visibility popover
│   ├── DataTableFilterPopover.tsx        # per-column filter popover (text / multi-select)
│   ├── DataTableTotalsFooter.tsx         # sticky totals row
│   ├── CategoryFilter.tsx / DepartmentFilter.tsx / StorageFilter.tsx  # domain-specific filter chips
├── context/
│   └── DataTableActionsContext.tsx       # "settings slot" injection (column gear + reset icon)
├── types/
│   ├── types.ts                          # core types actually used (columns, filters, totals…)
│   ├── data-table.ts                     # LEGACY duplicate DataTableProps — see note below
│   └── index.ts                          # re-exports both of the above
└── utils/
    ├── config-helpers.ts                 # mergeConfig() — merges columns + defaultConfig + persisted
    ├── formatting.ts                     # number/value formatting, getCellValue, toComparable, nextSort
    ├── grid-helpers.ts                   # CSS grid-template-columns computation
    ├── helpers.ts                        # computeTotal, formatTotal, buildPersisted, isSpecial
    ├── storage.ts                        # localStorageStrategy (persistence)
    ├── constants.ts                      # shared sx/style constants, FILTER_SELECT_SX
    ├── utils.ts                          # DEAD CODE — fully commented out, not imported anywhere
    └── index.ts                          # barrel (does NOT re-export utils.ts)
```

## 2. Public API — what you import

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/index.ts
```

```ts
export { DataTable } from './components/DataTable';
export { FILTER_SELECT_SX } from './utils/constants';
export { localStorageStrategy } from './utils/storage';
export { DataTableRow } from './components/DataTableRow';
export { DataTableBody, DataTableHeader } from './components/...';
export {
  DataTableToolbar,
  DataTablePagination,
  DataTableColumnMenu,
  DataTableTotalsFooter,
  DataTableFilterPopover,
} from './components/...';
export type { FilterState, DataTableProps } from './types';
export type {
  DataTableSearchProps,
  DataTablePaginationProps,
  DataTablePeriodFilterProps,
} from './components/DataTable';
```

99% of consumers only need `DataTable` (+ `FILTER_SELECT_SX` if they add a custom `filterRow`).

## 3. Props — `DataTableProps<T>`

Defined **inline in** `components/DataTable.tsx` (lines 8–114). This is the type that actually
governs the component's behavior — do not confuse it with `types/data-table.ts` (see
[Legacy duplicate type](#legacy-duplicate-type) below).

```ts
persistKey: string;                       // localStorage key suffix — MUST be unique per table instance
data: T[];
columns: Array<DataTableColumn<T>>;
defaultConfig: DataTableDefaultConfig;    // { order: string[]; visibility: Record<string,bool>; widths?: Record<string,number|string> }
getRowId: (row: T) => string;

onReset?: () => void;                     // called after internal reset() clears column config
storageStrategy?: StorageStrategy;        // default = localStorageStrategy

headerActions?: ReactNode;                // right-aligned slot in the toolbar (e.g. "Add" button)
toolbarActions?: ReactNode;                // left-of-batch-actions slot in the toolbar
filterRow?: ReactNode;                    // optional second toolbar row for custom filters

search?: DataTableSearchProps;
pagination?: DataTablePaginationProps;
periodFilter?: DataTablePeriodFilterProps;

filters?: Record<string, { type: 'text' | 'multi'; value: string | string[] }>;  // controlled
onFiltersChange?: (filters) => void;      // required together with `filters` to control filtering externally

onSortChange?: (sort: SortState) => void; // if provided → sorting becomes SERVER-SIDE (client sort skipped)
defaultSort?: SortState;                  // initial value only, not persisted across reloads

showRowNumbers?: boolean;                 // default true
showTotals?: boolean;                     // default true

onRowClick?: (row: T) => void;
onRowHover?: (row: T) => void;
onCellEdit?: (args: { row: T; key: string; value: unknown }) => void | Promise<void>;

batchActions?: Array<BatchAction<T>>;     // shown in toolbar when >=1 row selected
rowActions?: Array<RowAction<T>>;         // per-row action menu

emptyTitle?: string;                      // default 'No results'
emptySubtitle?: string;                   // default 'Try adjusting filters or columns.'
```

`EMPTY_ARRAY` (a module-level `never[]`) is used as the default for `batchActions`/`rowActions` so
their reference identity is stable across renders — this matters because `DataTableRow` is wrapped
in `memo()` and a fresh `[]` literal every render would defeat that memoization.

### `DataTableColumn<T>` (the column config)

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/types/types.ts:22-71
```

```ts
key: string;
label: string | ReactNode;
width?: number | string;        // '2fr', '160px', '20%', or bare number (px)
minWidth?: number;               // default 120 when resizing
maxWidth?: number;               // default 560 when resizing
defaultVisible?: boolean;
align?: 'left' | 'center' | 'right';
mono?: boolean;                  // monospace rendering
sortable?: boolean;
sortKey?: string;                // key to use for sort comparator if different from `key`
filterable?: boolean;
headerActionsAlign?: 'start' | 'end';
editable?: boolean;              // enables double-click inline edit
toggleable?: boolean;            // default true; false = always visible, can't hide via column menu
reorderable?: boolean;           // default true; false = column can't be drag-reordered

getValue?: (row: T) => unknown;               // fallback: row[col.key]
renderCell?: (args: { row: T; value: unknown }) => ReactNode;
renderEdit?: (args: { row: T; value: unknown; onCommit: (next: unknown) => void; onCancel: () => void }) => ReactNode;

filter?: {
  type: 'text' | 'multi';
  placeholder?: string;
  options?: string[];            // if omitted, auto-derived from unique values in `data` (capped at 250)
  getOptionLabel?: (v: string) => string;
  maxSelections?: number;        // default 1 (single-select behavior inside the "multi" UI)
};

total?:
  | { aggregation: 'sum' | 'avg' | 'count'; format?: (v: number) => string; label?: string }
  | { aggregation: 'custom'; compute: (rows: T[]) => string | number; label?: string };
```

## 4. How state is managed

Everything lives **inside `DataTable.tsx`** via `useState`/`useMemo`/`useCallback` — there is no
external store, no Zustand/Redux, no context for table state itself (context is only used for the
"settings slot", see §6). This is deliberate: each `DataTable` instance is self-contained and keyed
by `persistKey`.

| Concern | Mechanism |
|---|---|
| Column order / visibility / widths | Seeded by `mergeConfig(columns, defaultConfig, persisted)` (`utils/config-helpers.ts`); persisted to `storageStrategy` (localStorage by default) on every change via `buildPersisted()`. |
| Sort | `sort: SortState` state. If `onSortChange` prop given → parent owns sorting, client-side sort is skipped entirely (server-side mode). Otherwise sorted client-side in a `sortedData` memo using `toComparable()`. |
| Selection | `selectedIds: Set<string>` keyed by `getRowId(row)`. Derives `selectedRows`, `allVisibleSelected`, `someVisibleSelected`. |
| Filters | Internal `internalFilters` state, OR fully controlled via `filters` + `onFiltersChange` props (`isFilterControlled = Boolean(filters && onFiltersChange)`). Popover anchor tracked separately (`filterAnchor`/`filterKey`). |
| Column reorder | HTML5 drag-and-drop; `reorder(fromKey, toKey)`, guarded per-column by `col.reorderable`. |
| Column resize | Pointer-drag; geometry tracked in a `useRef` (not state, for perf) — `onResizeStart/Move/End`; clamped to `col.minWidth`/`col.maxWidth` (default 120/560). |
| Inline cell edit | `editing: {rowId, key} | null`; `startEdit`/`cancelEdit`/`commitEdit` (async, calls `onCellEdit`). A `sortedDataRef` mirrors `sortedData` so `commitEdit`'s function identity stays stable across re-sorts. |
| Totals | `totals` memo computed per-column via `computeTotal`/`formatTotal` (`utils/helpers.ts`), driven by `col.total`. |
| Reset | `reset()` clears storage via `storageStrategy.clear(persistKey)`, recomputes `mergeConfig(columns, defaultConfig, null)`, resets order/visibility/widths/sort/selection, then calls `onReset?.()`. |
| Global rows-per-page | `usePaginationRows()` (`src/hooks/use-pagination-rows`) shares a rows-per-page setting across tables app-wide, unless `pagination.rowsPerPage` is explicitly passed. |

### Render tree (composition order)

```
DataTable
 ├─ DataTableToolbar        (search / period filter / batch actions / headerActions / filterRow)
 ├─ DataTableColumnMenu     (popover, anchored on gear icon)
 ├─ DataTableHeader         (sort / filter icons / drag-reorder / resize handles)
 ├─ DataTableFilterPopover  (popover, anchored per column)
 ├─ DataTableBody           (virtualized rows via @tanstack/react-virtual, estimateSize 44px, overscan 8)
 ├─ DataTableTotalsFooter   (if showTotals)
 └─ DataTablePagination     (if pagination prop given → serverPagination = Boolean(onPageChange))
```

Container height is fixed: `height: 'min(88vh, 880px)'`.

## 5. Component responsibilities

| File | Responsibility |
|---|---|
| [DataTableHeader.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableHeader.tsx) | Sticky grid header; per-column sort icon (cycles via `nextSort`), filter icon, HTML5 drag handle for reorder, pointer resize handle. Memoized. |
| [DataTableBody.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableBody.tsx) | Virtualized scroll container (`useVirtualizer`). Renders empty-state (icon/title/subtitle) when `data.length === 0`. Passes `index: pageOffset + virtualRow.index` to each row for correct cross-page row numbering. |
| [DataTableRow.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableRow.tsx) | One row. Recomputes its own visible-columns/grid-template from `colOrder`/`visibility`/`widths`. Renders checkbox, row number, cell values (`getCellValue`), inline edit `TextField`/`renderEdit` on double-click if `col.editable`. Sticky first-column + checkbox/row-number cells. `memo()`-wrapped. |
| [DataTableToolbar.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableToolbar.tsx) | Search, period date-range pickers/quick-buttons, `toolbarActions` slot, batch-action buttons (when selection > 0) OR `headerActions` slot, optional `filterRow`. |
| [DataTablePagination.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTablePagination.tsx) | Standalone (non-generic) pagination bar: rows-per-page select, "x–y of total" label, numbered page buttons with ellipsis collapsing (shows all if ≤7 pages). |
| [DataTableColumnMenu.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableColumnMenu.tsx) | Column-visibility checkbox list; disabled per-item when `col.toggleable === false`. |
| [DataTableFilterPopover.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableFilterPopover.tsx) | Per-column filter UI: multi-select checkbox list (options from `col.filter.options` or auto-derived, capped at 250) or text `TextField`. Clear/Close buttons. |
| [DataTableTotalsFooter.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/DataTableTotalsFooter.tsx) | Sticky bottom row aligned to the same grid template, showing `totals[col.key]` where `col.total` is set. |
| [ToolbarSearch.tsx](/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/components/ToolbarSearch.tsx) | Dual mode: `'simple'` = debounced plain `TextField` (Enter always fires, plus debounce if `debounceMs` given); `'advanced'` = chip-based `Autocomplete`, supports free-text chips, emits `{optionIds, customQueries}`. |

## 6. Context — settings slot injection

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/context/DataTableActionsContext.tsx
```

Two separate contexts (split deliberately to avoid re-render cascades):

- `DataTableSettingsSlotContext` — holds the `ReactNode` slot content, read via `useDataTableSettingsSlot()`.
- `DataTableSettingsActionsContext` — holds stable `{ setSettingsSlot, clearSettingsSlot }` setters, read via `useDataTableSettingsActions()`. Memoized so slot-content changes don't re-render subscribers of the *actions* context.

`DataTableActionsProvider` is mounted app-wide in:

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/layouts/dashboard/layout.tsx:257
```
(imported at line 24). Every `DataTable` instance calls `useDataTableSettingsActions()` internally
(`DataTable.tsx:409`) to push a column-settings gear icon + reset icon into whatever surface reads
`useDataTableSettingsSlot()` (typically a page's tabs/section header bar).

## 7. Utils reference

| File | Key exports |
|---|---|
| `utils/config-helpers.ts` | `mergeConfig(columns, defaultConfig, persisted)` — order precedence: `persisted.order ?? defaultConfig.order ?? allKeys` (new columns appended at end); visibility precedence: `persisted[key] ?? defaultConfig[key] ?? col.defaultVisible ?? true` (forced `true` if `toggleable === false`); widths: `{...defaultConfig.widths, ...persisted.widths}`. |
| `utils/formatting.ts` | `clamp(n,min,max)`; `defaultNumberFormat(v)` (space-grouped thousands, comma decimal); `getCellValue<T>(col,row)`; `toComparable(v)` (normalizes for sort — Dates→`getTime()`, bool→0/1, strings lowercased); `nextSort(dir)` (`null→asc→desc→null`). |
| `utils/grid-helpers.ts` | `resolveColumnTrack(width, persistedWidth, minWidth?, maxWidth?)`; `computeMinTableWidth(...)`; `buildGridTemplate(visibleCols, widths, opts)` — all handle the `checkbox`/`row-number`/`actions` reserved leading/trailing tracks. `'<n>fr'` widths are wrapped as `minmax(n*110px, <n>fr)`. |
| `utils/helpers.ts` | `isSpecial(key)` type guard for `'__checkbox__' | '__rowNumber__' | '__actions__'`; `computeTotal<T>(col, rows)`; `formatTotal<T>(col, value)`; `buildPersisted(order, visibility, widths)`. |
| `utils/storage.ts` | `localStorageStrategy: StorageStrategy` — key `utility_dt_${persistKey}`, versioned (`VERSION = 1`), silently no-ops on parse error / version mismatch. |
| `utils/constants.ts` | `SURFACE_BG`, `APP_BG`, `BORDER`, `ACCENT` (CSS var strings); `CELL_SX`; `FILTER_SELECT_SX` (exported for consumers building a custom `filterRow`). |
| `utils/utils.ts` | **Dead file** — entirely commented out, not imported anywhere. Candidate for deletion. |

## 8. Legacy duplicate type

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/common/data-table/types/data-table.ts
```

Defines its own looser `DataTableProps<T>` using `any` for `columns`/`defaultConfig`/`batchActions`/
`rowActions`/`storageStrategy`, and a flattened (non-grouped) shape — `searchValue`/`onSearchChange`/
`page`/`rowsPerPage` directly on the type instead of nested `search`/`pagination` objects. This is
**not** what `components/DataTable.tsx` actually uses (that file defines its own stricter
`DataTableProps<T>` inline), but it's still re-exported via `types/index.ts`. Treat it as stale;
don't design against it.

## 9. Real usage example

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/warehouse/ingredients/components/IngredientsDataTable.tsx
```

```ts
import { DataTable, FILTER_SELECT_SX } from 'src/sections/common/data-table';
```

Pattern:
- Columns built with `useMemo`, plain object literals matching `DataTableColumn<T>` (structural
  typing, not explicitly annotated). `renderCell` delegates to dedicated cell components
  (`IngredientNameCell`, `IngredientColorCell`, …). `actions` column sets `filterable: false`.
- Filtering for `group`/`measurement` is done **outside** the DataTable's own column-filter popover:
  local `groupFilter`/`measurementFilter` state + a custom `filterRow` of two `TextField select`
  filters styled with `FILTER_SELECT_SX` (extended with a focused-label brand color override).
- `<DataTable>` call (lines 154–227):
  - `persistKey="warehouse-ingredients-utility"`
  - `data={filteredIngredients}` — client-filtered by group/measurement before being handed to the table
  - `search={{ value: searchQuery, onChange }}` — resets `page` to 0 on change
  - `pagination={{ page, rowsPerPage, totalCount: total, rowsPerPageOptions: [10,20,50,100], onPageChange, onRowsPerPageChange }}` — server-side, driven by `useIngredients()`
  - `defaultConfig={{ order: [...], visibility: {...all true}, widths: {...} }}`
  - `onReset={() => { setGroupFilter(''); setMeasurementFilter(''); }}` — clears external filter state alongside internal reset
  - `headerActions` — conditional "Add" `RouterLink` button
  - `getRowId={(row) => row.id}`

## 10. Forked copy: `utility-data-table`

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/warehouse/deduction/components/utility-data-table/
```

A **hand-forked, unsynchronized copy** of the entire `common/data-table` directory — identical file
list, but its `DataTable.tsx` imports nothing from `common/data-table`; every sub-component and util
is its own local copy. Confirmed differences:

- No i18n — hardcoded English strings ("Column settings", "Reset to default") vs
  `useTranslate('common')` in the canonical version.
- Missing features present in canonical: `defaultSort`, `onRowHover`, `searchPlaceholder`/`searchDebounceMs`.
- `onReset` is required here (vs optional in canonical).
- Missing the `EMPTY_ARRAY` stable-reference default for `batchActions`/`rowActions` → fresh `[]` every
  render → breaks `DataTableRow`'s `memo()`.
- `reset()` reuses the already-memoized `merged` value instead of recalling `mergeConfig(columns, defaultConfig, null)` — subtly different reset behavior.
- Missing the `sortedDataRef` stability optimization in `commitEdit`.
- Own context hook `useDataTableActionsContext` (merged single context) vs canonical's split
  `useDataTableSettingsActions`/`useDataTableSettingsSlot`. **Its own provider is not mounted anywhere** —
  only the canonical `DataTableActionsProvider` is mounted in `layouts/dashboard/layout.tsx`. If this
  fork's `DataTable` renders without its own local provider somewhere in the tree, its settings-slot
  integration silently no-ops (default context value is a pair of empty functions).

**Recommendation**: don't extend this fork further. Port any needed feature back to
`common/data-table`, then migrate `warehouse/deduction` to use the canonical import and delete this
directory.
