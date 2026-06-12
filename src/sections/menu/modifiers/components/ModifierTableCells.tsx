/**
 * Modifier table cell renderers for the modifiers list view
 */

import type { IModifierItem } from 'src/types/modifiers';

import { Box, Chip } from '@mui/material';

interface CellRenderParams {
  row: IModifierItem;
}

export function RenderCellModifierName({ row }: CellRenderParams) {
  const name = row.name || '-';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.5,
        px: 1,
        color: 'text.primary',
        fontSize: '0.875rem',
        fontWeight: 400,
      }}
    >
      {name}
    </Box>
  );
}

export function RenderCellModifierCode({ row }: CellRenderParams) {
  const code = row.code || '-';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.5,
        px: 1,
        color: 'text.secondary',
        fontSize: '0.875rem',
        fontWeight: 400,
        fontFamily: 'monospace',
      }}
    >
      {code}
    </Box>
  );
}

export function RenderCellIsActive({ row }: CellRenderParams) {
  const isActive = row.is_active;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.5,
        px: 1,
      }}
    >
      <Chip
        label={isActive ? 'Active' : 'Inactive'}
        size="small"
        color={isActive ? 'success' : 'default'}
        variant="outlined"
      />
    </Box>
  );
}

export function RenderCellCreatedAt({ row }: CellRenderParams) {
  const createdAt = row.created_at ? new Date(row.created_at).toLocaleDateString() : '-';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.5,
        px: 1,
        color: 'text.secondary',
        fontSize: '0.875rem',
        fontWeight: 400,
      }}
    >
      {createdAt}
    </Box>
  );
}
