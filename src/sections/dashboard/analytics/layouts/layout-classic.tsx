import { Panel } from '../modules/panel';
import { KpiStrip } from '../modules/kpi-card';
import { SalesDynamics } from '../modules/sales-dynamics';
import { CategoryList } from '../modules/category-list';
import { PaymentSplit } from '../modules/payment-split';
import { TopDishes } from '../modules/top-dishes';
import { InsightsList } from '../modules/insights-list';
import { HourlyHeatmap } from '../modules/hourly-heatmap';
import type { AnalyticsPayload, Insight, Kpi } from '../data/types';
import type { Tweaks } from '../tweaks/use-tweaks';

interface Props {
  tweaks: Tweaks;
  payload: AnalyticsPayload;
  kpis: Kpi[];
  insights: Insight[];
}

export function LayoutClassic({ tweaks, payload, kpis, insights }: Props) {
  const showCompare = tweaks.compare;
  return (
    <div className="layout-classic">
      {tweaks.sec_kpis && <KpiStrip kpis={kpis} numFormat={tweaks.numFormat} showCompare={showCompare} />}

      {tweaks.sec_sales && (
        <Panel
          title="Sales dynamics"
          eyebrow="DAILY REVENUE"
          action={
            <span className="panel-foot-meta mono muted">
              {showCompare ? 'current vs previous period' : 'current period'}
            </span>
          }
        >
          <SalesDynamics
            payload={payload}
            chartStyle={tweaks.chartStyle}
            showCompare={showCompare}
            numFormat={tweaks.numFormat}
          />
        </Panel>
      )}

      <div className="layout-classic-row-2">
        {tweaks.sec_categories && (
          <Panel title="Revenue by category" eyebrow="MIX">
            <CategoryList items={payload.current.categories} numFormat={tweaks.numFormat} limit={8} />
          </Panel>
        )}
        {tweaks.sec_payments && (
          <Panel title="Payment types" eyebrow="SPLIT">
            <PaymentSplit items={payload.current.payment_types} numFormat={tweaks.numFormat} variant="donut" />
          </Panel>
        )}
      </div>

      {tweaks.sec_dishes && (
        <Panel title="Top dishes" eyebrow={`SORTED BY REVENUE · TOP ${payload.current.dish_sales.length}`}>
          <TopDishes items={payload.current.dish_sales} numFormat={tweaks.numFormat} style={tweaks.dishesStyle} />
        </Panel>
      )}

      <div className="layout-classic-row-2">
        {tweaks.sec_insights && (
          <Panel title="Insights" eyebrow="AUTO-GENERATED">
            <InsightsList items={insights} variant="grid" />
          </Panel>
        )}
        {tweaks.sec_heatmap && (
          <Panel title="Hourly activity" eyebrow="WHEN ARE WE BUSY">
            <HourlyHeatmap />
          </Panel>
        )}
      </div>
    </div>
  );
}
