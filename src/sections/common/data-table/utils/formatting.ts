export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function defaultNumberFormat(value: number) {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const result = `${grouped},${decPart}`;
  return negative ? `-${result}` : result;
}

export function getCellValue<T>(col: any, row: T): unknown {
  if (col.getValue) return col.getValue(row);
  return (row as any)?.[col.key];
}

export function toComparable(v: unknown): string | number {
  if (v == null) return '';
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.getTime();
  return String(v).toLowerCase();
}

export function nextSort(dir: any): any {
  if (dir === null) return 'asc';
  if (dir === 'asc') return 'desc';
  return null;
}
