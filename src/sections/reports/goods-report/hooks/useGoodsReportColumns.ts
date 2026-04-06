import type { TotalRule, CLColumnDef } from 'src/components/configurable-list';
import type { IGoodsReportItem, IGoodsReportsTotals } from 'src/types/goods-reports';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatAmount, formatPercent } from '../utils/formatters';

export function useGoodsReportColumns() {
  const { t } = useTranslation('menu');

  const columns = useMemo<CLColumnDef<IGoodsReportItem>[]>(
    () => [
      {
        field: 'name',
        headerName: t('goodsReports.good', 'Good'),
        minWidth: 220,
        flex: 1,
        reorderable: false,
        clHideable: false,
        group: 'General',
      },
      {
        field: 'total_qty',
        headerName: t('goodsReports.totalQty', 'Total Qty'),
        width: 120,
        group: 'Quantity',
      },
      {
        field: 'avg_sell_price',
        headerName: t('goodsReports.avgSellPrice', 'Avg sell price'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.avg_sell_price),
        group: 'Sales',
      },
      {
        field: 'total_sell',
        headerName: t('goodsReports.totalSell', 'Total sell'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.total_sell),
        group: 'Sales',
      },
      {
        field: 'avg_cost_price',
        headerName: t('goodsReports.avgCostPrice', 'Avg cost price'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.avg_cost_price),
        group: 'Cost',
      },
      {
        field: 'total_cost',
        headerName: t('goodsReports.totalCost', 'Total cost'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.total_cost),
        group: 'Cost',
      },
      {
        field: 'avg_markup',
        headerName: t('goodsReports.avgMarkup', 'Avg markup'),
        width: 150,
        renderCell: (params) => formatAmount(params.row.avg_markup),
        group: 'Markup',
      },
      {
        field: 'total_markup',
        headerName: t('goodsReports.totalMarkup', 'Total markup'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.total_markup),
        group: 'Markup',
      },
      {
        field: 'avg_markup_pct',
        headerName: t('goodsReports.avgMarkupPct', 'Avg markup %'),
        width: 150,
        renderCell: (params) => formatPercent(params.row.avg_markup_pct),
        group: 'Markup',
      },
    ],
    [t]
  );

  return columns;
}

export function useGoodsReportTotalRules(totals: IGoodsReportsTotals | undefined) {
  return useMemo<TotalRule<IGoodsReportItem>[]>(
    () => [
      {
        field: 'total_qty',
        aggregation: 'custom',
        compute: () => totals?.total_qty ?? 0,
        format: (v) => v.toLocaleString(),
      },
      {
        field: 'total_sell',
        aggregation: 'custom',
        compute: () => totals?.total_sell ?? '0',
        format: (v) => formatAmount(v),
      },
      {
        field: 'total_cost',
        aggregation: 'custom',
        compute: () => totals?.total_cost ?? '0',
        format: (v) => formatAmount(v),
      },
      {
        field: 'total_markup',
        aggregation: 'custom',
        compute: () => totals?.total_markup ?? '0',
        format: (v) => formatAmount(v),
      },
      {
        field: 'avg_markup_pct',
        aggregation: 'custom',
        compute: () => totals?.avg_markup_pct ?? '0',
        format: (v) => formatPercent(v),
      },
    ],
    [totals]
  );
}
