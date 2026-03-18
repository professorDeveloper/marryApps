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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { useGetHalls } from 'src/actions/halls';
import { useGetUsersByRole } from 'src/actions/users';
import { useGetGoodsByCategory } from 'src/actions/categories';
import { useGetGoodsReports } from 'src/actions/goods-reports';
import { useGetCafeTablesByHall } from 'src/actions/cafe-tables';
import { useGetDepartments, useGetCategoriesByDepartment } from 'src/actions/departments';

import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { NoDataTooltip } from 'src/components/no-data-tooltip';

const toApiStartDateTime = (value: dayjs.Dayjs): string => `${value.format('YYYY-MM-DD')}T00:00:00Z`;
const toApiEndDateTime = (value: dayjs.Dayjs): string => `${value.format('YYYY-MM-DD')}T23:59:59Z`;

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
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    department_id: '',
    category_id: '',
    good_id: '',
    waiter_id: '',
    hall_id: '',
    table_id: '',
    limit: 1000,
    offset: 0,
  });

  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [activeRange, setActiveRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const { departments } = useGetDepartments();
  const { categories } = useGetCategoriesByDepartment(filters.department_id);
  const { goods } = useGetGoodsByCategory(filters.category_id);
  const { users: waiters } = useGetUsersByRole('waiter');
  const { halls } = useGetHalls();
  const { tables } = useGetCafeTablesByHall(filters.hall_id);

  const isDepartmentsEmpty = departments.length === 0;
  const isCategoriesEmpty = categories.length === 0;
  const isGoodsEmpty = goods.length === 0;
  const isWaitersEmpty = waiters.length === 0;
  const isHallsEmpty = halls.length === 0;
  const isTablesEmpty = tables.length === 0;

  useEffect(() => {
    const today = dayjs();
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));

    setFilters((prev) => ({
      ...prev,
      start_date: toApiStartDateTime(today),
      end_date: toApiEndDateTime(today),
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

  // Auto-apply filters when date range changes
  useEffect(() => {
    const newFilters: Record<string, string> = {};

    if (startDate) newFilters.start_date = toApiStartDateTime(startDate);
    if (endDate) newFilters.end_date = toApiEndDateTime(endDate);

    if (Object.keys(newFilters).length > 0) {
      handleFilterChange(newFilters);
    }
  }, [startDate, endDate, handleFilterChange]);

  const applyRange = useCallback((range: 'day' | 'week' | 'month' | 'year') => {
    const today = dayjs();
    let nextStart = today.startOf('day');
    let nextEnd = today.endOf('day');

    if (range === 'week') {
      nextStart = today.startOf('week');
      nextEnd = today.endOf('week');
    } else if (range === 'month') {
      nextStart = today.startOf('month');
      nextEnd = today.endOf('month');
    } else if (range === 'year') {
      nextStart = today.startOf('year');
      nextEnd = today.endOf('year');
    }

    setActiveRange(range);
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      department_id: '',
      category_id: '',
      good_id: '',
      waiter_id: '',
      hall_id: '',
      table_id: '',
      limit: 1000,
      offset: 0,  
    }));
  }, []);

  const handleRowClick = useCallback((id: string) => {
    const href = paths.menu.reports.goods.details(String(id));
    const params = new URLSearchParams();
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);
    if (filters.waiter_id) params.set('waiter_id', filters.waiter_id);
    if (filters.hall_id) params.set('hall_id', filters.hall_id);
    if (filters.table_id) params.set('table_id', filters.table_id);

    const query = params.toString();
    const absoluteUrl = `${window.location.origin}${href}${query ? `?${query}` : ''}`;
    window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
  }, [filters.end_date, filters.hall_id, filters.start_date, filters.table_id, filters.waiter_id]);

  const renderFiltersContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'auto 1fr 1fr',
            md: 'auto repeat(4, 1fr)',
            lg: 'auto repeat(5, 1fr)',
          },
          gap: 1.5,
          alignItems: 'end',
        }}
      >
        <ToggleButtonGroup
          exclusive
          value={activeRange}
          onChange={(_, value) => {
            if (!value) return;
            applyRange(value);
          }}
          size="small"
          sx={{
            alignSelf: 'end',
            '& .MuiToggleButton-root': {
              textTransform: 'uppercase',
              fontWeight: 600,
              px: 2.5,
              border: 'none',
              borderRadius: 0,
              borderBottom: '2px solid transparent',
            },
            '& .MuiToggleButton-root.Mui-selected': {
              borderBottomColor: 'primary.main',
              backgroundColor: 'transparent',
            },
            '& .MuiToggleButton-root:hover': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <ToggleButton value="day">D</ToggleButton>
          <ToggleButton value="week">W</ToggleButton>
          <ToggleButton value="month">M</ToggleButton>
          <ToggleButton value="year">Y</ToggleButton>
        </ToggleButtonGroup>

        <DatePicker
          label={t('goodsReports.startDate', 'Start date')}
          value={startDate}
          onChange={(value) => {
            setStartDate(value);
            setActiveRange('day');
          }}
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
          onChange={(value) => {
            setEndDate(value);
            setActiveRange('day');
          }}
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

        <NoDataTooltip enabled={isDepartmentsEmpty} title={noDataText}>
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
            disabled={isDepartmentsEmpty}
          >
            <option value="" disabled hidden>
              {t('ingredientReports.all', 'All')}
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        <NoDataTooltip enabled={isCategoriesEmpty} title={noDataText}>
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
            disabled={isCategoriesEmpty}
          >
            <option value="" disabled hidden>
              {t('ingredientReports.all', 'All')}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        <NoDataTooltip enabled={isGoodsEmpty} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.good', 'Good')}
            value={filters.good_id}
            onChange={(e) => handleFilterChange({ good_id: e.target.value })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            disabled={isGoodsEmpty}
          >
            <option value="" disabled hidden>
              {t('ingredientReports.all', 'All')}
            </option>
            {goods.map((good) => (
              <option key={good.id} value={good.id}>
                {good.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        <NoDataTooltip enabled={isWaitersEmpty} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.waiter', 'Waiter')}
            value={filters.waiter_id}
            onChange={(e) => handleFilterChange({ waiter_id: e.target.value })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            disabled={isWaitersEmpty}
          >
            <option value="" disabled hidden>
              {t('ingredientReports.all', 'All')}
            </option>
            {waiters.map((waiter) => (
              <option key={waiter.id} value={waiter.id}>
                {waiter.full_name || waiter.username || '-'}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        <NoDataTooltip enabled={isHallsEmpty} title={noDataText}>
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
            disabled={isHallsEmpty}
          >
            <option value="" disabled hidden>
              {t('ingredientReports.all', 'All')}
            </option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        <NoDataTooltip enabled={isTablesEmpty} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.table', 'Table')}
            value={filters.table_id}
            onChange={(e) => handleFilterChange({ table_id: e.target.value })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            disabled={isTablesEmpty}
          >
            <option value="" disabled hidden>
              {t('ingredientReports.all', 'All')}
            </option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                #{table.number}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
        onRowClick={handleRowClick}
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
