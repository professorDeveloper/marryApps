import type { ReactNode, RefObject } from 'react';
import type { RowAction, DataTableColumn } from '../types/types';

import { memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { DataTableRow } from './DataTableRow';

export type DataTableBodyProps<T> = {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  colOrder: string[];
  visibility: Record<string, boolean>;
  widths: Record<string, number | string>;
  minTableWidth: number;
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
  onRowHover?: (row: T) => void;
  pageOffset?: number;
};

export const DataTableBody = memo(function DataTableBody<T>({
  data,
  columns,
  colOrder,
  visibility,
  widths,
  minTableWidth,
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
  onRowHover,
  pageOffset = 0,
}: DataTableBodyProps<T>) {
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 8,
    // Approximate the real scroll container height (table card is `min(88vh, 880px)`
    // minus toolbar/header chrome) so the first render already computes the correct
    // visible range. Without this, react-virtual starts from {0,0}, then forces a
    // synchronous flushSync re-render once it measures the real size on mount,
    // mounting all visible rows in one large blocking commit.
    initialRect: { width: 0, height: 600 },
  });

  return (
    <Box
      ref={scrollRef}
      sx={{
        position: 'relative',
        flex: 1,
        flexShrink: 0,
        width: `max(100%, ${minTableWidth}px)`,
        overflowY: 'auto',
        overflowX: 'visible',
        backgroundColor: 'var(--bg)',
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
            color: 'var(--text3)',
            backgroundColor: 'var(--bg2)',
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg2)',
            }}
          >
            <Iconify icon="solar:inbox-in-bold-duotone" width={26} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>{emptyTitle}</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'var(--text3)', textAlign: 'center' }}>
            {emptySubtitle}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index];
            if (!row) return null;
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
                  index={pageOffset + virtualRow.index}
                  columns={columns}
                  colOrder={colOrder}
                  visibility={visibility}
                  widths={widths}
                  minTableWidth={minTableWidth}
                  showRowNumbers={showRowNumbers}
                  showCheckboxes={showCheckboxes}
                  selected={selected}
                  onToggleSelected={onToggleSelected}
                  rowActions={rowActions}
                  editing={editing}
                  startEdit={startEdit}
                  commitEdit={commitEdit}
                  cancelEdit={cancelEdit}
                  onRowClick={onRowClick}
                  onRowHover={onRowHover}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}) as <T>(props: DataTableBodyProps<T>) => ReactNode;
