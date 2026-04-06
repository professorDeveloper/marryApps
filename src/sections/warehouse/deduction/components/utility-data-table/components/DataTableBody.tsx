import type { RefObject } from 'react';
import type { RowAction, DataTableColumn } from '../types/types';

import { AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { BORDER, SURFACE_BG } from '../utils';
import { DataTableRow } from './DataTableRow';

export type DataTableBodyProps<T> = {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  colOrder: string[];
  visibility: Record<string, boolean>;
  widths: Record<string, number | string>;
  showRowNumbers: boolean;
  showCheckboxes: boolean;
  selectedIds: Set<string>;
  onToggleSelected: (rowId: string) => void;
  rowActions: Array<RowAction<T>>;
  editing: { rowId: string; key: string } | null;
  startEdit: (rowId: string, key: string) => void;
  commitEdit: (rowId: string, key: string, next: unknown) => void;
  cancelEdit: () => void;
  getRowId: (row: T) => string;
  scrollRef: RefObject<HTMLDivElement | null>;
  emptyTitle: string;
  emptySubtitle: string;
};

export function DataTableBody<T>({
  data,
  columns,
  colOrder,
  visibility,
  widths,
  showRowNumbers,
  showCheckboxes,
  selectedIds,
  onToggleSelected,
  rowActions,
  editing,
  startEdit,
  commitEdit,
  cancelEdit,
  getRowId,
  scrollRef,
  emptyTitle,
  emptySubtitle,
}: DataTableBodyProps<T>) {
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 8,
  });

  return (
    <Box
      ref={scrollRef}
      sx={{
        position: 'relative',
        height: 'min(70vh, 720px)',
        overflow: 'auto',
        backgroundColor: SURFACE_BG,
      }}
    >
      {data.length === 0 ? (
        <Box
          sx={{
            height: "100%",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: 'rgba(255,255,255,0.75)',
            backgroundColor:'var(--mui-palette-background-level2)',
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${BORDER}`,
              backgroundColor: 'rgba(24,24,27,0.7)',
            }}
          >
            <Iconify icon="solar:inbox-in-bold-duotone" width={26} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>{emptyTitle}</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
            {emptySubtitle}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          <AnimatePresence initial={false}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              const rowId = getRowId(row);
              const selected = selectedIds.has(rowId);

              return (
                <Box
                  key={rowId}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 1,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <DataTableRow<T>
                    row={row}
                    rowId={rowId}
                    index={virtualRow.index}
                    columns={columns}
                    colOrder={colOrder}
                    visibility={visibility}
                    widths={widths}
                    showRowNumbers={showRowNumbers}
                    showCheckboxes={showCheckboxes}
                    selected={selected}
                    onToggleSelected={() => onToggleSelected(rowId)}
                    rowActions={rowActions}
                    editing={editing}
                    startEdit={startEdit}
                    commitEdit={commitEdit}
                    cancelEdit={cancelEdit}
                  />
                </Box>
              );
            })}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
}
