import { Panel } from '../modules/panel';
import { KpiCard } from '../modules/kpi-card';
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

export function LayoutSidebar({ tweaks, payload, kpis, insights }: Props) {
  const showCompare = tweaks.compare;
  return (
    <div className="layout-sidebar">
      {tweaks.sec_kpis && (
        <aside className="layout-sidebar-rail">
          <div className="rail-eyebrow">KEY METRICS</div>
          <div className="rail-kpis">
            {kpis.map((k) => (
              <KpiCard key={k.key} kpi={k} numFormat={tweaks.numFormat} showCompare={showCompare} variant="rail" />
            ))}
          </div>
        </aside>
      )}
      <div className="layout-sidebar-main">
        {tweaks.sec_sales && (
          <Panel title="Sales dynamics" eyebrow="DAILY REVENUE">
            <SalesDynamics
              payload={payload}
              chartStyle={tweaks.chartStyle}
              showCompare={showCompare}
              numFormat={tweaks.numFormat}
            />
          </Panel>
        )}
        <div className="layout-sidebar-grid">
          {tweaks.sec_categories && (
            <Panel title="Categories" eyebrow="MIX">
              <CategoryList items={payload.current.categories} numFormat={tweaks.numFormat} limit={8} />
            </Panel>
          )}
          {tweaks.sec_payments && (
            <Panel title="Payment types" eyebrow="SPLIT">
              <PaymentSplit items={payload.current.payment_types} numFormat={tweaks.numFormat} variant="bar" />
            </Panel>
          )}
          {tweaks.sec_insights && (
            <Panel title="Insights" eyebrow="AUTO">
              <InsightsList items={insights} variant="stack" />
            </Panel>
          )}
        </div>
        {tweaks.sec_dishes && (
          <Panel title="Top dishes" eyebrow="REVENUE">
            <TopDishes items={payload.current.dish_sales} numFormat={tweaks.numFormat} style={tweaks.dishesStyle} />
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
