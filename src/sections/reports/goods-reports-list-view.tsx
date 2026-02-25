import type { GridColDef } from '@mui/x-data-grid';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';

import { useGetHalls } from 'src/actions/halls';
import { useGetUsersByRole } from 'src/actions/users';
import { useGetGoodsByCategory } from 'src/actions/categories';
import { useGetGoodsReports } from 'src/actions/goods-reports';
import { useGetCafeTablesByHall } from 'src/actions/cafe-tables';
import { useGetDepartments, useGetCategoriesByDepartment } from 'src/actions/departments';

import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';

const toApiDate = (value: dayjs.Dayjs): string => value.format('YYYY-MM-DD');

const formatAmount = (value: string | number | undefined) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString()} so'm`;
};

const formatPercent = (value: string | number | undefined) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString()}%`;
};

export function GoodsReportsListView() {
  const { t } = useTranslation('menu');

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    department_id: '',
    category_id: '',
    good_id: '',
    waiter_id: '',
    hall_id: '',
    table_id: '',
    limit: 20,
    offset: 0,
  });

  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const { departments } = useGetDepartments();
  const { categories } = useGetCategoriesByDepartment(filters.department_id);
  const { goods } = useGetGoodsByCategory(filters.category_id);
  const { users: waiters } = useGetUsersByRole('waiter');
  const { halls } = useGetHalls();
  const { tables } = useGetCafeTablesByHall(filters.hall_id);

  useEffect(() => {
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    setStartDate(yesterday);
    setEndDate(today);

    setFilters((prev) => ({
      ...prev,
      start_date: toApiDate(yesterday),
      end_date: toApiDate(today),
    }));
  }, []);

  const { reports, totals, reportsLoading } = useGetGoodsReports({
    start_date: filters.start_date,
    end_date: filters.end_date,
    department_id: filters.department_id || undefined,
    category_id: filters.category_id || undefined,
    good_id: filters.good_id || undefined,
    waiter_id: filters.waiter_id || undefined,
    hall_id: filters.hall_id || undefined,
    table_id: filters.table_id || undefined,
    limit: filters.limit,
    offset: filters.offset,
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'name',
        headerName: t('goodsReports.good', 'Good'),
        minWidth: 220,
        flex: 1,
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

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0,
    }));
  }, []);

  const handleApplyDateRange = useCallback(() => {
    const newFilters: Record<string, string> = {};

    if (startDate) newFilters.start_date = toApiDate(startDate);
    if (endDate) newFilters.end_date = toApiDate(endDate);

    handleFilterChange(newFilters);
  }, [startDate, endDate, handleFilterChange]);

  const handleResetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      department_id: '',
      category_id: '',
      good_id: '',
      waiter_id: '',
      hall_id: '',
      table_id: '',
      limit: 20,
      offset: 0,
    }));
  }, []);

  const renderFiltersContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 1.5,
        }}
      >
        <DatePicker
          label={t('goodsReports.startDate', 'Start date')}
          value={startDate}
          onChange={setStartDate}
          format="DD.MM.YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              inputProps: { readOnly: true },
              sx: { cursor: 'pointer' },
            },
          }}
        />

        <DatePicker
          label={t('goodsReports.endDate', 'End date')}
          value={endDate}
          onChange={setEndDate}
          format="DD.MM.YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              inputProps: { readOnly: true },
              sx: { cursor: 'pointer' },
            },
          }}
        />

        <TextField
          select
          size="small"
          fullWidth
          label={t('goodsReports.department', 'Department')}
          value={filters.department_id}
          onChange={(e) =>
            handleFilterChange({
              department_id: e.target.value,
              category_id: '',
              good_id: '',
            })
          }
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">{t('ingredientReports.all', 'All')}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label={t('goodsReports.category', 'Category')}
          value={filters.category_id}
          onChange={(e) =>
            handleFilterChange({
              category_id: e.target.value,
              good_id: '',
            })
          }
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">{t('ingredientReports.all', 'All')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label={t('goodsReports.good', 'Good')}
          value={filters.good_id}
          onChange={(e) => handleFilterChange({ good_id: e.target.value })}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">{t('ingredientReports.all', 'All')}</option>
          {goods.map((good) => (
            <option key={good.id} value={good.id}>
              {good.name}
            </option>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label={t('goodsReports.waiter', 'Waiter')}
          value={filters.waiter_id}
          onChange={(e) => handleFilterChange({ waiter_id: e.target.value })}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">{t('ingredientReports.all', 'All')}</option>
          {waiters.map((waiter) => (
            <option key={waiter.id} value={waiter.id}>
              {waiter.full_name || waiter.username || '-'}
            </option>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label={t('goodsReports.hall', 'Hall')}
          value={filters.hall_id}
          onChange={(e) =>
            handleFilterChange({
              hall_id: e.target.value,
              table_id: '',
            })
          }
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">{t('ingredientReports.all', 'All')}</option>
          {halls.map((hall) => (
            <option key={hall.id} value={hall.id}>
              {hall.name}
            </option>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label={t('goodsReports.table', 'Table')}
          value={filters.table_id}
          onChange={(e) => handleFilterChange({ table_id: e.target.value })}
          SelectProps={{ native: true }}
          InputLabelProps={{ shrink: true }}
        >
          <option value="">{t('ingredientReports.all', 'All')}</option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              #{table.number}
            </option>
          ))}
        </TextField>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            onClick={handleApplyDateRange}
            disabled={!startDate || !endDate}
            sx={{ minWidth: 'auto', flex: 1 }}
          >
            {t('goodsReports.apply', 'Apply')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={handleResetFilters}
            sx={{ minWidth: 'auto', flex: 1 }}
          >
            {t('goodsReports.reset', 'Reset')}
          </Button>
        </Box>
      </Box>

    </Box>
  );

  return (
    <>
      <GenericTableView
        data={reports}
        loading={reportsLoading}
        columns={columns}
        idField="good_id"
        breadcrumbs={{
          heading: t('overview.reports.goods', 'Goods report'),
          links: [
            { name: t('app', 'App'), href: paths.menu.root },
            { name: t('overview.reports.title', 'Reports'), href: paths.menu.reports.root },
            { name: t('overview.reports.goods', 'Goods report'), href: paths.menu.reports.goods.root },
          ],
        }}
        renderFilters={renderFiltersContent}
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
              <Typography variant="subtitle2">{totals.total_count ?? 0}</Typography>
            </Card>
          </Box>
        </Box>
      )}
    </>
  );
}
