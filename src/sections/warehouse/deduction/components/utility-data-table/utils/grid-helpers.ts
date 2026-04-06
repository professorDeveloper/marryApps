import type { DataTableColumn } from '../types/types';

import { clamp } from './formatting';

/**
 * Resolve a column width to a CSS grid track value.
 * - number → `minmax(minPx, clamp(w, min, max)px)`
 * - string (e.g. '20%', '1fr') → used as-is
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
    if (typeof width === 'string') return width;
    // Number width
    const w = width ?? 160;
    const min = minWidth ?? 120;
    return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
  }

  // Use persisted width
  if (typeof persistedWidth === 'string') return persistedWidth;
  // Persisted numeric width
  const w = persistedWidth ?? 160;
  const min = minWidth ?? 120;
  return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
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
