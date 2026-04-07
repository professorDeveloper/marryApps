import type { ReactNode } from 'react';
import type { BatchAction } from '../types/types';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { ACCENT, BORDER } from '../utils';

export type DataTableToolbarProps<T> = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;

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
};

export function DataTableToolbar<T>({
  searchValue,
  onSearchChange,
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
}: DataTableToolbarProps<T>) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue || '');

  const handleSearchSubmit = useCallback((value: string) => {
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalSearchValue(newValue);

    // Trigger search when local value becomes empty
    // but only if parent state wasn't already empty (avoid redundant searches)
    if (newValue === '' && searchValue && searchValue !== '') {
      handleSearchSubmit('');
    }
  }, [searchValue, handleSearchSubmit]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchSubmit(localSearchValue);
    }
  }, [localSearchValue, handleSearchSubmit]);

  // Sync local search value with prop changes (useEffect to avoid render issues)
  useEffect(() => {
 if (searchValue !== localSearchValue && searchValue !== undefined) {
      setLocalSearchValue(searchValue);
    }
  }, [searchValue]);
  return (
    <Box
      sx={{
        backgroundColor: 'grey.700',
        borderBottom: `2px solid ${ACCENT}`,
        px: 1.5,
        py: 1,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1 }}>
          {onSearchChange && (
            <TextField
              size="small"
              placeholder="Search cases..."
              value={localSearchValue}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify
                        icon="eva:search-fill"
                        width={18}
                        sx={{ color: 'rgba(255,255,255,0.45)' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: null,
                },
              }}
              sx={{
                minWidth: 200,
                maxWidth: 320,
                '& .MuiInputBase-root': {
                  height: 34,
                  fontSize: 12.5,
                  backgroundColor: 'rgba(9,9,11,0.7)',
                  borderRadius: 1,
                  fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: ACCENT,
                  boxShadow: `0 0 0 3px rgba(245, 158, 11, 0.15)`,
                },
              }}
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
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      periodPickerProps?.onStartDateChange?.(date);
                    }}
                    sx={{ 
                      minWidth: 120,
                      '& .MuiInputBase-root': {
                        height: 34,
                        fontSize: 12.5,
                        backgroundColor: 'rgba(9,9,11,0.7)',
                        borderRadius: 1,
                        fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                      '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: ACCENT,
                        boxShadow: `0 0 0 3px rgba(245, 158, 11, 0.15)`,
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
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      periodPickerProps?.onEndDateChange?.(date);
                    }}
                    sx={{ 
                      minWidth: 120,
                      '& .MuiInputBase-root': {
                        height: 34,
                        fontSize: 12.5,
                        backgroundColor: 'rgba(9,9,11,0.7)',
                        borderRadius: 1,
                        fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                      '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: ACCENT,
                        boxShadow: `0 0 0 3px rgba(245, 158, 11, 0.15)`,
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
                        fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                      }}
                    >
                      {period.charAt(0).toUpperCase()}
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {showCheckboxes && selectedRows.length > 0 ? (
            <Typography
              sx={{
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
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
                  borderColor: 'rgba(245, 158, 11, 0.35)',
                  color: 'rgba(255,255,255,0.9)',
                  '&:hover': {
                    borderColor: ACCENT,
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  },
                  textTransform: 'none',
                  fontSize: 12.5,
                  fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
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
                color: 'rgba(255,255,255,0.65)',
                '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
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
                color: 'rgba(255,255,255,0.65)',
                '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
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
