import type { Inventory } from '../types';

import React, { memo } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import { 
  formatInventoryDate, 
  formatInventoryAmount, 
  getInventoryStatusConfig 
} from '../utils';

interface InventoryDateCellProps {
  value: string | undefined;
}

export const InventoryDateCell = memo(function InventoryDateCell({ value }: InventoryDateCellProps) {
  return (
    <Box sx={{ fontSize: '0.875rem' }}>
      {formatInventoryDate(value)}
    </Box>
  );
});

interface InventoryAmountCellProps {
  value: number;
}

export const InventoryAmountCell = memo(function InventoryAmountCell({ value }: InventoryAmountCellProps) {
  return (
    <Box sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
      {formatInventoryAmount(value)}
    </Box>
  );
});

interface InventoryStatusCellProps {
  value: string;
}

export const InventoryStatusCell = memo(function InventoryStatusCell({ value }: InventoryStatusCellProps) {
  const config = getInventoryStatusConfig(value);

  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.5,
        borderRadius: 0.75,
        border: '1px solid',
        borderColor: config.color + '40',
        backgroundColor: config.color + '10',
        color: config.color,
        fontSize: 12,
        fontWeight: 700,
        textAlign: 'center',
        minWidth: 72,
      }}
    >
      {config.label}
    </Box>
  );
});

interface InventoryActionsCellProps {
  row: Inventory;
  onView: (inventory: Inventory) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const InventoryActionsCell = memo(function InventoryActionsCell({ 
  row, 
  onView, 
  onEdit, 
  onDelete 
}: InventoryActionsCellProps) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <IconButton
        size="small"
        onClick={() => onView(row)}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon="solar:eye-bold" width={18} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onEdit(row.id)}
        sx={{ color: 'text.secondary' }}
      >
        <Iconify icon="solar:pen-bold" width={18} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDelete(row.id)}
        sx={{ color: 'error.main' }}
      >
        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
      </IconButton>
    </Box>
  );
});
