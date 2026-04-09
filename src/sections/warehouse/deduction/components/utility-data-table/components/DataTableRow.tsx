import type { ReactNode } from 'react';
import type { RowAction, DataTableColumn } from '../types/types';

import { m } from 'framer-motion';
import { memo, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ACCENT, BORDER, getCellValue, buildGridTemplate } from '../utils';

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
};

export const DataTableRow = memo(function DataTableRow<T>({
  row,
  rowId,
  index,
  columns,
  colOrder,
  visibility,
  widths,
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
}: DataTableRowProps<T>) {
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

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

  return (
    <Box
      component={m.div}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      onClick={() => onRowClick?.(row)}
      sx={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: 'center',
        px: 1,
        height: 44,
        borderBottom: `1px solid ${BORDER}`,
        position: 'relative',
        cursor: onRowClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: 'rgba(245, 158, 11, 0.06)',
        },
        '&:hover .utilityDtMore': { opacity: 1 },
      }}
    >
      {showCheckboxes && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Checkbox
            checked={selected}
            onChange={onToggleSelected}
            onClick={(e) => e.stopPropagation()}
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
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {index + 1}
        </Typography>
      )}

      {visibleCols.map((col) => {
        const value = getCellValue(col, row);
        const isEditing = editing?.rowId === rowId && editing.key === col.key;

        return (
          <Box
            key={col.key}
            sx={{
              px: 1,
              minWidth: 0,
              display: 'flex',
              justifyContent:
                col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
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
                      backgroundColor: 'rgba(9,9,11,0.7)',
                      borderRadius: 1,
                      fontFamily: col.mono
                        ? '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
                        : '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                    },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: ACCENT,
                      boxShadow: `0 0 0 3px rgba(245, 158, 11, 0.15)`,
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
                  fontSize: 12.5,
                  color: 'rgba(255,255,255,0.86)',
                  textAlign: col.align || 'left',
                  fontFamily: col.mono
                    ? '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
                    : '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
                  textOverflow: 'ellipsis',
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
