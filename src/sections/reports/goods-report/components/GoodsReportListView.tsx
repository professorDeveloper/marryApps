import type { IGoodsReportItem } from 'src/types/goods-reports';
import type { SearchOutput, DataTableColumn, DataTableDefaultConfig } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';
import { useGetGoodsReports } from 'src/actions/goods-reports';
import { useGetDepartments } from 'src/actions/departments';
import { useGetCategories } from 'src/actions/categories';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';
import { DepartmentFilter } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DepartmentFilter';
import { CategoryFilter } from 'src/sections/warehouse/deduction/components/utility-data-table/components/CategoryFilter';

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
    handleSortChange,
  } = useGoodsReportFilters();

  const handleSearch = useCallback(
    ({ optionIds = [] }: SearchOutput) => {
      handleGoodIdsChange(optionIds);
    },
    [handleGoodIdsChange]
  );

  const { reports, totals, reportsLoading, reportsPagination } = useGetGoodsReports({
    start_date: filters.start_date,
    end_date: filters.end_date,
    department_id: filters.department_id || undefined,
    category_id: filters.category_id || undefined,
    good_ids: filters.good_ids.length > 0 ? filters.good_ids : undefined,
    good_id: filters.good_ids.length === 0 && filters.good_id ? filters.good_id : undefined,
    waiter_id: filters.waiter_id || undefined,
    hall_id: filters.hall_id || undefined,
    table_id: filters.table_id || undefined,
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
      if (filters.waiter_id) params.set('waiter_id', filters.waiter_id);
      if (filters.hall_id) params.set('hall_id', filters.hall_id);
      if (filters.table_id) params.set('table_id', filters.table_id);

      const query = params.toString();
      const absoluteUrl = `${window.location.origin}${href}${query ? `?${query}` : ''}`;
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
    },
    [filters.end_date, filters.hall_id, filters.start_date, filters.table_id, filters.waiter_id]
  );

  const getRowId = useCallback((row: IGoodsReportItem) => String(row.good_id), []);

  const handleDepartmentChange = useCallback(
    (departmentId: string) => {
      handleFilterChange({ department_id: departmentId === 'all' ? '' : departmentId, category_id: '', good_id: '' });
    },
    [handleFilterChange]
  );

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      handleFilterChange({ category_id: categoryId === 'all' ? '' : categoryId, good_id: '' });
    },
    [handleFilterChange]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px:2 }}>
 

      <DataTable
        persistKey={PERSIST_KEY}
        data={reports || []}
        columns={columns}
        defaultConfig={defaultConfig}
        onReset={handleReset}
        showRowNumbers
        getRowId={getRowId}
        searchMode="advanced"
        allowFreeText={false}
        searchOptions={goodOptions}
        onSearch={handleSearch}
        onSortChange={handleSortChange}
        page={paginationModel.page}
        rowsPerPage={paginationModel.pageSize}
        totalCount={reportsPagination?.total ?? totals?.total_count ?? 0}
        rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
        onPageChange={(page) => handlePaginationChange({ ...paginationModel, page })}
        onRowsPerPageChange={(pageSize) => handlePaginationChange({ page: 0, pageSize })}
        showPeriodPicker
        periodPickerProps={{
          startDate: startDate?.toDate() || null,
          endDate: endDate?.toDate() || null,
          onStartDateChange: (date) => handleStartDateChange(date ? dayjs(date) : null),
          onEndDateChange: (date) => handleEndDateChange(date ? dayjs(date) : null),
        }}
        showPeriodButtons
        periodButtonProps={{
          activePeriod: activeRange,
          onPeriodChange: handleRangeChange,
        }}
        toolbarActions={
          <>
            <DepartmentFilter
              departmentId={filters.department_id || "all"}
              departments={departments.map((d) => ({ id: d.id, name: d.name }))}
              onDepartmentChange={handleDepartmentChange}
              label={t('goodsReports.department', 'Department')}
              disabled={departments.length === 0}
            />
            <CategoryFilter
              categoryId={filters.category_id || 'all'}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              onCategoryChange={handleCategoryChange}
              label={t('goodsReports.category', 'Category')}
              disabled={categories.length === 0}
            />
          </>
        }
        rowActions={[
          {
            label: t('viewDetails', 'View Details'),
            onClick: handleRowClick,
          },
        ]}
        emptyTitle={t('noData', 'No data')}
        emptySubtitle={t('tryAdjustingFilters', 'Try adjusting filters')}
      />
    </Box>
  );
}

// Helper functions to convert columns and create default config
function useDataTableColumns(): DataTableColumn<IGoodsReportItem>[] {
  const { t } = useTranslation('menu');

  return [
    {
      key: 'name',
      label: t('goodsReports.good', 'Good'),
      width: 220,
      sortable: true,
      filterable: true,
      reorderable: false,
      getValue: (row) => row.name,
    },
    {
      key: 'total_qty',
      label: t('goodsReports.totalQty', 'Total Qty'),
      width: 120,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_qty,
      total: {
        aggregation: 'custom',
        compute: (rows) => rows.reduce((sum, row) => sum + (Number(row.total_qty) || 0), 0),
        label: 'Total',
      },
    },
    {
      key: 'avg_sell_price',
      label: t('goodsReports.avgSellPrice', 'Avg sell price'),
      width: 160,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_sell_price,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
    },
    {
      key: 'total_sell',
      label: t('goodsReports.totalSell', 'Total sell'),
      width: 160,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_sell,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
      total: {
        aggregation: 'custom',
        compute: (rows) => rows.reduce((sum, row) => sum + (Number(row.total_sell) || 0), 0),
        label: 'Total',
      },
    },
    {
      key: 'avg_cost_price',
      label: t('goodsReports.avgCostPrice', 'Avg cost price'),
      width: 160,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_cost_price,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
    },
    {
      key: 'total_cost',
      label: t('goodsReports.totalCost', 'Total cost'),
      width: 160,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_cost,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
      total: {
        aggregation: 'custom',
        compute: (rows) => rows.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0),
        label: 'Total',
      },
    },
    {
      key: 'avg_markup',
      label: t('goodsReports.avgMarkup', 'Avg markup'),
      width: 150,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_markup,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
    },
    {
      key: 'total_markup',
      label: t('goodsReports.totalMarkup', 'Total markup'),
      width: 160,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.total_markup,
      renderCell: ({ value }) => formatAmount(value as string | number | undefined),
      total: {
        aggregation: 'custom',
        compute: (rows) => rows.reduce((sum, row) => sum + (Number(row.total_markup) || 0), 0),
        label: 'Total',
      },
    },
    {
      key: 'avg_markup_pct',
      label: t('goodsReports.avgMarkupPct', 'Avg markup %'),
      width: 150,
      sortable: true,
      align: 'right',
      mono: true,
      getValue: (row) => row.avg_markup_pct,
      renderCell: ({ value }) => formatPercent(value as string | number | undefined),
      total: {
        aggregation: 'custom',
        compute: (rows) => {
          const totalMarkup = rows.reduce((sum, row) => sum + (Number(row.total_markup) || 0), 0);
          const totalCost = rows.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);
          return totalCost > 0 ? (totalMarkup / totalCost) * 100 : 0;
        },
        label: 'Avg %',
      },
    },
  ];
}

function useDefaultConfig(): DataTableDefaultConfig {
  return {
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
      name: 220,
      total_qty: 120,
      avg_sell_price: 160,
      total_sell: 160,
      avg_cost_price: 160,
      total_cost: 160,
      avg_markup: 150,
      total_markup: 160,
      avg_markup_pct: 150,
    },
  };
}
