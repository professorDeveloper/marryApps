import type { GridColDef } from '@mui/x-data-grid';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useGetGoodsReportOrders } from 'src/actions/goods-reports';

import { GenericTableView } from 'src/components/generic-table-view';

const formatAmount = (value: string | number | undefined) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString()} so'm`;
};

const formatPercent = (value: string | number | undefined) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString()}%`;
};

const formatDateTime = (value: string | undefined) => {
  if (!value) return '-';
  return dayjs(value).format('DD.MM.YYYY HH:mm');
};

export function GoodsReportsDetailView() {
  const { t } = useTranslation('menu');
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';
  const waiter_id = searchParams.get('waiter_id') || undefined;
  const hall_id = searchParams.get('hall_id') || undefined;
  const table_id = searchParams.get('table_id') || undefined;

  const { reports, totals, reportsLoading } = useGetGoodsReportOrders(id, {
    start_date,
    end_date,
    waiter_id,
    hall_id,
    table_id,
    limit: 1000,
    offset: 0,
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'bill_no',
        headerName: t('bills.billNo', 'Bill #'),
        width: 100,
      },
      {
        field: 'bill_status',
        headerName: t('bills.status', 'Status'),
        width: 120,
      },
      {
        field: 'opened_at',
        headerName: t('bills.date', 'Date'),
        width: 170,
        renderCell: (params) => formatDateTime(params.row.opened_at),
      },
      {
        field: 'closed_at',
        headerName: t('bills.closedAt', 'Closed At'),
        width: 170,
        renderCell: (params) => formatDateTime(params.row.closed_at),
      },
      {
        field: 'waiter_name',
        headerName: t('goodsReports.waiter', 'Waiter'),
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'hall_name',
        headerName: t('goodsReports.hall', 'Hall'),
        width: 120,
      },
      {
        field: 'table_number',
        headerName: t('goodsReports.table', 'Table'),
        width: 120,
      },
      {
        field: 'total_qty',
        headerName: t('goodsReports.totalQty', 'Total Qty'),
        width: 120,
      },
      {
        field: 'avg_sell_price',
        headerName: t('goodsReports.avgSellPrice', 'Avg sell price'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.avg_sell_price),
      },
      {
        field: 'total_sell',
        headerName: t('goodsReports.totalSell', 'Total sell'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.total_sell),
      },
      {
        field: 'avg_cost_price',
        headerName: t('goodsReports.avgCostPrice', 'Avg cost price'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.avg_cost_price),
      },
      {
        field: 'total_cost',
        headerName: t('goodsReports.totalCost', 'Total cost'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.total_cost),
      },
      {
        field: 'avg_markup',
        headerName: t('goodsReports.avgMarkup', 'Avg markup'),
        width: 150,
        renderCell: (params) => formatAmount(params.row.avg_markup),
      },
      {
        field: 'total_markup',
        headerName: t('goodsReports.totalMarkup', 'Total markup'),
        width: 160,
        renderCell: (params) => formatAmount(params.row.total_markup),
      },
      {
        field: 'avg_markup_pct',
        headerName: t('goodsReports.avgMarkupPct', 'Avg markup %'),
        width: 150,
        renderCell: (params) => formatPercent(params.row.avg_markup_pct),
      },
    ],
    [t]
  );

  return (
    <>
      <GenericTableView
        data={reports}
        loading={reportsLoading}
        columns={columns}
        idField="order_id"
        breadcrumbs={{
          heading: t('overview.reports.goods', 'Goods report'),
          links: [
            { name: t('app', 'App'), href: paths.menu.root },
            { name: t('overview.reports.title', 'Reports'), href: paths.menu.reports.root },
            { name: t('overview.reports.goods', 'Goods report'), href: paths.menu.reports.goods.root },
            { name: t('common.view', 'View'), href: '' },
          ],
        }}
      />

      {totals && (
        <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(6, 1fr)' },
              gap: 1,
            }}
          >
            <Card sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('goodsReports.totalQty', 'Total Qty')}
              </Typography>
              <Typography variant="subtitle2">{totals.total_qty ?? 0}</Typography>
            </Card>
            <Card sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('goodsReports.totalSell', 'Total sell')}
              </Typography>
              <Typography variant="subtitle2">{formatAmount(totals.total_sell)}</Typography>
            </Card>
            <Card sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('goodsReports.totalCost', 'Total cost')}
              </Typography>
              <Typography variant="subtitle2">{formatAmount(totals.total_cost)}</Typography>
            </Card>
            <Card sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('goodsReports.totalMarkup', 'Total markup')}
              </Typography>
              <Typography variant="subtitle2">{formatAmount(totals.total_markup)}</Typography>
            </Card>
            <Card sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('goodsReports.avgMarkupPct', 'Avg markup %')}
              </Typography>
              <Typography variant="subtitle2">{formatPercent(totals.avg_markup_pct)}</Typography>
            </Card>
            <Card sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('goodsReports.totalCount', 'Total count')}
              </Typography>
              <Typography variant="subtitle2">{totals.total_orders ?? 0}</Typography>
            </Card>
          </Box>
        </Box>
      )}
    </>
  );
}

export default GoodsReportsDetailView;
