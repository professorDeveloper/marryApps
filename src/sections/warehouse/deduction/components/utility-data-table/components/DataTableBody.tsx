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
  onRowClick?: (row: T) => void;
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
  onRowClick,
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
        flex: 1,
        overflow: 'auto',
        backgroundColor: 'var(--color-surface-0)',
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
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface-0)',
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-0)',
            }}
          >
            <Iconify icon="solar:inbox-in-bold-duotone" width={26} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>{emptyTitle}</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'var(--color-text-subtle)', textAlign: 'center' }}>
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
                    onRowClick={onRowClick}
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
