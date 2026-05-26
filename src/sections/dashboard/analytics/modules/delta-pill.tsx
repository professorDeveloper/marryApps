import type { Delta } from '../data/formatters';
import { fmtPct } from '../data/formatters';

interface DeltaPillProps {
  delta: Delta;
  good: 'up' | 'down' | 'flat';
}

export function DeltaPill({ delta, good }: DeltaPillProps) {
  if (delta.direction === 'flat' && delta.value === 0) {
    return <span className="kpi-delta flat">—</span>;
  }
  if (delta.value == null) {
    return <span className="kpi-delta good">new</span>;
  }
  const isPositive = delta.value > 0;
  let tone: 'good' | 'bad' | 'neutral' = 'neutral';
  if (good === 'up') tone = isPositive ? 'good' : 'bad';
  if (good === 'down') tone = isPositive ? 'bad' : 'good';
  if (good === 'flat') tone = 'neutral';
  const arrow = delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→';
  return (
    <span className={`kpi-delta ${tone} ${delta.direction}`}>
      <span className="kpi-delta-num">{fmtPct(delta.value, 1)}</span>
      <span className="kpi-delta-arrow">{arrow}</span>
    </span>
  );
}
