import type { MutableRefObject } from 'react';
import type { SortDirection, DataTableColumn } from '../types/types';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

import { useTranslate } from 'src/locales/use-locales';

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
  const { t } = useTranslate('common');
  return (
    <Box
      component={m.div}
      layout
      sx={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        py: 1,
        maxHeight: 46,
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
        </Box>
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
              minWidth: 0,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              px: 1,
              gap: 0.5,
              cursor: canReorder ? 'grab' : 'default',
              userSelect: 'none',
              justifyContent: col.headerActionsAlign === 'end' ? 'space-between' : 'flex-start',
            }}
          >
            <Tooltip title={col.label} placement="top" enterDelay={500}>
              <Typography
                sx={{
                  flex: col.headerActionsAlign === 'end' ? 1 : '0 1 auto',
                  minWidth: 0,
                  fontSize: 12.5,
                  lineHeight: 1.2,
                  color: 'rgba(255,255,255,0.78)',
                  fontWeight: 600,
                  fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'normal',
                  overflow: 'hidden',
                }}
              >
                {col.label}
              </Typography>
            </Tooltip>

            <Box
              className="col-actions"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                flexShrink: 0,
              }}
            >
              {canSort && (
                <Tooltip title={t('dataTable.sort')}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const nextDir = sort.key !== col.key ? 'asc' : nextSort(sort.dir);
                      onSortChange({ key: nextDir ? col.key : null, dir: nextDir });
                    }}
                    sx={{
                      width: 24,
                      height: 24,
                      color: isActiveSort ? ACCENT : 'rgba(255,255,255,0.45)',
                      '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
                    }}
                  >
                    {sort.key === col.key && sort.dir != null ? (
                      <KeyboardDoubleArrowDownIcon 
                        sx={{ 
                          fontSize: 16,
                          transform: sort.dir === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                    ) : (
                      <SwapVertIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Tooltip>
              )}

              {canFilter && (
                <Tooltip title={t('dataTable.filter')}>
                  <IconButton
                    size="small"
                    onClick={(e) => onOpenFilter(col.key, e.currentTarget)}
                    sx={{
                      width: 24,
                      height: 24,
                      color: filterOn ? ACCENT : 'rgba(255,255,255,0.45)',
                      '&:hover': { color: ACCENT, backgroundColor: 'rgba(245, 158, 11, 0.10)' },
                    }}
                  >
                    <FilterAltIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

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
