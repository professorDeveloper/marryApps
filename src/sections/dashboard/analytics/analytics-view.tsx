import type { PeriodId } from './controls/range-chips';
import type { Kpi, Insight, AnalyticsPayload } from './data/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import { buildInsights } from './data/insights';
import { useTweaks } from './tweaks/use-tweaks';
import { AnalyticsGlobalStyles } from './styles';
import { RangeChips } from './controls/range-chips';
import { LayoutBento } from './layouts/layout-bento';
import { LayoutClassic } from './layouts/layout-classic';
import { LayoutSidebar } from './layouts/layout-sidebar';
import { SettingsDrawer } from './tweaks/settings-drawer';
import { LayoutEditorial } from './layouts/layout-editorial';
import { useAnalyticsData, resolvePeriodRange, formatPeriodSummary } from './data/use-analytics-data';

const EMPTY_PAYLOAD: AnalyticsPayload = {
  current: {
    period: { start: '', end: '' },
    kpis: { revenue: 0, checks_count: 0, average_check: 0, returns_count: 0, discounts_amount: 0, vat_amount: 0 },
    sales_dynamics: [],
    payment_types: [],
    categories: [],
    dish_sales: [],
  },
  previous: {
    period: { start: '', end: '' },
    kpis: { revenue: 0, checks_count: 0, average_check: 0, returns_count: 0, discounts_amount: 0, vat_amount: 0 },
    sales_dynamics: [],
    payment_types: [],
    categories: [],
    dish_sales: [],
  },
};

export function AnalyticsView() {
  const { t, i18n } = useTranslation('menu');
  const { tweaks, setTweak, resetTweaks } = useTweaks();
  const [activePeriod, setActivePeriod] = useState<PeriodId>('month');
  const initial = useMemo(() => resolvePeriodRange('month'), []);
  const [startDate, setStartDate] = useState<Date | null>(initial.start);
  const [endDate, setEndDate] = useState<Date | null>(initial.end);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePeriodChange = (p: PeriodId) => {
    setActivePeriod(p);
    const r = resolvePeriodRange(p);
    setStartDate(r.start);
    setEndDate(r.end);
  };

  const effectiveStart = startDate ?? initial.start;
  const effectiveEnd = endDate ?? initial.end;

  const { payload, kpis, loading, window: dateWindow } = useAnalyticsData(
    effectiveStart,
    effectiveEnd,
    activePeriod,
  );

  const effectivePayload: AnalyticsPayload = payload ?? EMPTY_PAYLOAD;
  const effectiveKpis: Kpi[] = kpis.length
    ? kpis
    : [
        { key: 'revenue', label: t('analyticsDashboard.kpis.revenue'), unit: 'money', good: 'up', current: 0, previous: 0, delta: { value: 0, direction: 'flat' } },
        { key: 'checks_count', label: t('analyticsDashboard.kpis.checks_count'), unit: 'int', good: 'up', current: 0, previous: 0, delta: { value: 0, direction: 'flat' } },
        { key: 'average_check', label: t('analyticsDashboard.kpis.average_check'), unit: 'money', good: 'up', current: 0, previous: 0, delta: { value: 0, direction: 'flat' } },
        { key: 'returns_count', label: t('analyticsDashboard.kpis.returns_count'), unit: 'int', good: 'down', current: 0, previous: 0, delta: { value: 0, direction: 'flat' } },
        { key: 'discounts_amount', label: t('analyticsDashboard.kpis.discounts_amount'), unit: 'money', good: 'down', current: 0, previous: 0, delta: { value: 0, direction: 'flat' } },
        { key: 'vat_amount', label: t('analyticsDashboard.kpis.vat_amount'), unit: 'money', good: 'flat', current: 0, previous: 0, delta: { value: 0, direction: 'flat' } },
      ];

  const insights: Insight[] = useMemo(() => (payload ? buildInsights(t, payload) : []), [payload, t]);

  const periodSummary = formatPeriodSummary(dateWindow.start, dateWindow.end, i18n.language);
  const prevSpan = Math.round((dateWindow.end.getTime() - dateWindow.start.getTime()) / 86400000) + 1;
  const compareLabel = tweaks.compare ? t('analyticsDashboard.controls.previousDays', { count: prevSpan }) : null;

  const Layout = (() => {
    switch (tweaks.layout) {
      case 'sidebar':
        return LayoutSidebar;
      case 'editorial':
        return LayoutEditorial;
      case 'bento':
        return LayoutBento;
      case 'classic':
      default:
        return LayoutClassic;
    }
  })();

  // Live accent override applied via tweaks would go here; currently we keep
  // accent locked to the MUI theme.primary so the dashboard always matches the
  // app's brand color.
  useEffect(() => {
    // No-op — accent is provided by the AnalyticsGlobalStyles token bridge.
  }, [tweaks]);

  return (
    <Box
      className="mary-analytics"
      data-density={tweaks.density}
      data-radius={tweaks.radius}
      data-cards={tweaks.cardStyle}
      data-bg-tint={tweaks.bgTint}
      sx={{ position: 'relative', width: '100%' }}
    >
      <AnalyticsGlobalStyles />
      <div className="page-analytics">
        <div className="analytics-controls">
          <RangeChips
            startDate={startDate}
            endDate={endDate}
            activePeriod={activePeriod}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onPeriodChange={handlePeriodChange}
            compareLabel={compareLabel}
          />
          <div className="analytics-controls-right">
            <span className="period-summary mono muted">
              {periodSummary}
              {loading ? ` · ${t('analyticsDashboard.controls.loading')}` : ''}
            </span>
            <IconButton
              size="small"
              onClick={() => setSettingsOpen(true)}
              aria-label={t('analyticsDashboard.settingsAria')}
              sx={{ color: 'var(--text-2)' }}
            >
              <Iconify icon="solar:settings-bold-duotone" width={20} />
            </IconButton>
          </div>
        </div>

        <Layout tweaks={tweaks} payload={effectivePayload} kpis={effectiveKpis} insights={insights} />
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tweaks={tweaks}
        setTweak={setTweak}
        onReset={() => {
          resetTweaks();
        }}
      />
    </Box>
  );
}
