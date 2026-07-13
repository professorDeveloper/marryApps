import type { Tweaks } from '../tweaks/use-tweaks';
import type { Kpi, Insight, AnalyticsPayload } from '../data/types';

import { useTranslation } from 'react-i18next';

import { Panel } from '../modules/panel';
import { KpiCard } from '../modules/kpi-card';
import { TopDishes } from '../modules/top-dishes';
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

export function LayoutSidebar({ tweaks, payload, kpis, insights }: Props) {
  const { t } = useTranslation('menu');
  const showCompare = tweaks.compare;
  return (
    <div className="layout-sidebar">
      {tweaks.sec_kpis && (
        <aside className="layout-sidebar-rail">
          <div className="rail-eyebrow">{t('analyticsDashboard.eyebrows.keyMetrics')}</div>
          <div className="rail-kpis">
            {kpis.map((k) => (
              <KpiCard key={k.key} kpi={k} numFormat={tweaks.numFormat} showCompare={showCompare} variant="rail" />
            ))}
          </div>
        </aside>
      )}
      <div className="layout-sidebar-main">
        {tweaks.sec_sales && (
          <Panel title={t('analyticsDashboard.panels.salesDynamics')} eyebrow={t('analyticsDashboard.eyebrows.dailyRevenue')}>
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
            <Panel title={t('analyticsDashboard.panels.categories')} eyebrow={t('analyticsDashboard.eyebrows.mix')}>
              <CategoryList items={payload.current.categories} numFormat={tweaks.numFormat} limit={8} />
            </Panel>
          )}
          {tweaks.sec_payments && (
            <Panel title={t('analyticsDashboard.panels.paymentTypes')} eyebrow={t('analyticsDashboard.eyebrows.split')}>
              <PaymentSplit items={payload.current.payment_types} numFormat={tweaks.numFormat} variant="bar" />
            </Panel>
          )}
          {tweaks.sec_insights && (
            <Panel title={t('analyticsDashboard.panels.insights')} eyebrow={t('analyticsDashboard.eyebrows.auto')}>
              <InsightsList items={insights} variant="stack" />
            </Panel>
          )}
        </div>
        {tweaks.sec_dishes && (
          <Panel title={t('analyticsDashboard.panels.topDishes')} eyebrow={t('analyticsDashboard.eyebrows.revenue')}>
            <TopDishes items={payload.current.dish_sales} numFormat={tweaks.numFormat} style={tweaks.dishesStyle} />
          </Panel>
        )}
        {tweaks.sec_heatmap && (
          <Panel title={t('analyticsDashboard.panels.hourlyActivity')} eyebrow={t('analyticsDashboard.eyebrows.whenAreWeBusy')}>
            <HourlyHeatmap />
          </Panel>
        )}
      </div>
    </div>
  );
}
