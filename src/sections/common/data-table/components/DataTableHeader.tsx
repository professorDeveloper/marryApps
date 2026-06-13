import type { MutableRefObject } from 'react';
import type { SortDirection, DataTableColumn } from '../types/types';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

import { useTranslate } from 'src/locales/use-locales';

import { ACCENT, nextSort } from '../utils';

export type DataTableHeaderProps<T> = {
  gridTemplateColumns: string;
  minTableWidth: number;
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
  minTableWidth,
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
  const checkboxWidth = showCheckboxes ? 44 : 0;
  const rowNumberWidth = showRowNumbers ? 56 : 0;
  const firstColLeft = checkboxWidth + rowNumberWidth;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns,
        width: `max(100%, ${minTableWidth}px)`,
        flexShrink: 0,
        alignItems: 'center',
        py: 1.5,
        maxHeight: 52,
        px: 1,
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
    >
      {showCheckboxes && (
        <Box sx={{ display: 'flex', justifyContent: 'center', position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--bg)' }}>
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={someVisibleSelected}
            onChange={toggleAllVisible}
            size="small"
            sx={{
              color: 'var(--text3)',
              '&.Mui-checked': { color: 'var(--brand)' },
            }}
          />
        </Box>
      )}

      {showRowNumbers && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'sticky', left: checkboxWidth, zIndex: 1, backgroundColor: 'var(--bg)' }}>
          <Typography
            sx={{
              // fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: 'var(--text2)',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            #
          </Typography>
        </Box>
      )}

      {visibleColumns.map((col) => {
        const colSortKey = col.sortKey ?? col.key;
        const isActiveSort = sort.key === colSortKey && sort.dir != null;
        const canSort = col.sortable !== false;
        const canFilter = col.filterable === true || Boolean(col.filter);
        const canReorder = col.reorderable !== false;
        const filterOn = Boolean(filters[col.key]);
        const isFirstCol = col.key === visibleColumns[0]?.key;

        return (
          <Box
            key={col.key}
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
              ...(isFirstCol && { position: 'sticky', left: firstColLeft, zIndex: 1, backgroundColor: 'var(--bg)' }),
            }}
          >
            <Tooltip title={col.label} placement="top" enterDelay={500}>
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '11px',
                  lineHeight: 1.2,
                  color: 'var(--text2)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.6px',
                  fontFamily: 'var(--font-sans)',
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
                    aria-label={t('dataTable.sort')}
                    onClick={() => {
                      const nextDir = sort.key !== colSortKey ? 'asc' : nextSort(sort.dir);
                      onSortChange({ key: nextDir ? colSortKey : null, dir: nextDir });
                    }}
                    sx={{
                      width: 24,
                      height: 24,
                      color: isActiveSort ? ACCENT : 'var(--text-3)',
                      '&:hover': { color: ACCENT },
                    }}
                  >
                    {sort.key === colSortKey && sort.dir != null ? (
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
                    aria-label={t('dataTable.filter')}
                    onClick={(e) => onOpenFilter(col.key, e.currentTarget)}
                    sx={{
                      width: 24,
                      height: 24,
                      color: filterOn ? 'var(--brand)' : 'var(--text3)',
                      '&:hover': { color: 'var(--brand)' },
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
                
              }}
            />
          </Box>
        );
      })}

      {/* Spacer aligning the header with the row-actions column; a Tooltip here
          would clone aria-label onto a plain div (aria-prohibited-attr) */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 28, height: 28 }} />
      </Box>
    </Box>
  );
}
