import type { NumFormat } from '../data/formatters';
import type { PaymentTypeItem } from '../data/types';

import { useTranslation } from 'react-i18next';

import { fmtNum } from '../data/formatters';

interface Props {
  items: PaymentTypeItem[];
  numFormat: NumFormat;
  variant?: 'bar' | 'donut';
}

const colors = ['var(--accent)', 'var(--text-3)', 'var(--text-4)'];

export function PaymentSplit({ items, numFormat, variant = 'bar' }: Props) {
  const { t } = useTranslation('menu');
  if (items.length === 0) {
    return <div className="muted">{t('analyticsDashboard.payment.noData')}</div>;
  }
  if (variant === 'donut') {
    const r = 42;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const main = items[0];
    return (
      <div className="payment-donut">
        <svg width="120" height="120" viewBox="-60 -60 120 120">
          <circle r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
          {items.map((it, i) => {
            const len = (it.percent / 100) * c;
            const node = (
              <circle
                key={it.type}
                r={r}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="14"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += len;
            return node;
          })}
          <text textAnchor="middle" dy="-3" className="donut-num mono">
            {main.percent.toFixed(0)}%
          </text>
          <text textAnchor="middle" dy="14" className="donut-sub">
            {main.type}
          </text>
        </svg>
        <ul className="payment-legend">
          {items.map((it, i) => (
            <li key={it.type}>
              <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
              <span className="legend-name">{it.type}</span>
              <span className="legend-val mono">{fmtNum(it.revenue, numFormat)}</span>
              <span className="legend-pct mono">{it.percent.toFixed(2)}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="payment-bar">
      <div className="payment-bar-track">
        {items.map((it) => (
          <div
            key={it.type}
            className={`payment-bar-seg seg-${it.type.toLowerCase()}`}
            style={{ width: `${it.percent}%` }}
            title={`${it.type} · ${it.percent.toFixed(2)}%`}
          />
        ))}
      </div>
      <ul className="payment-rows">
        {items.map((it) => (
          <li key={it.type}>
            <span className={`payment-dot dot-${it.type.toLowerCase()}`} />
            <span className="payment-name">{it.type}</span>
            <span className="payment-amt mono">{fmtNum(it.revenue, numFormat)}</span>
            <span className="payment-pct mono">{it.percent.toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
