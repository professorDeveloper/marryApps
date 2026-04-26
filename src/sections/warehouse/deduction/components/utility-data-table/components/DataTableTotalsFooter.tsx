import type { DataTableColumn } from '../types/types';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { ACCENT } from '../utils';

export type DataTableTotalsFooterProps<T> = {
  gridTemplateColumns: string;
  showCheckboxes: boolean;
  showRowNumbers: boolean;
  visibleColumns: Array<DataTableColumn<T>>;
  totals: Record<string, string>;
};

export function DataTableTotalsFooter<T>({
  gridTemplateColumns,
  showCheckboxes,
  showRowNumbers,
  visibleColumns,
  totals,
}: DataTableTotalsFooterProps<T>) {
  return (
    <Box
      component={m.div}
      layout
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 3,
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        height: 44,
        px: 1,
 
         backgroundColor: 'var(--color-surface-1)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {showCheckboxes && <Box />}
      {showRowNumbers && (
        <Typography
          sx={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            color: 'var(--color-text)',
            textAlign: 'center',
            fontWeight: 700,
            userSelect: 'none',
          }}
        >
          TOTAL
        </Typography>
      )}

      {visibleColumns.map((col) => (
        <Box
          key={col.key}
          sx={{
            px: 1,
            minWidth: 0,
            display: 'flex',
            justifyContent:
              col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
          }}
        >
          <Typography
            noWrap
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              color: col.total ? 'var(--color-text)' : 'var(--color-text-muted)',
              opacity: col.total ? 1 : 0.5,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {col.total ? totals[col.key] : ''}
          </Typography>
        </Box>
      ))}
      <Box />
    </Box>
  );
}
