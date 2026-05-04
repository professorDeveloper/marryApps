import type { ReactNode } from 'react';
import type { BatchAction, SearchMode, SearchOutput } from '../types/types';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { ToolbarSearch } from './ToolbarSearch';

import { ACCENT } from '../utils';

export type DataTableToolbarProps<T> = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  searchMode?: SearchMode;
  allowFreeText?: boolean;
  searchOptions?: { id: string; label: string }[];
  onSearch?: (data: SearchOutput) => void;

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

  onOpenColumnMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onReset: () => void;
  headerActions?: ReactNode;
  toolbarActions?: ReactNode;
};

export function DataTableToolbar<T>({
  searchValue,
  onSearchChange,
  searchMode,
  allowFreeText,
  searchOptions,
  onSearch,
  showPeriodPicker = false,
  periodPickerProps,
  showPeriodButtons = false,
  periodButtonProps,
  showCheckboxes,
  selectedRows,
  batchActions,
  onOpenColumnMenu,
  onReset,
  headerActions,
  toolbarActions,
}: DataTableToolbarProps<T>) {
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

  return (
    <Box
      sx={{
        backgroundColor: 'var(--color-surface-1)',
        borderBottom: `1px solid var(--color-border)`,
        px: 1.5,
        py: 1,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1 }}>
          {(onSearchChange || onSearch) && (
            <ToolbarSearch
              mode={searchMode}
              allowFreeText={allowFreeText}
              options={searchOptions}
              onSearch={handleSearch}
              value={searchValue}
            />
          )}

          {/* Period Picker and Buttons */}
          {(showPeriodPicker || showPeriodButtons) && (
            <Stack direction="row" alignItems="center" gap={1}>
              {showPeriodPicker && (
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={
                      periodPickerProps?.startDate
                        ? periodPickerProps.startDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      periodPickerProps?.onStartDateChange?.(date);
                    }}
                    sx={{
                      minWidth: 120,
                      '& .MuiInputBase-root': {
                        height: 34,
                        fontSize: 12.5,
                        backgroundColor: 'var(--color-surface-0)',
                        borderRadius: 1,
                        fontFamily: 'var(--font-sans)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-border)' },
                      '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--color-primary)',
                        boxShadow: '0 0 0 3px var(--glow-md)',
                      },
                    }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={
                      periodPickerProps?.endDate
                        ? periodPickerProps.endDate.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      periodPickerProps?.onEndDateChange?.(date);
                    }}
                    sx={{
                      minWidth: 120,
                      '& .MuiInputBase-root': {
                        height: 34,
                        fontSize: 12.5,
                        backgroundColor: 'var(--color-surface-0)',
                        borderRadius: 1,
                        fontFamily: 'var(--font-sans)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-border)' },
                      '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'var(--color-primary)',
                        boxShadow: '0 0 0 3px var(--glow-md)',
                      },
                    }}
                  />
                </Stack>
              )}

              {showPeriodButtons && (
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {(['day', 'week', 'month', 'year'] as const).map((period) => (
                    <Button
                      key={period}
                      size="small"
                      variant={periodButtonProps?.activePeriod === period ? 'contained' : 'outlined'}
                      onClick={() => periodButtonProps?.onPeriodChange?.(period)}
                      sx={{
                        minWidth: 32,
                        px: 1,
                        height: 34,
                        fontSize: 12.5,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {period.charAt(0).toUpperCase()}
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {toolbarActions}

          {showCheckboxes && selectedRows.length > 0 ? (
            <Typography
              sx={{
                fontSize: 12.5,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Selected: <b>{selectedRows.length}</b>
            </Typography>
          ) : null}

          {showCheckboxes &&
            selectedRows.length > 0 &&
            batchActions.map((a) => (
              <Button
                key={a.label}
                size="small"
                variant="outlined"
                onClick={() => a.onClick(selectedRows)}
                startIcon={a.icon}
                sx={{
                  height: 34,
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-text-muted)',
                  '&:hover': { color: 'var(--color-primary)', backgroundColor: 'var(--glow-sm)', boxShadow: 'var(--glow-shadow-md)' },
                  textTransform: 'none',
                  fontSize: 12.5,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {a.label}
              </Button>
            ))}
        </Stack>

        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="Column settings">
            <IconButton
              size="small"
              onClick={onOpenColumnMenu}
              sx={{
                color: 'var(--color-primary)',
                '&:hover': { color: ACCENT, backgroundColor: 'var(--overlay-warning-10)' },
              }}
            >
              <Iconify icon="solar:settings-bold-duotone" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset to default">
            <IconButton
              size="small"
              onClick={onReset}
              sx={{
                color: 'var(--color-primary)',
                '&:hover': { color: ACCENT, backgroundColor: 'var(--overlay-warning-10)' },
              }}
            >
              <Iconify icon="solar:restart-bold" width={18} />
            </IconButton>
          </Tooltip>
          {headerActions}
        </Stack>
      </Stack>
    </Box>
  );
}
