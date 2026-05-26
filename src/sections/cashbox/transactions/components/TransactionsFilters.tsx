import type { TransactionFilters } from 'src/types/transactions';

import dayjs from 'dayjs';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';

interface TransactionsFiltersProps {
  filters: TransactionFilters;
  cashRegisterMap: Record<string, string>;
  groupsMap: Record<string, string>;
  onFiltersChange: (filters: TransactionFilters) => void;
  onReset: () => void;
}

export function TransactionsFilters({
  filters,
  cashRegisterMap,
  groupsMap,
  onFiltersChange,
  onReset,
}: TransactionsFiltersProps) {
  const { t } = useTranslation('menu');

  const handleDateFromChange = useCallback(
    (date: dayjs.Dayjs | null) => {
      onFiltersChange({
        ...filters,
        date_from: date ? date.format('YYYY-MM-DD') : '',
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateToChange = useCallback(
    (date: dayjs.Dayjs | null) => {
      onFiltersChange({
        ...filters,
        date_to: date ? date.format('YYYY-MM-DD') : '',
      });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      onFiltersChange({
        ...filters,
        type: type as any,
      });
    },
    [filters, onFiltersChange]
  );

  const handleCashRegisterChange = useCallback(
    (cashRegisterId: string) => {
      onFiltersChange({
        ...filters,
        cash_register_id: cashRegisterId,
      });
    },
    [filters, onFiltersChange]
  );

  const handleGroupChange = useCallback(
    (groupId: string) => {
      onFiltersChange({
        ...filters,
        group_id: groupId,
      });
    },
    [filters, onFiltersChange]
  );

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5 }}>
      {/* Start Date */}
      <DatePicker
        label={t('ingredientReports.startDate')}
        value={filters.date_from ? dayjs(filters.date_from) : null}
        onChange={handleDateFromChange}
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

      {/* End Date */}
      <DatePicker
        label={t('ingredientReports.endDate')}
        value={filters.date_to ? dayjs(filters.date_to) : null}
        onChange={handleDateToChange}
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

      {/* Type */}
      <FormControl fullWidth size="small">
        <InputLabel shrink>{t('common.type')}</InputLabel>
        <Select
          value={filters.type || ''}
          label={t('common.type')}
          displayEmpty
          onChange={(event) => handleTypeChange(event.target.value)}
        >
          <MenuItem value="">
            <em>{t('ingredientReports.all')}</em>
          </MenuItem>
          <MenuItem value="income">Income</MenuItem>
          <MenuItem value="expense">Expense</MenuItem>
          <MenuItem value="transfer">Transfer</MenuItem>
        </Select>
      </FormControl>

      {/* Cash Register */}
      <FormControl fullWidth size="small">
        <InputLabel shrink>{t('cashbox.cashiers.title')}</InputLabel>
        <Select
          value={filters.cash_register_id || ''}
          label={t('cashbox.cashiers.title')}
          displayEmpty
          onChange={(event) => handleCashRegisterChange(event.target.value)}
        >
          <MenuItem value="">
            <em>{t('ingredientReports.all')}</em>
          </MenuItem>
          {Object.entries(cashRegisterMap).map(([id, name]) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Group */}
      <FormControl fullWidth size="small">
        <InputLabel shrink>{t('deductions.group')}</InputLabel>
        <Select
          value={filters.group_id || ''}
          label={t('deductions.group')}
          displayEmpty
          onChange={(event) => handleGroupChange(event.target.value)}
        >
          <MenuItem value="">
            <em>{t('ingredientReports.all')}</em>
          </MenuItem>
          {Object.entries(groupsMap).map(([id, name]) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-center' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onReset}
          fullWidth
        >
          {t('bills.reset')}
        </Button>
      </Box>
    </Box>
  );
}
