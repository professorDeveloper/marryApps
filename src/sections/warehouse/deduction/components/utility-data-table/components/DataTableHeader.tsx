import type { MutableRefObject } from 'react';
import type { SortDirection, DataTableColumn } from '../types/types';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { ACCENT, BORDER, nextSort, SURFACE_BG } from '../utils';

export type DataTableHeaderProps<T> = {
  gridTemplateColumns: string;
  showCheckboxes: boolean;
  showRowNumbers: boolean;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  toggleAllVisible: () => void;
  visibleColumns: Array<DataTableColumn<T>>;
  sort: { key: string | null; dir: SortDirection };
  onSortChange: (sort: { key: string | null; dir: SortDirection }) => void;
  filters: Record<string, unknown>;
  onOpenFilter: (key: string, el: HTMLElement) => void;
  onReorder: (fromKey: string, toKey: string) => void;
  onResizeStart: (key: string, e: React.PointerEvent) => void;
  onResizeMove: (e: React.PointerEvent) => void;
  onResizeEnd: () => void;
  headerDragKey: MutableRefObject<string | null>;
};

export function DataTableHeader<T>({
  gridTemplateColumns,
  showCheckboxes,
  showRowNumbers,
  allVisibleSelected,
  someVisibleSelected,
  toggleAllVisible,
  visibleColumns,
  sort,
  onSortChange,
  filters,
  onOpenFilter,
  onReorder,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  headerDragKey,
}: DataTableHeaderProps<T>) {
  return (
    <Box
      component={m.div}
      layout
      sx={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        height: 44,
        px: 1,
        backgroundColor: SURFACE_BG,
        borderBottom: `1px solid ${BORDER}`,
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
    >
      {showCheckboxes && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onChange={toggleAllVisible}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.35)',
              '&.Mui-checked': { color: ACCENT },
            }}
          />
        </Box>
      )}

      {showRowNumbers && (
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          #
        </Typography>
      )}

      {visibleColumns.map((col) => {
        const isActiveSort = sort.key === col.key && sort.dir != null;
        const canSort = col.sortable !== false;
        const canFilter = col.filterable === true || Boolean(col.filter);
        const canReorder = col.reorderable !== false;
        const filterOn = Boolean(filters[col.key]);

        return (
          <Box
            key={col.key}
            component={m.div}
            layout
            draggable={canReorder}
            onDragStart={() => {
              headerDragKey.current = col.key;
            }}
            onDragOver={(e) => {
              if (!headerDragKey.current) return;
              e.preventDefault();
            }}
            onDrop={() => {
              const from = headerDragKey.current;
              headerDragKey.current = null;
              if (!from) return;
              onReorder(from, col.key);
            }}
            sx={{
              position: 'relative',
              height: 44,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              px: 1,
              gap: 0.75,
              cursor: canReorder ? 'grab' : 'default',
              userSelect: 'none',
            }}
          >
            <Typography
              noWrap
              sx={{
                minWidth: 0,
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.78)',
                fontWeight: 600,
                fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
              }}
            >
              {col.label}
            </Typography>

            {canSort && (
              <IconButton
                size="small"
                onClick={() => {
                  const nextDir = sort.key !== col.key ? 'asc' : nextSort(sort.dir);
                  onSortChange({ key: nextDir ? col.key : null, dir: nextDir });
                }}
                sx={{
                  width: 28,
                  height: 28,
                  color: isActiveSort ? ACCENT : 'rgba(255,255,255,0.45)',
                  '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
                }}
              >
                <Iconify
                  icon={
                    sort.key !== col.key || sort.dir == null
                      ? 'solar:sort-by-time-bold-duotone'
                      : sort.dir === 'asc'
                        ? 'solar:double-alt-arrow-up-bold-duotone'
                        : 'solar:double-alt-arrow-down-bold-duotone'
                  }
                  width={16}
                />
              </IconButton>
            )}

            {canFilter && (
              <IconButton
                size="small"
                onClick={(e) => onOpenFilter(col.key, e.currentTarget)}
                sx={{
                  width: 28,
                  height: 28,
                  color: filterOn ? ACCENT : 'rgba(255,255,255,0.45)',
                  '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
                }}
              >
                <Iconify icon="ic:round-filter-list" width={16} />
              </IconButton>
            )}

            {/* Resize handle */}
            <Box
              onPointerDown={(e) => onResizeStart(col.key, e)}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeEnd}
              onPointerCancel={onResizeEnd}
              sx={{
                position: 'absolute',
                right: -2,
                top: 6,
                bottom: 6,
                width: 8,
                cursor: 'col-resize',
                borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
              }}
            />
          </Box>
        );
      })}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Row actions">
          <Box sx={{ width: 28, height: 28 }} />
        </Tooltip>
      </Box>
    </Box>
  );
}
