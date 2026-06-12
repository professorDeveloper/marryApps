import type { Kpi } from '../data/types';
import type { NumFormat } from '../data/formatters';

import { DeltaPill } from './delta-pill';
import { fmtInt, fmtNum } from '../data/formatters';

interface KpiCardProps {
  kpi: Kpi;
  numFormat: NumFormat;
  showCompare: boolean;
  variant?: 'default' | 'rail';
}

export function KpiCard({ kpi, numFormat, showCompare, variant = 'default' }: KpiCardProps) {
  const isMoney = kpi.unit === 'money';
  const value = isMoney ? fmtNum(kpi.current, numFormat) : fmtInt(kpi.current);
  const prev = isMoney ? fmtNum(kpi.previous, numFormat) : fmtInt(kpi.previous);
  const isZero = kpi.current === 0 && kpi.previous === 0;
  return (
    <div className={`kpi-card kpi-card--${variant} ${isZero ? 'kpi-card--zero' : ''}`}>
      <div className="kpi-label">{kpi.label}</div>
      <div className="kpi-value-row">
        <div className="kpi-value mono">{value}</div>
        {showCompare && <DeltaPill delta={kpi.delta} good={kpi.good} />}
      </div>
      {showCompare && (
        <div className="kpi-prev">
          <span className="kpi-prev-lbl">prev</span>
          <span className="kpi-prev-val mono">{prev}</span>
        </div>
      )}
    </div>
  );
}

export function KpiStrip({
  kpis,
  numFormat,
  showCompare,
}: {
  kpis: Kpi[];
  numFormat: NumFormat;
  showCompare: boolean;
}) {
  return (
    <div className="kpi-strip">
      {kpis.map((k) => (
        <KpiCard key={k.key} kpi={k} numFormat={numFormat} showCompare={showCompare} />
      ))}
    </div>
  );
}
