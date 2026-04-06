import type { GoodsReportFiltersProps } from '../types';

import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useGetHalls } from 'src/actions/halls';
import { useGetUsersByRole } from 'src/actions/users';
import { useGetDepartments } from 'src/actions/departments';
import { useGetCafeTablesByHall } from 'src/actions/cafe-tables';
import { useGetGoodsAll, useGetCategories } from 'src/actions/categories';

import { Iconify } from 'src/components/iconify';
import { NoDataTooltip } from 'src/components/no-data-tooltip';

import { DATE_RANGES, DATE_RANGE_LABELS } from '../constants';

export function GoodsReportFilters({
  filters,
  activeRange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRangeChange,
  onFilterChange,
  onReset,
}: GoodsReportFiltersProps) {
  const { t } = useTranslation('menu');
  const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");

  const { departments } = useGetDepartments();
  const { categories } = useGetCategories();
  const { goods } = useGetGoodsAll();
  const { users: waiters } = useGetUsersByRole('waiter');
  const { halls } = useGetHalls();
  const { tables } = useGetCafeTablesByHall(filters.hall_id);

  return (
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
        {/* Date range toggle */}
        <ToggleButtonGroup
          exclusive
          value={activeRange}
          onChange={(_, value) => {
            if (!value) return;
            onRangeChange(value);
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
          {DATE_RANGES.map((range) => (
            <ToggleButton key={range} value={range}>
              {DATE_RANGE_LABELS[range]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Start date */}
        <DatePicker
          label={t('goodsReports.startDate', 'Start date')}
          value={startDate}
          onChange={onStartDateChange}
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

        {/* End date */}
        <DatePicker
          label={t('goodsReports.endDate', 'End date')}
          value={endDate}
          onChange={onEndDateChange}
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

        {/* Department */}
        <NoDataTooltip enabled={departments.length === 0} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.department', 'Department')}
            value={filters.department_id}
            onChange={(e) =>
              onFilterChange({ department_id: e.target.value, category_id: '', good_id: '' })
            }
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">{t('ingredientReports.all', 'All')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        {/* Category */}
        <NoDataTooltip enabled={categories.length === 0} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.category', 'Category')}
            value={filters.category_id}
            onChange={(e) => onFilterChange({ category_id: e.target.value, good_id: '' })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">{t('ingredientReports.all', 'All')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        {/* Good */}
        <NoDataTooltip enabled={goods.length === 0} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.good', 'Good')}
            value={filters.good_id}
            onChange={(e) => onFilterChange({ good_id: e.target.value })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">{t('ingredientReports.all', 'All')}</option>
            {goods.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        {/* Waiter */}
        <NoDataTooltip enabled={waiters.length === 0} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.waiter', 'Waiter')}
            value={filters.waiter_id}
            onChange={(e) => onFilterChange({ waiter_id: e.target.value })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">{t('ingredientReports.all', 'All')}</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name || w.username || '-'}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        {/* Hall */}
        <NoDataTooltip enabled={halls.length === 0} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.hall', 'Hall')}
            value={filters.hall_id}
            onChange={(e) => onFilterChange({ hall_id: e.target.value, table_id: '' })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">{t('ingredientReports.all', 'All')}</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        {/* Table */}
        <NoDataTooltip enabled={tables.length === 0} title={noDataText}>
          <TextField
            select
            size="small"
            fullWidth
            label={t('goodsReports.table', 'Table')}
            value={filters.table_id}
            onChange={(e) => onFilterChange({ table_id: e.target.value })}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
          >
            <option value="">{t('ingredientReports.all', 'All')}</option>
            {tables.map((tbl) => (
              <option key={tbl.id} value={tbl.id}>
                #{tbl.number}
              </option>
            ))}
          </TextField>
        </NoDataTooltip>

        {/* Reset */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={onReset}
            sx={{ minWidth: 'auto', flex: 1 }}
          >
            {t('goodsReports.reset', 'Reset')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
