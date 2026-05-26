import type { NumFormat } from '../data/formatters';
import { fmtNum } from '../data/formatters';
import type { DishItem } from '../data/types';

export type DishesStyle = 'table' | 'cards' | 'podium';

interface Props {
  items: DishItem[];
  numFormat: NumFormat;
  style: DishesStyle;
}

function Table({ items, numFormat }: { items: DishItem[]; numFormat: NumFormat }) {
  const maxRev = items.length ? Math.max(...items.map((i) => i.revenue)) : 1;
  return (
    <table className="dish-table">
      <thead>
        <tr>
          <th className="dish-th-rank">#</th>
          <th>Dish</th>
          <th className="dish-th-num">Qty</th>
          <th className="dish-th-num">Revenue</th>
          <th className="dish-th-bar">Share</th>
        </tr>
      </thead>
      <tbody>
        {items.map((d, i) => (
          <tr key={`${d.name}-${i}`}>
            <td className="dish-rank mono">{String(i + 1).padStart(2, '0')}</td>
            <td className="dish-name">{d.name}</td>
            <td className="dish-qty mono">{d.quantity}</td>
            <td className="dish-rev mono">{fmtNum(d.revenue, numFormat)}</td>
            <td className="dish-bar-cell">
              <div className="dish-bar-track">
                <div className="dish-bar-fill" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Cards({ items, numFormat }: { items: DishItem[]; numFormat: NumFormat }) {
  const maxRev = items.length ? Math.max(...items.map((i) => i.revenue)) : 1;
  return (
    <ul className="dish-cards">
      {items.map((d, i) => (
        <li key={`${d.name}-${i}`} className="dish-card">
          <div className="dish-card-row">
            <span className="dish-card-rank mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="dish-card-name">{d.name}</span>
            <span className="dish-card-rev mono">{fmtNum(d.revenue, numFormat)}</span>
          </div>
          <div className="dish-card-bar">
            <div className="dish-card-bar-fill" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
          </div>
          <div className="dish-card-meta">
            <span className="mono">{d.quantity} sold</span>
            <span className="muted">·</span>
            <span className="mono muted">avg {fmtNum(d.quantity ? d.revenue / d.quantity : 0, numFormat)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Podium({ items, numFormat }: { items: DishItem[]; numFormat: NumFormat }) {
  if (items.length === 0) return <div className="muted">No dish data</div>;
  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  const maxRev = top3[0]?.revenue || 1;
  return (
    <div className="dish-split">
      <ul className="dish-podium">
        {top3.map((d, i) => (
          <li key={`${d.name}-${i}`} className={`dish-podium-card rank-${i + 1}`}>
            <div className="dish-podium-rank mono">#{i + 1}</div>
            <div className="dish-podium-name">{d.name}</div>
            <div className="dish-podium-rev mono">{fmtNum(d.revenue, numFormat)}</div>
            <div className="dish-podium-qty mono muted">{d.quantity} sold</div>
            <div className="dish-podium-bar">
              <div className="dish-podium-bar-fill" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <ul className="dish-rest">
        {rest.map((d, i) => (
          <li key={`${d.name}-${i}`}>
            <span className="dish-rest-rank mono">{String(i + 4).padStart(2, '0')}</span>
            <span className="dish-rest-name">{d.name}</span>
            <span className="dish-rest-qty mono muted">{d.quantity}×</span>
            <span className="dish-rest-rev mono">{fmtNum(d.revenue, numFormat)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopDishes({ items, numFormat, style }: Props) {
  if (items.length === 0) {
    return <div className="muted">No dish data</div>;
  }
  switch (style) {
    case 'cards':
      return <Cards items={items} numFormat={numFormat} />;
    case 'podium':
      return <Podium items={items} numFormat={numFormat} />;
    case 'table':
    default:
      return <Table items={items} numFormat={numFormat} />;
  }
}
