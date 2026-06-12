import type { Insight, AnalyticsPayload } from './types';

import { fmtPct, calcDelta, fmtCompact } from './formatters';

export function buildInsights(payload: AnalyticsPayload): Insight[] {
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
    title: 'Best day',
    value: best.label,
    detail: `${fmtCompact(best.revenue)} across ${best.checks_count} check${best.checks_count === 1 ? '' : 's'}`,
  });
  out.push({
    kind: 'compare',
    title: 'Period vs previous',
    value: fmtPct(calcDelta(cur.kpis.revenue, prev.kpis.revenue).value, 1),
    detail: bestPrev
      ? `Last period peaked ${bestPrev.label} (${fmtCompact(bestPrev.revenue)})`
      : 'No prior data',
  });
  out.push({
    kind: 'ops',
    title: 'Active days',
    value: `${daysActive}`,
    detail: `~${fmtCompact(dailyAvg)} per active day`,
  });
  if (cash) {
    out.push({
      kind: 'mix',
      title: 'Cash share',
      value: `${cashShare.toFixed(1)}%`,
      detail: `Card is ${(100 - cashShare).toFixed(1)}%`,
    });
  }
  if (topDish) {
    out.push({
      kind: 'dish',
      title: 'Top dish (revenue)',
      value: topDish.name,
      detail: `${fmtCompact(topDish.revenue)} from ${topDish.quantity} sold`,
    });
  }
  if (topQtyDish) {
    out.push({
      kind: 'dish',
      title: 'Top dish (volume)',
      value: topQtyDish.name,
      detail: `${topQtyDish.quantity} sold for ${fmtCompact(topQtyDish.revenue)}`,
    });
  }
  return out;
}
