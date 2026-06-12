import type { Tweaks } from '../tweaks/use-tweaks';
import type { Kpi, Insight, AnalyticsPayload } from '../data/types';

import { DeltaPill } from '../modules/delta-pill';
import { TopDishes } from '../modules/top-dishes';
import { fmtInt, fmtNum } from '../data/formatters';
import { CategoryList } from '../modules/category-list';
import { PaymentSplit } from '../modules/payment-split';
import { InsightsList } from '../modules/insights-list';
import { SalesDynamics } from '../modules/sales-dynamics';
import { HourlyHeatmap } from '../modules/hourly-heatmap';

interface Props {
  tweaks: Tweaks;
  payload: AnalyticsPayload;
  kpis: Kpi[];
  insights: Insight[];
}

export function LayoutBento({ tweaks, payload, kpis, insights }: Props) {
  const showCompare = tweaks.compare;
  const rev = kpis.find((k) => k.key === 'revenue');
  const checks = kpis.find((k) => k.key === 'checks_count');
  const avg = kpis.find((k) => k.key === 'average_check');
  const tail = kpis.filter((k) => !['revenue', 'checks_count', 'average_check'].includes(k.key));
  if (!rev || !checks || !avg) return null;
  return (
    <div className="layout-bento">
      {tweaks.sec_kpis && (
        <>
          <div className="bento-cell bento-hero">
            <div className="bento-eyebrow">REVENUE</div>
            <div className="bento-hero-value mono">{fmtNum(rev.current, tweaks.numFormat)}</div>
            {showCompare && (
              <div className="bento-hero-delta">
                <DeltaPill delta={rev.delta} good={rev.good} />
                <span className="muted mono"> vs {fmtNum(rev.previous, tweaks.numFormat)}</span>
              </div>
            )}
          </div>
          <div className="bento-cell bento-kpi">
            <div className="bento-eyebrow">CHECKS</div>
            <div className="bento-kpi-value mono">{fmtInt(checks.current)}</div>
            {showCompare && <DeltaPill delta={checks.delta} good={checks.good} />}
          </div>
          <div className="bento-cell bento-kpi">
            <div className="bento-eyebrow">AVG CHECK</div>
            <div className="bento-kpi-value mono">{fmtNum(avg.current, tweaks.numFormat)}</div>
            {showCompare && <DeltaPill delta={avg.delta} good={avg.good} />}
          </div>
          <div className="bento-cell bento-kpi-mini">
            {tail.map((k) => {
              const isZero = k.current === 0 && k.previous === 0;
              return (
                <div key={k.key} className={`bento-mini-row ${isZero ? 'is-zero' : ''}`}>
                  <span className="bento-mini-lbl">{k.label}</span>
                  <span className="bento-mini-val mono">
                    {k.unit === 'money' ? fmtNum(k.current, tweaks.numFormat) : fmtInt(k.current)}
                  </span>
                  {showCompare && <DeltaPill delta={k.delta} good={k.good} />}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tweaks.sec_sales && (
        <div className="bento-cell bento-chart">
          <header className="bento-card-head">
            <div className="bento-eyebrow">DAILY REVENUE</div>
            <h3 className="bento-card-title">Sales dynamics</h3>
          </header>
          <SalesDynamics
            payload={payload}
            chartStyle={tweaks.chartStyle}
            showCompare={showCompare}
            numFormat={tweaks.numFormat}
          />
        </div>
      )}

      {tweaks.sec_payments && (
        <div className="bento-cell bento-payment">
          <header className="bento-card-head">
            <div className="bento-eyebrow">SPLIT</div>
            <h3 className="bento-card-title">Payment</h3>
          </header>
          <PaymentSplit items={payload.current.payment_types} numFormat={tweaks.numFormat} variant="donut" />
        </div>
      )}

      {tweaks.sec_categories && (
        <div className="bento-cell bento-cats">
          <header className="bento-card-head">
            <div className="bento-eyebrow">MIX</div>
            <h3 className="bento-card-title">Categories</h3>
          </header>
          <CategoryList items={payload.current.categories} numFormat={tweaks.numFormat} limit={6} />
        </div>
      )}

      {tweaks.sec_dishes && (
        <div className="bento-cell bento-dishes">
          <header className="bento-card-head">
            <div className="bento-eyebrow">REVENUE RANK</div>
            <h3 className="bento-card-title">Top dishes</h3>
          </header>
          <TopDishes items={payload.current.dish_sales} numFormat={tweaks.numFormat} style={tweaks.dishesStyle} />
        </div>
      )}

      {tweaks.sec_insights && (
        <div className="bento-cell bento-insights">
          <header className="bento-card-head">
            <div className="bento-eyebrow">INSIGHTS</div>
            <h3 className="bento-card-title">Auto-generated</h3>
          </header>
          <InsightsList items={insights} variant="row" />
        </div>
      )}

      {tweaks.sec_heatmap && (
        <div className="bento-cell bento-heatmap">
          <header className="bento-card-head">
            <div className="bento-eyebrow">WHEN ARE WE BUSY</div>
            <h3 className="bento-card-title">Hourly activity</h3>
          </header>
          <HourlyHeatmap />
        </div>
      )}
    </div>
  );
}
