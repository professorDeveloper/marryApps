import type { DataTableColumn } from '../types/types';

import { clamp } from './formatting';

// Floor (in px) used per `fr` unit so columns don't collapse below a usable
// width — this floor is what makes the table scroll horizontally on narrow
// viewports instead of squishing every column unreadably.
const MIN_FR_UNIT_PX = 110;

/**
 * Resolve a column width to a CSS grid track value.
 * - number → `minmax(minPx, clamp(w, min, max)px)`
 * - string `'Nfr'` → `minmax(N * 110px, Nfr)` so the track has a usable floor
 * - other strings (e.g. '20%', 'minmax(...)') → used as-is
 */
export function resolveColumnTrack(
  width: number | string | undefined,
  persistedWidth: number | string,
  minWidth?: number,
  maxWidth?: number
): string {
  // If width is explicitly set (including strings like percentages), use it
  if (width !== undefined) {
    // String widths: percentage, fr, or any CSS value
    if (typeof width === 'string') {
      const frMatch = width.match(/^(\d+(?:\.\d+)?)fr$/);
      if (frMatch) {
        const fr = parseFloat(frMatch[1]);
        return `minmax(${Math.round(fr * MIN_FR_UNIT_PX)}px, ${width})`;
      }
      return width;
    }
    // Number width
    const w = width ?? 160;
    const min = minWidth ?? 120;
    return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
  }

  // Use persisted width
  if (typeof persistedWidth === 'string') {
    const frMatch = persistedWidth.match(/^(\d+(?:\.\d+)?)fr$/);
    if (frMatch) {
      const fr = parseFloat(frMatch[1]);
      return `minmax(${Math.round(fr * MIN_FR_UNIT_PX)}px, ${persistedWidth})`;
    }
    return persistedWidth;
  }
  // Persisted numeric width
  const w = persistedWidth ?? 160;
  const min = minWidth ?? 120;
  return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
}

/** Extract the floor (px) of a resolved grid track, for summing min table width. */
function trackMinPx(track: string): number {
  const minmaxMatch = track.match(/^minmax\((\d+(?:\.\d+)?)px/);
  if (minmaxMatch) return parseFloat(minmaxMatch[1]);
  const pxMatch = track.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  // Percentages and other units don't have a meaningful floor on their own.
  return 120;
}

export function buildGridTemplate<T>(
  visibleCols: DataTableColumn<T>[],
  widths: Record<string, number | string>,
  opts: { showCheckboxes?: boolean; showRowNumbers?: boolean; showActions?: boolean } = {}
): string {
  const parts: string[] = [];
  if (opts.showCheckboxes) parts.push('44px');
  if (opts.showRowNumbers) parts.push('56px');
  for (const c of visibleCols) {
    const width = widths[c.key];
    // If there's a configured width (e.g. '15%'), use it directly; otherwise fall back to column definition
    const resolvedWidth = width !== undefined ? width : c.width;
    const numericFallback = typeof resolvedWidth === 'string' ? 160 : (resolvedWidth ?? 160);
    parts.push(resolveColumnTrack(resolvedWidth, numericFallback, c.minWidth, c.maxWidth));
  }
  if (opts.showActions) parts.push('44px'); // actions column
  return parts.join(' ');
}

/**
 * Sum the minimum pixel widths of every track in the grid, so the header,
 * rows and totals footer can share a single `minWidth` and grow together
 * inside a horizontally-scrollable wrapper.
 */
export function computeMinTableWidth<T>(
  visibleCols: DataTableColumn<T>[],
  widths: Record<string, number | string>,
  opts: { showCheckboxes?: boolean; showRowNumbers?: boolean; showActions?: boolean } = {}
): number {
  let total = 0;
  if (opts.showCheckboxes) total += 44;
  if (opts.showRowNumbers) total += 56;
  for (const c of visibleCols) {
    const width = widths[c.key];
    const resolvedWidth = width !== undefined ? width : c.width;
    const numericFallback = typeof resolvedWidth === 'string' ? 160 : (resolvedWidth ?? 160);
    total += trackMinPx(resolveColumnTrack(resolvedWidth, numericFallback, c.minWidth, c.maxWidth));
  }
  if (opts.showActions) total += 44;
  return total;
}
