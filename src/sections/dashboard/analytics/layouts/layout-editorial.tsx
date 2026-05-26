import { Panel } from '../modules/panel';
import { DeltaPill } from '../modules/delta-pill';
import { SalesDynamics } from '../modules/sales-dynamics';
import { CategoryList } from '../modules/category-list';
import { PaymentSplit } from '../modules/payment-split';
import { TopDishes } from '../modules/top-dishes';
import { InsightsList } from '../modules/insights-list';
import { HourlyHeatmap } from '../modules/hourly-heatmap';
import { fmtInt, fmtNum } from '../data/formatters';
import type { AnalyticsPayload, Insight, Kpi } from '../data/types';
import type { Tweaks } from '../tweaks/use-tweaks';

interface Props {
  tweaks: Tweaks;
  payload: AnalyticsPayload;
  kpis: Kpi[];
  insights: Insight[];
}

export function LayoutEditorial({ tweaks, payload, kpis, insights }: Props) {
  const showCompare = tweaks.compare;
  const rev = kpis.find((k) => k.key === 'revenue');
  const checks = kpis.find((k) => k.key === 'checks_count');
  const avg = kpis.find((k) => k.key === 'average_check');
  const tail = kpis.filter((k) => !['revenue', 'checks_count', 'average_check'].includes(k.key));
  if (!rev || !checks || !avg) return null;
  return (
    <div className="layout-editorial">
      {tweaks.sec_kpis && (
        <>
          <header className="editorial-hero">
            <div className="editorial-hero-main">
              <div className="editorial-eyebrow">PERIOD REVENUE</div>
              <div className="editorial-hero-value mono">{fmtNum(rev.current, tweaks.numFormat)}</div>
              {showCompare && (
                <div className="editorial-hero-delta">
                  <DeltaPill delta={rev.delta} good={rev.good} />
                  <span className="muted mono">vs {fmtNum(rev.previous, tweaks.numFormat)} previous</span>
                </div>
              )}
            </div>
            <div className="editorial-hero-side">
              <div className="editorial-side-card">
                <div className="editorial-side-lbl">CHECKS</div>
                <div className="editorial-side-val mono">{fmtInt(checks.current)}</div>
                {showCompare && <DeltaPill delta={checks.delta} good={checks.good} />}
              </div>
              <div className="editorial-side-card">
                <div className="editorial-side-lbl">AVG CHECK</div>
                <div className="editorial-side-val mono">{fmtNum(avg.current, tweaks.numFormat)}</div>
                {showCompare && <DeltaPill delta={avg.delta} good={avg.good} />}
              </div>
            </div>
          </header>
          <div className="editorial-tail">
            {tail.map((k) => {
              const isZero = k.current === 0 && k.previous === 0;
              return (
                <div key={k.key} className={`editorial-tail-cell ${isZero ? 'is-zero' : ''}`}>
                  <span className="editorial-tail-lbl">{k.label}</span>
                  <span className="editorial-tail-val mono">
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
        <Panel title="Sales dynamics" eyebrow="DAY BY DAY">
          <SalesDynamics
            payload={payload}
            chartStyle={tweaks.chartStyle}
            showCompare={showCompare}
            numFormat={tweaks.numFormat}
          />
        </Panel>
      )}

      <div className="editorial-cols">
        <div className="editorial-col-wide">
          {tweaks.sec_dishes && (
            <Panel title="Top dishes" eyebrow="REVENUE RANK">
              <TopDishes items={payload.current.dish_sales} numFormat={tweaks.numFormat} style={tweaks.dishesStyle} />
            </Panel>
          )}
        </div>
        <div className="editorial-col-narrow">
          {tweaks.sec_categories && (
            <Panel title="Categories" eyebrow="REVENUE MIX">
              <CategoryList items={payload.current.categories} numFormat={tweaks.numFormat} limit={6} />
            </Panel>
          )}
          {tweaks.sec_payments && (
            <Panel title="Payment" eyebrow="SPLIT">
              <PaymentSplit items={payload.current.payment_types} numFormat={tweaks.numFormat} variant="bar" />
            </Panel>
          )}
        </div>
      </div>

      {tweaks.sec_insights && (
        <Panel title="What's interesting" eyebrow="INSIGHTS">
          <InsightsList items={insights} variant="row" />
        </Panel>
      )}
      {tweaks.sec_heatmap && (
        <Panel title="Hourly activity" eyebrow="HEATMAP">
          <HourlyHeatmap />
        </Panel>
      )}
    </div>
  );
}
