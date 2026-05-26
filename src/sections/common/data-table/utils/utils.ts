
// // Application theme colors - matching the theme-config.ts
// export const SURFACE_BG = 'background.paper';
// export const APP_BG = 'background.default';
// export const BORDER = 'divider';
// export const ACCENT = 'warning.main'; // Using warning.main which matches the orange accent color #FFAB00

// export function clamp(n: number, min: number, max: number) {
//   return Math.max(min, Math.min(max, n));
// }

// export function defaultNumberFormat(value: number) {
//   return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(value);
// }

// export function getCellValue<T>(col: DataTableColumn<T>, row: T): unknown {
//   if (col.getValue) return col.getValue(row);
//   return (row as any)?.[col.key];
// }

// export function toComparable(v: unknown): string | number {
//   if (v == null) return '';
//   if (typeof v === 'number') return v;
//   if (typeof v === 'boolean') return v ? 1 : 0;
//   if (v instanceof Date) return v.getTime();
//   return String(v).toLowerCase();
// }

// export function nextSort(dir: SortDirection): SortDirection {
//   if (dir === null) return 'asc';
//   if (dir === 'asc') return 'desc';
//   return null;
// }

// /**
//  * Resolve a column width to a CSS grid track value.
//  * - number → `minmax(minPx, clamp(w, min, max)px)`
//  * - string (e.g. '20%', '1fr') → used as-is
//  */
// export function resolveColumnTrack(
//   width: number | string | undefined,
//   persistedWidth: number | string,
//   minWidth?: number,
//   maxWidth?: number
// ): string {
//   // If width is explicitly set (including strings like percentages), use it
//   if (width !== undefined) {
//     // String widths: percentage, fr, or any CSS value
//     if (typeof width === 'string') return width;
//     // Number width
//     const w = width ?? 160;
//     const min = minWidth ?? 120;
//     return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
//   }

//   // Use persisted width
//   if (typeof persistedWidth === 'string') return persistedWidth;
//   // Persisted numeric width
//   const w = persistedWidth ?? 160;
//   const min = minWidth ?? 120;
//   return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
// }

// export function buildGridTemplate<T>(
//   visibleCols: DataTableColumn<T>[],
//   widths: Record<string, number | string>,
//   opts: { showCheckboxes?: boolean; showRowNumbers?: boolean; showActions?: boolean } = {}
// ): string {
//   const parts: string[] = [];
//   if (opts.showCheckboxes) parts.push('44px');
//   if (opts.showRowNumbers) parts.push('56px');
//   for (const c of visibleCols) {
//     const width = widths[c.key];
//     // If there's a configured width (e.g. '15%'), use it directly; otherwise fall back to column definition
//     const resolvedWidth = width !== undefined ? width : c.width;
//     const numericFallback = typeof resolvedWidth === 'string' ? 160 : (resolvedWidth ?? 160);
//     parts.push(resolveColumnTrack(resolvedWidth, numericFallback, c.minWidth, c.maxWidth));
//   }
//   if (opts.showActions) parts.push('44px'); // actions column
//   return parts.join(' ');
// }

// export function mergeConfig<T>(
//   columns: DataTableColumn<T>[],
//   defaultConfig: {
//     order?: string[];
//     visibility?: Record<string, boolean>;
//     widths?: Record<string, number | string>;
//   },
//   persisted: PersistedDataTableConfig | null
// ) {
//   const allKeys = columns.map((c) => c.key);
//   const keySet = new Set(allKeys);

//   const baseOrder = (persisted?.order ?? defaultConfig.order ?? allKeys).filter((k) => keySet.has(k));
//   const missing = allKeys.filter((k) => !baseOrder.includes(k));
//   const order = [...baseOrder, ...missing];

//   const visibility: Record<string, boolean> = {};
//   for (const c of columns) {
//     const def = c.defaultVisible ?? true;
//     const fromDefault = defaultConfig.visibility?.[c.key];
//     const fromPersisted = persisted?.visibility?.[c.key];
//     const v = fromPersisted ?? fromDefault ?? def;
//     visibility[c.key] = c.toggleable === false ? true : v;
//   }

//   const widths: Record<string, number | string> = { ...(defaultConfig.widths ?? {}) };
//   if (persisted?.widths) Object.assign(widths, persisted.widths);

//   return { order, visibility, widths };
// }

