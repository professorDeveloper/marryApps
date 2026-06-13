import type { DataTableColumn } from '../types/types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export type DataTableTotalsFooterProps<T> = {
  gridTemplateColumns: string;
  minTableWidth: number;
  showCheckboxes: boolean;
  showRowNumbers: boolean;
  visibleColumns: Array<DataTableColumn<T>>;
  totals: Record<string, string>;
};

export function DataTableTotalsFooter<T>({
  gridTemplateColumns,
  minTableWidth,
  showCheckboxes,
  showRowNumbers,
  visibleColumns,
  totals,
}: DataTableTotalsFooterProps<T>) {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 3,
        display: 'grid',
        gridTemplateColumns,
        width: `max(100%, ${minTableWidth}px)`,
        flexShrink: 0,
        alignItems: 'center',
        height: 44,
        px: 1,

        backgroundColor: 'var(--bg3)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {(() => {
        const checkboxWidth = showCheckboxes ? 44 : 0;
        const rowNumberWidth = showRowNumbers ? 56 : 0;
        const firstColLeft = checkboxWidth + rowNumberWidth;
        const lastColKey = visibleColumns.length > 0 ? visibleColumns[visibleColumns.length - 1].key : null;

        return (
          <>
            {showCheckboxes && (
              <Box sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--bg3)' }} />
            )}
            {showRowNumbers && (
              <Typography
                sx={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12.5,
                  color: 'var(--text)',
                  textAlign: 'center',
                  fontWeight: 700,
                  userSelect: 'none',
                  position: 'sticky',
                  left: checkboxWidth,
                  zIndex: 1,
                  backgroundColor: 'var(--bg3)',
                }}
              >
                TOTAL
              </Typography>
            )}

            {visibleColumns.map((col) => {
              const isFirstCol = col.key === visibleColumns[0]?.key;
              const isLastCol = col.key === lastColKey;
              return (
                <Box
                  key={col.key}
                  sx={{
                    px: 1,
                    minWidth: 0,
                    display: 'flex',
                    justifyContent:
                      col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                    ...(isFirstCol && {
                      position: 'sticky',
                      left: firstColLeft,
                      zIndex: 1,
                      backgroundColor: 'var(--bg3)',
                    }),
                    ...(isLastCol && {
                      position: 'sticky',
                      right: 0,
                      zIndex: 1,
                      backgroundColor: 'var(--bg3)',
                    }),
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: col.total ? 'var(--text)' : 'var(--text3)',
                      opacity: col.total ? 1 : 0.5,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {col.total ? totals[col.key] : ''}
                  </Typography>
                </Box>
              );
            })}
            <Box />
          </>
        );
      })()}
    </Box>
  );
}
