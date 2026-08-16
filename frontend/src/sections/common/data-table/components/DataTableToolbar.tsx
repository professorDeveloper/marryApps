import type { ReactNode } from 'react';
import type { SearchMode, BatchAction, SearchOutput } from '../types/types';

import dayjs from 'dayjs';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales/use-locales';

import { ToolbarSearch } from './ToolbarSearch';

// import { ACCENT } from '../utils';

export type DataTableToolbarProps<T> = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  searchMode?: SearchMode;
  allowFreeText?: boolean;
  searchOptions?: { id: string; label: string }[];
  onSearch?: (data: SearchOutput) => void;
  searchPlaceholder?: string;
  searchDebounceMs?: number;

  showPeriodPicker?: boolean;
  periodPickerProps?: {
    startDate?: Date | null;
    endDate?: Date | null;
    onStartDateChange?: (date: Date | null) => void;
    onEndDateChange?: (date: Date | null) => void;
  };
  showPeriodButtons?: boolean;
  periodButtonProps?: {
    activePeriod?: 'day' | 'week' | 'month' | 'year';
    onPeriodChange?: (period: 'day' | 'week' | 'month' | 'year') => void;
  };

  showCheckboxes: boolean;
  selectedRows: T[];
  batchActions: Array<BatchAction<T>>;

  headerActions?: ReactNode;
  toolbarActions?: ReactNode;
  /** Second row of filter chips rendered inside the bordered toolbar box */
  filterRow?: ReactNode;
};

export function DataTableToolbar<T>({
  searchValue,
  onSearchChange,
  searchMode,
  allowFreeText,
  searchOptions,
  onSearch,
  searchPlaceholder,
  searchDebounceMs,
  showPeriodPicker = false,
  periodPickerProps,
  showPeriodButtons = false,
  periodButtonProps,
  showCheckboxes,
  selectedRows,
  batchActions,
  headerActions,
  toolbarActions,
  filterRow,
}: DataTableToolbarProps<T>) {
  const { t } = useTranslate('common');

  const handleSearch = useCallback(
    (data: SearchOutput) => {
      if (onSearch) {
        onSearch(data);
      } else if (data.query !== undefined && onSearchChange) {
        onSearchChange(data.query);
      }
    },
    [onSearch, onSearchChange],
  );

  const hasFilterRow = Boolean(filterRow);

  return (
    <Stack direction="column" gap={hasFilterRow ? 1 : 0}>
      {/* Row 1: all toolbar controls, wraps onto multiple lines on narrow screens */}
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ flex: 1 }}>
          {(onSearchChange || onSearch) && (
            <ToolbarSearch
              mode={searchMode}
              allowFreeText={allowFreeText}
              options={searchOptions}
              onSearch={handleSearch}
              value={searchValue}
              placeholder={searchPlaceholder}
              debounceMs={searchDebounceMs}
            />
          )}

          {(showPeriodPicker || showPeriodButtons) && (
            <Stack direction="row" alignItems="center" gap={1}>
              {showPeriodPicker && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 36,
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg2)',
                    px: 1.25,
                    gap: 0.75,
                    '&:focus-within': {
                      borderColor: 'var(--border2)',
                    },
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em', userSelect: 'none' }}
                  >
                    FROM
                  </Typography>
                  <Box
                    component="input"
                    type="date"
                    aria-label={t('dataTable.startDate')}
                    value={
                      periodPickerProps?.startDate
                        ? dayjs(periodPickerProps.startDate).format('YYYY-MM-DD')
                        : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const date = e.target.value ? dayjs(e.target.value).startOf('day').toDate() : null;
                      periodPickerProps?.onStartDateChange?.(date);
                    }}
                    sx={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 12.5,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      width: 110,
                      colorScheme: 'inherit',
                    }}
                  />
                  <Typography sx={{ fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
                    →
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em', userSelect: 'none' }}
                  >
                    TO
                  </Typography>
                  <Box
                    component="input"
                    type="date"
                    aria-label={t('dataTable.endDate')}
                    value={
                      periodPickerProps?.endDate
                        ? dayjs(periodPickerProps.endDate).format('YYYY-MM-DD')
                        : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const date = e.target.value ? dayjs(e.target.value).endOf('day').toDate() : null;
                      periodPickerProps?.onEndDateChange?.(date);
                    }}
                    sx={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 12.5,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      width: 110,
                      colorScheme: 'inherit',
                    }}
                  />
                </Box>
              )}

              {showPeriodButtons && (
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {(['day', 'week', 'month', 'year'] as const).map((period) => {
                    const isActive = periodButtonProps?.activePeriod === period;
                    return (
                      <Box
                        key={period}
                        component="button"
                        onClick={() => periodButtonProps?.onPeriodChange?.(period)}
                        sx={{
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isActive ? '1px solid var(--border)' : 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 400,
                          fontFamily: 'var(--font-sans)',
                          color: isActive ? 'var(--bg)' : 'var(--text-3)',
                          backgroundColor: isActive ? 'var(--text)' : 'transparent',
                          transition: 'background 0.15s, color 0.15s',
                          '&:hover': {
                            color: isActive ? 'var(--bg)' : 'var(--text)',
                          },
                        }}
                      >
                        {period.charAt(0).toUpperCase()}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}

          {toolbarActions}

        </Stack>

        {/* Right side: batch actions when selected, otherwise header actions */}
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5}>
          {showCheckboxes && selectedRows.length > 0 ? (
            <>
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: 'var(--text2)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Selected: <b>{selectedRows.length}</b>
              </Typography>
              {batchActions.map((a) => (
                <Button
                  key={a.label}
                  size="small"
                  variant="outlined"
                  color={a.color ?? 'inherit'}
                  onClick={() => a.onClick(selectedRows)}
                  startIcon={a.icon}
                  sx={{
                    height: 34,
                    textTransform: 'none',
                    fontSize: 12.5,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </>
          ) : (
            headerActions
          )}
        </Stack>
      </Stack>

      {/* Row 2: filter chips (optional) */}
      {hasFilterRow && (
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75}>
          {filterRow}
        </Stack>
      )}
    </Stack>
  );
}
