import type { TFunction } from 'i18next';
import type { Insight, AnalyticsPayload } from './types';

import { fmtPct, calcDelta, fmtCompact } from './formatters';

export function buildInsights(t: TFunction, payload: AnalyticsPayload): Insight[] {
  const cur = payload.current;
  const prev = payload.previous;
  const sd = cur.sales_dynamics;
  if (sd.length === 0) return [];
  const best = sd.reduce((a, b) => (b.revenue > a.revenue ? b : a), sd[0]);
  const bestPrev = prev.sales_dynamics.length
    ? prev.sales_dynamics.reduce((a, b) => (b.revenue > a.revenue ? b : a), prev.sales_dynamics[0])
    : null;
  const daysActive = sd.length;
  const dailyAvg = cur.kpis.revenue / Math.max(daysActive, 1);
  const cash = cur.payment_types.find((p) => p.type.toLowerCase() === 'cash');
  const cashShare = cash?.percent ?? 0;
  const topDish = cur.dish_sales[0];
  const topQtyDish = [...cur.dish_sales].sort((a, b) => b.quantity - a.quantity)[0];

  const out: Insight[] = [];
  out.push({
    kind: 'peak',
    title: t('analyticsDashboard.insights.bestDay'),
    value: best.label,
    detail: t('analyticsDashboard.insights.detailChecks', {
      count: best.checks_count,
      revenue: fmtCompact(best.revenue),
    }),
  });
  out.push({
    kind: 'compare',
    title: t('analyticsDashboard.insights.periodVsPrevious'),
    value: fmtPct(calcDelta(cur.kpis.revenue, prev.kpis.revenue).value, 1),
    detail: bestPrev
      ? t('analyticsDashboard.insights.detailLastPeriodPeaked', {
          label: bestPrev.label,
          revenue: fmtCompact(bestPrev.revenue),
        })
      : t('analyticsDashboard.insights.noPriorData'),
  });
  out.push({
    kind: 'ops',
    title: t('analyticsDashboard.insights.activeDays'),
    value: `${daysActive}`,
    detail: t('analyticsDashboard.insights.detailPerActiveDay', { value: fmtCompact(dailyAvg) }),
  });
  if (cash) {
    out.push({
      kind: 'mix',
      title: t('analyticsDashboard.insights.cashShare'),
      value: `${cashShare.toFixed(1)}%`,
      detail: t('analyticsDashboard.insights.detailCardShare', { value: (100 - cashShare).toFixed(1) }),
    });
  }
  if (topDish) {
    out.push({
      kind: 'dish',
      title: t('analyticsDashboard.insights.topDishRevenue'),
      value: topDish.name,
      detail: t('analyticsDashboard.insights.detailTopDishRevenue', {
        revenue: fmtCompact(topDish.revenue),
        count: topDish.quantity,
      }),
    });
  }
  if (topQtyDish) {
    out.push({
      kind: 'dish',
      title: t('analyticsDashboard.insights.topDishVolume'),
      value: topQtyDish.name,
      detail: t('analyticsDashboard.insights.detailTopDishVolume', {
        count: topQtyDish.quantity,
        revenue: fmtCompact(topQtyDish.revenue),
      }),
    });
  }
  return out;
}
