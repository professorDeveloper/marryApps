import type { Insight } from '../data/types';

interface Props {
  items: Insight[];
  variant?: 'grid' | 'row' | 'stack';
}

export function InsightsList({ items, variant = 'grid' }: Props) {
  if (items.length === 0) {
    return <div className="muted">Not enough data for insights.</div>;
  }
  return (
    <ul className={`insights insights--${variant}`}>
      {items.map((it, i) => (
        <li key={i} className={`insight insight--${it.kind}`}>
          <div className="insight-head">
            <span className="insight-title">{it.title}</span>
          </div>
          <div className="insight-value">{it.value}</div>
          <div className="insight-detail">{it.detail}</div>
        </li>
      ))}
    </ul>
  );
}
