import type { DataTableColumn } from '../types/types';

import { clamp } from './formatting';

const MIN_FR_UNIT_PX = 110;

const FR_PATTERN = /^(\d+(?:\.\d+)?)fr$/;

/**
 * Resolve a column width to a CSS grid track value.
 * - number → `minmax(minPx, clamp(w, min, max)px)`
 * - string (e.g. '20%') → used as-is
 * - string (e.g. '1fr') → `minmax(Xpx, 1fr)` so it doesn't collapse below Xpx
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
      const frMatch = width.match(FR_PATTERN);
      if (frMatch) {
        const fr = Number(frMatch[1]);
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
    const frMatch = persistedWidth.match(FR_PATTERN);
    if (frMatch) {
      const fr = Number(frMatch[1]);
      return `minmax(${Math.round(fr * MIN_FR_UNIT_PX)}px, ${persistedWidth})`;
    }
    return persistedWidth;
  }
  // Persisted numeric width
  const w = persistedWidth ?? 160;
  const min = minWidth ?? 120;
  return `minmax(${min}px, ${clamp(w, min, maxWidth ?? 560)}px)`;
}

function trackMinPx(track: string): number {
  const minmaxMatch = track.match(/^minmax\((\d+(?:\.\d+)?)px,/);
  if (minmaxMatch) return Number(minmaxMatch[1]);
  const pxMatch = track.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) return Number(pxMatch[1]);
  return 120;
}

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
