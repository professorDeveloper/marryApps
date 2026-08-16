import type { DataTableColumn } from '../types/types';

import { getCellValue, defaultNumberFormat } from './index';

export type SpecialColumn = '__checkbox__' | '__rowNumber__' | '__actions__';

export function isSpecial(key: string): key is SpecialColumn {
  return key === '__checkbox__' || key === '__rowNumber__' || key === '__actions__';
}

export function computeTotal<T>(col: DataTableColumn<T>, rows: T[]) {
  if (!col.total) return null;

  if (col.total.aggregation === 'custom') {
    return col.total.compute(rows);
  }

  if (col.total.aggregation === 'count') {
    return rows.length;
  }

  const values = rows
    .map((r) => {
      const v = getCellValue(col, r);
      if (typeof v === 'number') return v;
      const n = typeof v === 'string' ? Number(v) : Number(v as any);
      return Number.isFinite(n) ? n : NaN;
    })
    .filter((n) => !Number.isNaN(n));

  if (values.length === 0) return 0;

  if (col.total.aggregation === 'sum') return values.reduce((a, b) => a + b, 0);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function formatTotal<T>(col: DataTableColumn<T>, value: string | number) {
  if (!col.total) return '';
  if (typeof value === 'string') return value;
  if (col.total.aggregation === 'custom') return String(value);
  const fmt = col.total.format ?? defaultNumberFormat;
  return fmt(value);
}

export function buildPersisted(
  order: string[],
  visibility: Record<string, boolean>,
  widths: Record<string, number | string>
) {
  return { version: 1, order, visibility, widths };
}
