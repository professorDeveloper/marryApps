import { useEffect, useMemo, useState } from 'react';
import { useDashboardAPI } from 'src/hooks/use-dashboard-api';
import type { DashboardOverviewResponse } from 'src/hooks/use-dashboard-api';
import { calcDelta, toNumber } from './formatters';
import type { AnalyticsPayload, Kpi, KpiKey, PeriodPayload } from './types';

export type PeriodId = 'day' | 'week' | 'month' | 'year';

interface DateWindow {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  groupBy: 'day' | 'week' | 'month';
}

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const endOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
};

export function resolvePeriodRange(period: PeriodId): { start: Date; end: Date } {
  const now = new Date();
  const end = endOfDay(now);
  let start: Date;
  switch (period) {
    case 'day':
      start = startOfDay(now);
      break;
    case 'week': {
      const day = now.getDay(); // 0 = Sunday
      const diff = day === 0 ? 6 : day - 1; // make Monday the week start
      start = startOfDay(new Date(now.getTime() - diff * 86400000));
      break;
    }
    case 'month':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case 'year':
      start = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    default:
      start = startOfDay(now);
  }
  return { start, end };
}

function buildWindow(start: Date, end: Date, period: PeriodId): DateWindow {
  const s = startOfDay(start);
  const e = endOfDay(end);
  const groupBy: 'day' | 'week' | 'month' = period === 'year' ? 'month' : period === 'month' ? 'day' : 'day';
  const span = e.getTime() - s.getTime();
  const previousEnd = new Date(s.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - span);
  return { start: s, end: e, previousStart, previousEnd, groupBy };
}

const KPI_DEFS: { key: KpiKey; label: string; unit: 'money' | 'int'; good: 'up' | 'down' | 'flat' }[] = [
  { key: 'revenue', label: 'Revenue', unit: 'money', good: 'up' },
  { key: 'checks_count', label: 'Checks', unit: 'int', good: 'up' },
  { key: 'average_check', label: 'Average check', unit: 'money', good: 'up' },
  { key: 'returns_count', label: 'Returns', unit: 'int', good: 'down' },
  { key: 'discounts_amount', label: 'Discounts', unit: 'money', good: 'down' },
  { key: 'vat_amount', label: 'VAT', unit: 'money', good: 'flat' },
];

function reshapePeriod(raw: DashboardOverviewResponse['current'] | null | undefined): PeriodPayload {
  const empty: PeriodPayload = {
    period: { start: '', end: '' },
    kpis: { revenue: 0, checks_count: 0, average_check: 0, returns_count: 0, discounts_amount: 0, vat_amount: 0 },
    sales_dynamics: [],
    payment_types: [],
    categories: [],
    dish_sales: [],
  };
  if (!raw) return empty;
  return {
    period: {
      start: raw.period?.start ?? '',
      end: raw.period?.end ?? '',
      group_by: raw.period?.group_by,
    },
    kpis: {
      revenue: toNumber(raw.kpis?.revenue?.value),
      checks_count: toNumber(raw.kpis?.checks_count?.value),
      average_check: toNumber(raw.kpis?.average_check?.value),
      returns_count: toNumber(raw.kpis?.returns_count?.value),
      discounts_amount: toNumber(raw.kpis?.discounts_amount?.value),
      vat_amount: toNumber(raw.kpis?.vat_amount?.value),
    },
    sales_dynamics: (raw.sales_dynamics ?? []).map((d) => ({
      label: d.label,
      revenue: toNumber(d.revenue),
      checks_count: typeof d.checks_count === 'number' ? d.checks_count : toNumber(d.checks_count as unknown as string),
      average_check: toNumber(d.average_check),
    })),
    payment_types: (raw.revenue_by_payment_types?.items ?? []).map((p) => ({
      type: p.payment_type,
      revenue: toNumber(p.revenue),
      percent: toNumber(p.percent),
    })),
    categories: (raw.revenue_by_categories?.items ?? []).map((c) => ({
      name: c.category_name,
      revenue: toNumber(c.revenue),
      percent: toNumber(c.percent),
    })),
    dish_sales: (raw.dish_sales?.items ?? []).map((d) => ({
      name: d.good_name,
      revenue: toNumber(d.revenue),
      quantity: toNumber(d.quantity),
    })),
  };
}

export function useAnalyticsData(start: Date, end: Date, period: PeriodId) {
  const { getDashboardOverview } = useDashboardAPI();
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const window = useMemo(
    () => buildWindow(start, end, period),
    [start.getTime(), end.getTime(), period], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboardOverview({
      start: window.start.toISOString(),
      end: window.end.toISOString(),
      previous_start: window.previousStart.toISOString(),
      previous_end: window.previousEnd.toISOString(),
      group_by: window.groupBy,
    })
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setPayload(null);
        } else {
          setPayload({
            current: reshapePeriod(res.current),
            previous: reshapePeriod(res.previous),
          });
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [getDashboardOverview, window]);

  const kpis: Kpi[] = useMemo(() => {
    if (!payload) return [];
    return KPI_DEFS.map((def) => {
      const cur = payload.current.kpis[def.key];
      const prev = payload.previous.kpis[def.key];
      return {
        ...def,
        current: cur,
        previous: prev,
        delta: calcDelta(cur, prev),
      };
    });
  }, [payload]);

  return { payload, kpis, loading, window };
}

export function formatPeriodSummary(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}
