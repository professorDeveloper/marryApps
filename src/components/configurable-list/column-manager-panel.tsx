import type { PersistedColumnState } from './types';

import { useRef, useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ---------------------------------------------------------------------------
// Simplified column info for the panel (avoids GridColDef union issues)
// ---------------------------------------------------------------------------

export interface ColumnInfo {
  field: string;
  headerName?: string;
  /** Whether this column can be toggled visible/hidden */
  clHideable?: boolean;
  /** Whether this column can be reordered */
  reorderable?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ColumnManagerPanelProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnInfo[];
  columnStates: PersistedColumnState[];
  onToggle: (field: string) => void;
  onMove: (field: string, toIndex: number) => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Pinned field detection
// ---------------------------------------------------------------------------

const PINNED_FIELDS = new Set(['__checkbox__', '__rowNumber__', '__selection__']);

function isPinned(col: ColumnInfo): boolean {
  return PINNED_FIELDS.has(col.field) || col.reorderable === false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColumnManagerPanel({
  open,
  onClose,
  columns,
  columnStates,
  onToggle,
  onMove,
  onReset,
}: ColumnManagerPanelProps) {
  const columnsMap = useMemo(
    () => new Map(columns.map((c) => [c.field, c])),
    [columns]
  );

  // Sorted states: pinned first, then reorderable in their order
  const sortedStates = useMemo(() => {
    const sorted = [...columnStates].sort((a, b) => a.orderIndex - b.orderIndex);
    const pinned = sorted.filter((s) => {
      const col = columnsMap.get(s.field);
      return col && isPinned(col);
    });
    const reorderable = sorted.filter((s) => {
      const col = columnsMap.get(s.field);
      return col && !isPinned(col);
    });
    return { pinned, reorderable };
  }, [columnStates, columnsMap]);

  // Drag state
  const [dragField, setDragField] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceIndex = useRef<number | null>(null);

  const handleDragStart = useCallback((field: string, index: number) => {
    setDragField(field);
    dragSourceIndex.current = index;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragField) setDragOverIndex(index);
    },
    [dragField]
  );

  const handleDrop = useCallback(
    (_e: React.DragEvent, targetIndex: number) => {
      if (dragField && dragSourceIndex.current !== null) {
        onMove(dragField, targetIndex);
      }
      setDragField(null);
      setDragOverIndex(null);
      dragSourceIndex.current = null;
    },
    [dragField, onMove]
  );

  const handleDragEnd = useCallback(() => {
    setDragField(null);
    setDragOverIndex(null);
    dragSourceIndex.current = null;
  }, []);

  const visibleCount = columnStates.filter((s) => s.visible).length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 320, p: 0 } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="solar:settings-bold-duotone" width={22} />
          <Typography variant="subtitle1">Columns</Typography>
          <Chip label={visibleCount} size="small" color="primary" />
        </Box>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </Box>

      <Divider />

      {/* Pinned columns */}
      {sortedStates.pinned.length > 0 && (
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Fixed columns
          </Typography>
          {sortedStates.pinned.map((state) => {
            const col = columnsMap.get(state.field);
            if (!col) return null;
            return (
              <Box
                key={state.field}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                  opacity: 0.7,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:list-bold" width={16} sx={{ color: 'text.disabled' }} />
                  <Typography variant="body2">
                    {col.headerName || col.field}
                  </Typography>
                </Box>
                {col.clHideable !== false ? (
                  <Switch
                    size="small"
                    checked={state.visible}
                    onChange={() => onToggle(state.field)}
                  />
                ) : (
                  <Tooltip title="Always visible">
                    <Iconify icon="solar:eye-bold" width={16} sx={{ color: 'text.disabled' }} />
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      <Divider />

      {/* Reorderable columns */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1, flex: 1, overflowY: 'auto' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Reorderable columns
        </Typography>

        {sortedStates.reorderable.map((state, index) => {
          const col = columnsMap.get(state.field);
          if (!col) return null;

          const isDragging = dragField === state.field;
          const isDragOver = dragOverIndex === index;

          return (
            <Box
              key={state.field}
              draggable
              onDragStart={() => handleDragStart(state.field, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.75,
                px: 1,
                my: 0.25,
                borderRadius: 1,
                cursor: 'grab',
                transition: 'all 0.2s ease',
                opacity: isDragging ? 0.4 : 1,
                bgcolor: isDragOver ? 'action.hover' : 'transparent',
                borderTop: isDragOver ? '2px solid' : '2px solid transparent',
                borderColor: isDragOver ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify
                  icon="solar:list-bold"
                  width={16}
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: state.visible ? 'none' : 'line-through',
                    color: state.visible ? 'text.primary' : 'text.disabled',
                  }}
                >
                  {col.headerName || col.field}
                </Typography>
              </Box>

              <Switch
                size="small"
                checked={state.visible}
                onChange={() => onToggle(state.field)}
              />
            </Box>
          );
        })}
      </Box>

      <Divider />

      {/* Footer actions */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="small"
          startIcon={<Iconify icon="solar:restart-bold" width={18} />}
          onClick={() => {
            onReset();
            onClose();
          }}
        >
          Reset to default
        </Button>
      </Box>
    </Drawer>
  );
}
