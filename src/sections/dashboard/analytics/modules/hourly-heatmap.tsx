import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

// Placeholder pattern — API doesn't yet expose hourly buckets.
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_WEIGHT = [0.5, 0.7, 0.75, 0.85, 1.0, 1.15, 0.95];

function hourPeak(h: number): number {
  const lunch = Math.exp(-Math.pow((h - 13) / 1.6, 2));
  const dinner = Math.exp(-Math.pow((h - 19.5) / 2, 2)) * 1.15;
  const base = h >= 10 && h <= 23 ? 0.2 : 0.05;
  return base + lunch * 0.5 + dinner * 0.55;
}

export function HourlyHeatmap() {
  const { t } = useTranslation('menu');
  const DAYS = DAY_KEYS.map((k) => t(`analyticsDashboard.heatmap.days.${k}`));
  const cells: { d: number; h: number; v: number }[] = [];
  let max = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 10; h <= 23; h++) {
      const v = hourPeak(h) * DAY_WEIGHT[d];
      cells.push({ d, h, v });
      if (v > max) max = v;
    }
  }
  const cellBg = (alpha: number) => {
    const pct = Math.round(alpha * 90);
    return `color-mix(in oklch, var(--accent) ${pct}%, transparent)`;
  };
  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        <div className="heatmap-corner" />
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="heatmap-h mono">
            {String(10 + i).padStart(2, '0')}
          </div>
        ))}
        {DAYS.map((dn, di) => (
          <Fragment key={dn}>
            <div className="heatmap-d mono">{dn}</div>
            {Array.from({ length: 14 }, (_, hi) => {
              const c = cells[di * 14 + hi];
              const a = c.v / max;
              return (
                <div
                  key={hi}
                  className="heatmap-cell"
                  style={{ background: cellBg(a) }}
                  title={`${dn} ${String(10 + hi).padStart(2, '0')}:00 · ${(a * 100).toFixed(0)}%`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="heatmap-foot">
        <span className="heatmap-tag">{t('analyticsDashboard.heatmap.placeholder')}</span>
        <span className="muted">{t('analyticsDashboard.heatmap.notWired')}</span>
        <span className="heatmap-scale">
          <span className="muted">{t('analyticsDashboard.heatmap.low')}</span>
          {[0.15, 0.3, 0.5, 0.75, 1].map((a, i) => (
            <span key={i} className="heatmap-scale-cell" style={{ background: cellBg(a) }} />
          ))}
          <span className="muted">{t('analyticsDashboard.heatmap.high')}</span>
        </span>
      </div>
    </div>
  );
}
