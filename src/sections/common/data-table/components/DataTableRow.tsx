import type { ReactNode } from 'react';
import type { RowAction, DataTableColumn } from '../types/types';

import { memo, useMemo } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { getCellValue, buildGridTemplate } from '../utils';

type SpecialColumn = '__checkbox__' | '__rowNumber__' | '__actions__';

function isSpecial(key: string): key is SpecialColumn {
  return key === '__checkbox__' || key === '__rowNumber__';
}

export type DataTableRowProps<T> = {
  row: T;
  rowId: string;
  index: number;
  columns: Array<DataTableColumn<T>>;
  colOrder: string[];
  visibility: Record<string, boolean>;
  widths: Record<string, number | string>;
  minTableWidth: number;
  showRowNumbers: boolean;
  showCheckboxes: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  rowActions: Array<RowAction<T>>;
  editing: { rowId: string; key: string } | null;
  startEdit: (rowId: string, key: string) => void;
  commitEdit: (rowId: string, key: string, next: unknown) => void;
  cancelEdit: () => void;
  onRowClick?: (row: T) => void;
  onRowHover?: (row: T) => void;
};

export const DataTableRow = memo(function DataTableRow<T>({
  row,
  rowId,
  index,
  columns,
  colOrder,
  visibility,
  widths,
  minTableWidth,
  showRowNumbers,
  showCheckboxes,
  selected,
  onToggleSelected,
  rowActions,
  editing,
  startEdit,
  commitEdit,
  cancelEdit,
  onRowClick,
  onRowHover,
}: DataTableRowProps<T>) {
  const visibleCols = useMemo(() => {
    const byKey = new Map(columns.map((c) => [c.key, c]));
    return colOrder
      .filter((k) => !isSpecial(k))
      .map((k) => byKey.get(k))
      .filter(Boolean)
      .filter((c) => visibility[(c as DataTableColumn<T>).key] !== false) as Array<DataTableColumn<T>>;
  }, [columns, colOrder, visibility]);

  const gridTemplateColumns = useMemo(
    () => buildGridTemplate(visibleCols, widths, { showCheckboxes, showRowNumbers, showActions: rowActions.length > 0 }),
    [visibleCols, widths, showCheckboxes, showRowNumbers, rowActions]
  );

  const checkboxWidth = showCheckboxes ? 44 : 0;
  const rowNumberWidth = showRowNumbers ? 56 : 0;
  const firstColLeft = checkboxWidth + rowNumberWidth;

  return (
    <Box
      onClick={() => onRowClick?.(row)}
      onMouseEnter={() => onRowHover?.(row)}
      sx={{
        display: 'grid',
        gridTemplateColumns,
        width: `max(100%, ${minTableWidth}px)`,
        alignItems: 'center',
        // px: 1,
        height: 44,
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        cursor: onRowClick ? 'pointer' : 'default',
        backgroundColor: 'var(--bg)',
        '&:hover': {
          backgroundColor: 'var(--bg2)',
        },
        '&:hover .utilityDtMore': { opacity: 1 },
        '&:hover .dtStickyCell': { backgroundColor: 'var(--bg2)' },
      }}
    >
      {showCheckboxes && (
        <Box className="dtStickyCell" sx={{ display: 'flex', justifyContent: 'center', position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--bg)' }}>
          <Checkbox
            checked={selected}
            onChange={onToggleSelected}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{
              color: 'var(--text3)',
              '&.Mui-checked': { color: 'var(--brand)' },
            }}
          />
        </Box>
      )}

      {showRowNumbers && (
        <Typography
          className="dtStickyCell"
          sx={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'text.secondary',
            textAlign: 'center',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'sticky',
            left: checkboxWidth,
            zIndex: 1,
            backgroundColor: 'var(--bg)',
          }}
        >
          {index + 1}
        </Typography>
      )}

      {visibleCols.map((col) => {
        const value = getCellValue(col, row);
        const isEditing = editing?.rowId === rowId && editing.key === col.key;
        const isFirstCol = col.key === visibleCols[0]?.key;

        return (
          <Box
            key={col.key}
            className={isFirstCol ? 'dtStickyCell' : undefined}
            sx={{
              px: 1,
              minWidth: 0,
              display: 'flex',
              justifyContent:
                col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
              backgroundColor: 'transparent',
              ...(isFirstCol && { position: 'sticky', left: firstColLeft, zIndex: 1, backgroundColor: 'var(--bg)' }),
            }}
            onDoubleClick={() => {
              if (col.editable) startEdit(rowId, col.key);
            }}
          >
            {isEditing ? (
              col.renderEdit ? (
                col.renderEdit({
                  row,
                  value,
                  onCommit: (next) => commitEdit(rowId, col.key, next),
                  onCancel: cancelEdit,
                })
              ) : (
                <TextField
                  autoFocus
                  size="small"
                  defaultValue={value == null ? '' : String(value)}
                  onBlur={(e) => commitEdit(rowId, col.key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelEdit();
                    if (e.key === 'Enter')
                      commitEdit(rowId, col.key, (e.target as HTMLInputElement).value);
                  }}
                  sx={{
                    width: 1,
                    '& .MuiInputBase-root': {
                      height: 32,
                      fontSize: 12,
                      backgroundColor: 'var(--bg3)',
                      borderRadius: 1,
                      fontFamily: 'var(--font-sans)',
                    },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--accent)',
                      boxShadow: '0 0 0 3px var(--glow-md)',
                    },
                  }}
                />
              )
            ) : col.renderCell ? (
              col.renderCell({ row, value })
            ) : (
              <Typography
                noWrap
                sx={{
                  width: 1,
                  fontSize: 13,
                  color: 'var(--text)',
                  textAlign: col.align || 'left',
                  fontFamily: 'var(--font-sans)',
                  textOverflow: 'ellipsis',
                  backgroundColor: 'transparent',
                }}
              >
                {value == null ? '' : String(value)}
              </Typography>
            )}
          </Box>
        );
      })}

    </Box>
  );
}) as <T>(props: DataTableRowProps<T>) => ReactNode;
