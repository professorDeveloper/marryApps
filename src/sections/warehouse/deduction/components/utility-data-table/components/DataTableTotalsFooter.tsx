import type { DataTableColumn } from '../types/types';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { ACCENT, APP_BG, BORDER } from '../utils';

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
 
         backgroundColor: 'grey.700',
         borderBottom: `2px solid ${ACCENT}`,
      }}
    >
      {showCheckboxes && <Box />}
      {showRowNumbers && (
        <Typography
          sx={{
            fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
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
              color: col.total ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              fontFamily: col.mono
                ? '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
                : '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
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
