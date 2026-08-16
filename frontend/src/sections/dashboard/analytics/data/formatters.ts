export type NumFormat = 'compact' | 'full';

export const fmtCompact = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(abs >= 1e10 ? 0 : 1).replace(/\.0$/, '')}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(abs >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(abs >= 1e4 ? 0 : 1).replace(/\.0$/, '')}K`;
  return Math.round(n).toString();
};

export const fmtFull = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const fmtNum = (n: number | null | undefined, mode: NumFormat): string =>
  mode === 'full' ? fmtFull(n) : fmtCompact(n);

export const fmtInt = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const fmtPct = (n: number | null | undefined, d = 1): string => {
  if (n == null || Number.isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(d) + '%';
};

export type DeltaDirection = 'up' | 'down' | 'flat';
export interface Delta {
  value: number | null;
  direction: DeltaDirection;
}

export const calcDelta = (cur: number, prev: number): Delta => {
  if (prev === 0 && cur === 0) return { value: 0, direction: 'flat' };
  if (prev === 0) return { value: null, direction: cur > 0 ? 'up' : 'flat' };
  const v = ((cur - prev) / prev) * 100;
  return { value: v, direction: v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat' };
};

export const toNumber = (v: string | number | null | undefined): number => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
