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
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      py: 1.5, 
      px: 1,
      color: 'text.primary',
      fontSize: '0.875rem',
      fontWeight: 400
    }}>
      {name}
    </Box>
  );
}

export function RenderCellStorageId({ row }: CellRenderParams) {
  const storageName = row.storage_name || '-';

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      py: 1.5, 
      px: 1,
      color: 'text.primary',
      fontSize: '0.875rem',
      fontWeight: 400
    }}>
      {storageName}
    </Box>
  );
}

export function RenderCellColor({ row }: CellRenderParams) {
  const colorCode = row.color_code;

  if (!colorCode) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        py: 1.5, 
        px: 1,
        color: 'text.primary',
        fontSize: '0.875rem',
        fontWeight: 400
      }}>
        -
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      py: 1.5, 
      px: 1
    }}>
      <Box
        sx={{
          width: 40,
          height: 32,
          borderRadius: '6px',
          bgcolor: colorCode,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
    </Box>
  );
}
