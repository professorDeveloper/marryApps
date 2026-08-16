import type { GridColDef } from '@mui/x-data-grid';
import type { TotalRule, PersistedColumnState } from './types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import { GridFooter } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';

// ---------------------------------------------------------------------------
// Aggregation logic
// ---------------------------------------------------------------------------

function computeAggregate<R>(rule: TotalRule<R>, rows: R[]): number | string {
  if (rule.aggregation === 'custom' && rule.compute) {
    return rule.compute(rows);
  }

  const values = rows
    .map((r) => {
      const raw = (r as any)[rule.field];
      return typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    })
    .filter((v) => !Number.isNaN(v));

  if (values.length === 0) return 0;

  switch (rule.aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
}

function defaultFormat(value: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TotalsFooterProps<R = any> {
  rules: TotalRule<R>[];
  rows: R[];
  columns: GridColDef[];
  columnStates: PersistedColumnState[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TotalsFooter<R>({ rules, rows, columns, columnStates }: TotalsFooterProps<R>) {
  const visibleFields = useMemo(
    () => new Set(columnStates.filter((s) => s.visible).map((s) => s.field)),
    [columnStates]
  );

  const columnsMap = useMemo(
    () => new Map(columns.map((c) => [c.field, c])),
    [columns]
  );

  const totals = useMemo(
    () =>
      rules
        .filter((rule) => visibleFields.has(rule.field))
        .map((rule) => {
          const raw = computeAggregate(rule, rows);
          const numericValue = typeof raw === 'number' ? raw : parseFloat(String(raw));
          const format = rule.format || defaultFormat;
          const label = rule.label || columnsMap.get(rule.field)?.headerName || rule.field;
          return {
            field: rule.field,
            label,
            display: Number.isNaN(numericValue) ? String(raw) : format(numericValue),
          };
        }),
    [rules, rows, visibleFields, columnsMap]
  );

  if (totals.length === 0) return <GridFooter />;

  return (
    <Box
      sx={{
        width: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '& .MuiDataGrid-footerContainer': { borderTop: 'none', minHeight: 'unset' },
        '& .MuiTablePagination-root': { overflow: 'hidden' },
      }}
    >
      {/* Totals */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          minWidth: 0,
          overflow: 'auto',
          transition: 'all 0.3s ease',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          TOTAL
        </Typography>

        {totals.map((t) => (
          <Box
            key={t.field}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0.5,
              whiteSpace: 'nowrap',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t.label}:
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t.display}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Pagination */}
      <GridFooter />
    </Box>
  );
}
