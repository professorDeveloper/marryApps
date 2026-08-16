import type { IDevice } from '../types';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

interface DeviceTableRowProps {
  device: IDevice;
  onEdit: (device: IDevice) => void;
  onDelete: (device: IDevice) => void;
}

export function DeviceTableRow({ device, onEdit, onDelete }: DeviceTableRowProps) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(device);
          }}
          sx={{ color: 'text.secondary' }}
        >
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(device);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
