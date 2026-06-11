import type { IGoodsReportItem } from 'src/types/goods-reports';
import type { SearchOutput, DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';
import { useGetHalls } from 'src/actions/halls';
import { useGetUsersByRole } from 'src/actions/users';
import { useGetGoodsReports } from 'src/actions/goods-reports';
import { useGetDepartments } from 'src/actions/departments';
import { useGetCategories } from 'src/actions/categories';
import { useGetCafeTables } from 'src/actions/cafe-tables';

import { DataTable } from 'src/sections/common/data-table/components/DataTable';

import { MultiSelectFilter } from './MultiSelectFilter';

import { PERSIST_KEY, PAGE_SIZE_OPTIONS } from '../constants';
import { formatAmount, formatPercent } from '../utils/formatters';
import { useGoodsReportFilters } from '../hooks/useGoodsReportFilters';

export function GoodsReportListView() {
  const { t } = useTranslation('menu');

  const { departments } = useGetDepartments();
  const { categories } = useGetCategories();
  const { data: metadata } = useMetadata([MetadataEntity.MENUS]);

  const goodOptions = useMemo(
    () => (metadata.menus || []).map((m: any) => ({ id: String(m.id), label: m.name || String(m.id) })),
    [metadata.menus]
  );

  const {
    filters,
    paginationModel,
    startDate,
    endDate,
    activeRange,
    handleFilterChange,
    handleRangeChange,
    handleStartDateChange,
    handleEndDateChange,
    handlePaginationChange,
    handleReset,
    handleGoodIdsChange,
    handleMultiIdsChange,
    handleSortChange,
  } = useGoodsReportFilters();

  const { users: waiters } = useGetUsersByRole('waiter');
  const { halls } = useGetHalls();
  const { tables } = useGetCafeTables();

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ id: String(d.id), label: d.name })),
    [departments]
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: String(c.id), label: c.name })),
    [categories]
  );
  const waiterOptions = useMemo(
    () => waiters.map((w: any) => ({ id: String(w.id), label: w.full_name || w.username || '-' })),
    [waiters]
  );
  const hallOptions = useMemo(
    () => halls.map((h: any) => ({ id: String(h.id), label: h.name })),
    [halls]
  );
  const tableOptions = useMemo(
    () => tables.map((tbl: any) => ({ id: String(tbl.id), label: `#${tbl.number}` })),
    [tables]
  );

  const handleSearch = useCallback(
    ({ optionIds = [] }: SearchOutput) => {
      handleGoodIdsChange(optionIds);
    },
    [handleGoodIdsChange]
  );

  const { reports, totals, reportsLoading, reportsPagination } = useGetGoodsReports({
    start_date: filters.start_date,
    end_date: filters.end_date,
    department_ids: filters.department_ids.length > 0 ? filters.department_ids : undefined,
    category_ids: filters.category_ids.length > 0 ? filters.category_ids : undefined,
    good_ids: filters.good_ids.length > 0 ? filters.good_ids : undefined,
    good_id: filters.good_ids.length === 0 && filters.good_id ? filters.good_id : undefined,
    waiter_ids: filters.waiter_ids.length > 0 ? filters.waiter_ids : undefined,
    hall_ids: filters.hall_ids.length > 0 ? filters.hall_ids : undefined,
    table_ids: filters.table_ids.length > 0 ? filters.table_ids : undefined,
    sort_by: filters.sort_by || undefined,
    sort_order: filters.sort_order || undefined,
    limit: filters.limit,
    offset: filters.offset,
  });

  const columns = useDataTableColumns();
  const defaultConfig = useDefaultConfig();

  const handleRowClick = useCallback(
    (row: IGoodsReportItem) => {
      const href = paths.menu.reports.goods.details(String(row.good_id));
      const params = new URLSearchParams();
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.department_ids.length > 0) params.set('department_ids', filters.department_ids.join(','));
      if (filters.category_ids.length > 0) params.set('category_ids', filters.category_ids.join(','));
      if (filters.waiter_ids.length > 0) params.set('waiter_ids', filters.waiter_ids.join(','));
      if (filters.hall_ids.length > 0) params.set('hall_ids', filters.hall_ids.join(','));
      if (filters.table_ids.length > 0) params.set('table_ids', filters.table_ids.join(','));

      const query = params.toString();
      const absoluteUrl = `${window.location.origin}${href}${query ? `?${query}` : ''}`;
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
    },
    [filters.end_date, filters.hall_ids, filters.start_date, filters.table_ids, filters.waiter_ids]
  );

  const getRowId = useCallback((row: IGoodsReportItem) => String(row.good_id), []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 2 }}>


      <DataTable
        persistKey={PERSIST_KEY}
        data={reports || []}
        columns={columns}
        defaultConfig={defaultConfig}
        onReset={handleReset}
        showRowNumbers
        getRowId={getRowId}
        search={{ mode: 'advanced', allowFreeText: false, options: goodOptions, onSearch: handleSearch, placeholder: t('goodsReports.searchMeals', 'Search meals') }}
        onSortChange={handleSortChange}
        pagination={{
          page: paginationModel.page,
          rowsPerPage: paginationModel.pageSize,
          totalCount: reportsPagination?.total ?? totals?.total_count ?? 0,
          rowsPerPageOptions: [...PAGE_SIZE_OPTIONS],
          onPageChange: (page) => handlePaginationChange({ ...paginationModel, page }),
          onRowsPerPageChange: (pageSize) => handlePaginationChange({ page: 0, pageSize }),
        }}
        periodFilter={{
          startDate: startDate?.toDate() || null,
          endDate: endDate?.toDate() || null,
          onStartDateChange: (date) => handleStartDateChange(date ? dayjs(date) : null),
          onEndDateChange: (date) => handleEndDateChange(date ? dayjs(date) : null),
          activePeriod: activeRange,
          onPeriodChange: handleRangeChange,
        }}
        filterRow={
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 1,
              width: '100%',
            }}
          >
            <MultiSelectFilter
              label={t('goodsReports.department')}
              options={departmentOptions}
              value={filters.department_ids}
              onChange={(ids) => handleMultiIdsChange('department_ids', ids)}
            />
            <MultiSelectFilter
              label={t('goodsReports.category')}
              options={categoryOptions}
              value={filters.category_ids}
              onChange={(ids) => handleMultiIdsChange('category_ids', ids)}
            />
            <MultiSelectFilter
              label={t('goodsReports.waiter')}
              options={waiterOptions}
              value={filters.waiter_ids}
              onChange={(ids) => handleMultiIdsChange('waiter_ids', ids)}
            />
            <MultiSelectFilter
              label={t('goodsReports.hall')}
              options={hallOptions}
              value={filters.hall_ids}
              onChange={(ids) => handleMultiIdsChange('hall_ids', ids)}
            />
            <MultiSelectFilter
              label={t('goodsReports.table')}
              options={tableOptions}
              value={filters.table_ids}
              onChange={(ids) => handleMultiIdsChange('table_ids', ids)}
            />
          </Box>
        }
        rowActions={[
          {
            label: t('viewDetails'),
            onClick: handleRowClick,
          },
        ]}
        emptyTitle={t('noData')}
        emptySubtitle={t('tryAdjustingFilters')}
      />
    </Box>
  );
}

// Shared pill styles for markup columns — stable references so they aren't
// recreated for every visible cell on each render.
const PILL_BASE_SX = {
  display: 'inline-flex',
  px: '9px',
  py: '3px',
  borderRadius: '999px',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.04em',
} as const;

const PILL_POSITIVE_SX = (theme: any) => ({
  ...PILL_BASE_SX,
  backgroundColor: alpha(theme.palette.success.main, 0.08),
  color: theme.palette.success.dark,
});

const PILL_NEGATIVE_SX = (theme: any) => ({
  ...PILL_BASE_SX,
  backgroundColor: alpha(theme.palette.error.main, 0.08),
  color: theme.palette.error.dark,
});

const PILL_NEUTRAL_SX = (theme: any) => ({
  ...PILL_BASE_SX,
  backgroundColor: theme.palette.action.selected,
  color: theme.palette.text.secondary,
});

const pillSx = (value: unknown) => {
  const n = Number(value) || 0;
  if (n > 0) return PILL_POSITIVE_SX;
  if (n < 0) return PILL_NEGATIVE_SX;
  return PILL_NEUTRAL_SX;
};

// Helper functions to convert columns and create default config
function useDataTableColumns(): DataTableColumn<IGoodsReportItem>[] {
  const { t } = useTranslation('menu');

  return useMemo(() => [
    {
      key: 'name',
      label: t('goodsReports.good'),
      width: '1.5fr',
      sortable: true,
      reorderable: false,
      getValue: (row) => row.name,
    },
    {
      key: 'total_qty',
      label: t('goodsReports.totalQty'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_qty,
      total: {
        aggregation: 'custom',
        compute: (rows) => formatAmount(rows.reduce((sum, row) => sum + (Number(row.total_qty) || 0), 0)),
        label: 'Total',
      },
      renderCell: ({ value }) => {
        return (
          <span style={{ textAlign: 'center', marginRight:70 }}>
            {formatAmount(value as string | number | undefined)}
          </span>

        )
      }

    },
    {
      key: 'avg_sell_price',
      label: <span style={{  width:'100%', textAlign:'center' }}>{t('goodsReports.avgSellPrice')}</span>,
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_sell_price,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
    },
    {
      key: 'total_sell',
      label: t('goodsReports.totalSell'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_sell,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
      total: {
        aggregation: 'custom',
        compute: (rows) => formatAmount(rows.reduce((sum, row) => sum + (Number(row.total_sell) || 0), 0)),
        label: 'Total',
      },
    },
    {
      key: 'avg_cost_price',
      label: t('goodsReports.avgCostPrice'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_cost_price,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
    },
    {
      key: 'total_cost',
      label: t('goodsReports.totalCost'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_cost,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
      total: {
        aggregation: 'custom',
        compute: (rows) => formatAmount(rows.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0)),
        label: 'Total',
      },
    },
    {
      key: 'avg_markup',
      label: t('goodsReports.avgMarkup'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_markup,
      renderCell: ({ value }) => (
        <Box sx={pillSx(value)}>
          {formatAmount(value as string | number | undefined)}
        </Box>
      ),
    },
    {
      key: 'total_markup',
      label: t('goodsReports.totalMarkup'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_markup,
      renderCell: ({ value }) => (
        <Box sx={pillSx(value)}>
          {formatAmount(value as string | number | undefined)}
        </Box>
      ),
      total: {
        aggregation: 'custom',
        compute: (rows) => formatAmount(rows.reduce((sum, row) => sum + (Number(row.total_markup) || 0), 0)),
        label: 'Total',
      },
    },
    {
      key: 'avg_markup_pct',
      label: t('goodsReports.avgMarkupPct'),
      width: '1fr',
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_markup_pct,
      renderCell: ({ value }) => (
        <Box sx={pillSx(value)}>
          {formatPercent(value as string | number | undefined)}
        </Box>
      ),
      total: {
        aggregation: 'custom',
        compute: (rows) => {
          const totalMarkup = rows.reduce((sum, row) => sum + (Number(row.total_markup) || 0), 0);
          const totalCost = rows.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);
          return formatPercent(totalCost > 0 ? (totalMarkup / totalCost) * 100 : 0);
        },
        label: 'Avg %',
      },
    },
  ], [t]);
}

const DEFAULT_CONFIG: DataTableDefaultConfig = {
    order: [
      'name',
      'total_qty',
      'avg_sell_price',
      'total_sell',
      'avg_cost_price',
      'total_cost',
      'avg_markup',
      'total_markup',
      'avg_markup_pct',
    ],
    visibility: {
      name: true,
      total_qty: true,
      avg_sell_price: true,
      total_sell: true,
      avg_cost_price: true,
      total_cost: true,
      avg_markup: true,
      total_markup: true,
      avg_markup_pct: true,
    },
    widths: {
      name: '1.5fr',
      total_qty: '1fr',
      avg_sell_price: '1fr',
      total_sell: '1fr',
      avg_cost_price: '1fr',
      total_cost: '1fr',
      avg_markup: '1fr',
      total_markup: '1fr',
      avg_markup_pct: '1fr',
    },
};

function useDefaultConfig(): DataTableDefaultConfig {
  return DEFAULT_CONFIG;
}
