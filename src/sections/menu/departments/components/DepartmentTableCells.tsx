/**
 * Department table cell renderers for the departments list view
 */

import { Box, ListItemText, Typography } from '@mui/material';

import type { IDepartmentItem } from 'src/types/departments.tsx';

interface CellRenderParams {
  row: IDepartmentItem;
}

export function RenderCellDepartmentName({ row }: CellRenderParams) {
  const name = row.name || '-';

  return (
    <Box
      sx={{
        py: 2,
        width: 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <ListItemText primary={<span>{name}</span>} />
    </Box>
  );
}

export function RenderCellStorageId({ row }: CellRenderParams) {
  const storageName = row.storage_name || '-';

  return (
    <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
      {storageName}
    </Box>
  );
}

export function RenderCellColor({ row }: CellRenderParams) {
  const colorCode = row.color_code;

  if (!colorCode) {
    return <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>-</Box>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: colorCode,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    </Box>
  );
}
