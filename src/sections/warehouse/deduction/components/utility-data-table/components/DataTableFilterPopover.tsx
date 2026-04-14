import type { DataTableColumn } from '../types/types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ACCENT, BORDER, SURFACE_BG, getCellValue } from '../utils';

type FilterState = Record<string, { type: 'text' | 'multi'; value: string | string[] }>;

export type DataTableFilterPopoverProps<T> = {
  anchorEl: HTMLElement | null;
  filterKey: string | null;
  columns: Array<DataTableColumn<T>>;
  filters: FilterState;
  data: T[];
  onClose: () => void;
  onSetTextFilter: (key: string, value: string) => void;
  onSetMultiFilter: (key: string, value: string[]) => void;
  onClearFilter: (key: string) => void;
};

export function DataTableFilterPopover<T>({
  anchorEl,
  filterKey,
  columns,
  filters,
  data,
  onClose,
  onSetTextFilter,
  onSetMultiFilter,
  onClearFilter,
}: DataTableFilterPopoverProps<T>) {
  const activeFilter = filterKey ? columns.find((c) => c.key === filterKey) ?? null : null;
  const filterValue = filterKey ? filters[filterKey] ?? null : null;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      PaperProps={{
        sx: {
          mt: 1,
          width: 320,
          backgroundColor: SURFACE_BG,
          border: `1px solid ${BORDER}`,
          backdropFilter: 'blur(12px)',
          p: 1.5,
        },
      }}
    >
      {activeFilter ? (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.86)',
                fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
              }}
            >
              {activeFilter.label}
            </Typography>
            <Stack direction="row" gap={0.5}>
              <Button
                size="small"
                onClick={() => {
                  if (filterKey) onClearFilter(filterKey);
                  onClose();
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                }}
              >
                Clear
              </Button>
              <Button
                size="small"
                onClick={onClose}
                sx={{
                  textTransform: 'none',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                }}
              >
                Close
              </Button>
            </Stack>
          </Stack>

          {activeFilter.filter?.type === 'multi' ? (
            <Box sx={{ maxHeight: 260, overflow: 'auto' }}>
              {(() => {
                const value = (filterValue?.value as string[] | undefined) ?? [];
                const maxSelections = activeFilter.filter?.maxSelections ?? 1;
                const isSingleSelect = maxSelections === 1;
                const options =
                  activeFilter.filter?.options ??
                  Array.from(
                    new Set(data.map((r) => String(getCellValue(activeFilter, r) ?? '')))
                  )
                    .filter((x) => x !== '')
                    .slice(0, 250);
                const labelOf = activeFilter.filter?.getOptionLabel ?? ((v: string) => v);
                return options.map((opt: string) => {
                  const checked = value.includes(opt);
                  return (
                    <MenuItem
                      key={opt}
                      onClick={() => {
                        let next: string[];
                        if (isSingleSelect) {
                          // Single select: toggle selection like multi-select
                          next = checked ? [] : [opt];
                          if (filterKey) onSetMultiFilter(filterKey, next);
                          onClose();
                        } else {
                          // Multi select: toggle selection, stay open
                          next = checked ? value.filter((x) => x !== opt) : [...value, opt];
                          if (filterKey) onSetMultiFilter(filterKey, next);
                        }
                      }}
                      sx={{ fontSize: 13, px: 1, py: 0.5 }}
                    >
                      <Checkbox
                        size="small"
                        checked={checked}
                        sx={{
                          mr: 1,
                          color: 'rgba(255,255,255,0.35)',
                          '&.Mui-checked': { color: ACCENT },
                        }}
                      />
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 12.5,
                          color: 'rgba(255,255,255,0.82)',
                          minWidth: 0,
                        }}
                      >
                        {labelOf(opt)}
                      </Typography>
                    </MenuItem>
                  );
                });
              })()}
            </Box>
          ) : (
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder={activeFilter.filter?.placeholder ?? 'Search...'}
              value={typeof filterValue?.value === 'string' ? filterValue.value : ''}
              onChange={(e) => {
                if (!filterKey) return;
                onSetTextFilter(filterKey, e.target.value);
              }}
              sx={{
                '& .MuiInputBase-root': {
                  height: 36,
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
        </Box>
      ) : null}
    </Popover>
  );
}
