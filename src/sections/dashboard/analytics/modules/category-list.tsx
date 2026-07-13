import type { CategoryItem } from '../data/types';
import type { NumFormat } from '../data/formatters';

import { useTranslation } from 'react-i18next';

import { fmtNum } from '../data/formatters';

interface Props {
  items: CategoryItem[];
  numFormat: NumFormat;
  limit?: number;
}

export function CategoryList({ items, numFormat, limit = 8 }: Props) {
  const { t } = useTranslation('menu');
  const shown = items.slice(0, limit);
  const hidden = items.length - shown.length;
  const max = items.length ? Math.max(...items.map((i) => i.revenue)) : 1;
  return (
    <div className="cat-list">
      <table className="cat-table">
        <tbody>
          {shown.map((it, i) => (
            <tr key={`${it.name}-${i}`}>
              <td className="cat-rank mono">#{String(i + 1).padStart(2, '0')}</td>
              <td className="cat-name">{it.name}</td>
              <td className="cat-bar-cell">
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{
                      width: `${(it.revenue / max) * 100}%`,
                      opacity: 0.35 + (1 - i / Math.max(shown.length, 1)) * 0.55,
                    }}
                  />
                </div>
              </td>
              <td className="cat-amt mono">{fmtNum(it.revenue, numFormat)}</td>
              <td className="cat-pct mono">{it.percent.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hidden > 0 && (
        <div className="cat-more">
          {t('analyticsDashboard.categories.moreCategories', { count: hidden })}
        </div>
      )}
    </div>
  );
}
