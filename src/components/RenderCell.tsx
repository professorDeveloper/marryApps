import { Box } from '@mui/material';
import { CELL_SX } from '../sections/warehouse/deduction/components/utility-data-table/utils/constants';

export function RenderCell({ label }: { label: string }) {
  return (
    <Box sx={CELL_SX}>
      {label||'-'}
    </Box>
  );
}
