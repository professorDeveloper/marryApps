/**
 * Department table cell renderers for the departments list view
 */

import { Box, ListItemText, Typography } from '@mui/material';

import type { IDepartmentItem } from 'src/types/departments.tsx';
import { RenderCell } from 'src/components/RenderCell';
import { CELL_SX } from 'src/sections/warehouse/deduction/components/utility-data-table/utils/constants';

interface CellRenderParams {
  row: IDepartmentItem;
}

export function RenderCellDepartmentName({ row }: CellRenderParams) {
  return <RenderCell label={row.name || '-'} />;
}

export function RenderCellStorageId({ row }: CellRenderParams) {
  return <RenderCell label={row.storage_name || '-'} />;
}

export function RenderCellColor({ row }: CellRenderParams) {
  const colorCode = row.color_code;

  if (!colorCode) {
    return <RenderCell label="-" />;
  }

  return (
    <Box sx={CELL_SX}>
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
