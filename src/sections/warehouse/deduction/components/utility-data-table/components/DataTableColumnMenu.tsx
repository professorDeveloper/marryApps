import type { DataTableColumn } from '../types/types';

import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { ACCENT, BORDER, SURFACE_BG } from '../utils';

export type DataTableColumnMenuProps<T> = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  columns: Array<DataTableColumn<T>>;
  visibility: Record<string, boolean>;
  onToggleVisibility: (key: string) => void;
};

export function DataTableColumnMenu<T>({
  anchorEl,
  onClose,
  columns,
  visibility,
  onToggleVisibility,
}: DataTableColumnMenuProps<T>) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 260,
          backgroundColor: SURFACE_BG,
          border: `1px solid ${BORDER}`,
          backdropFilter: 'blur(12px)',
        },
      }}
    >
      <Typography
        sx={{
          px: 1.5,
          py: 1,
          fontSize: 12,
          color: 'rgba(255,255,255,0.65)',
          fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        }}
      >
        Columns
      </Typography>
      <Divider sx={{ borderColor: BORDER }} />
      {columns.map((c) => {
        const toggleable = c.toggleable !== false;
        const checked = visibility[c.key] !== false;
        return (
          <MenuItem
            key={c.key}
            disabled={!toggleable}
            onClick={() => {
              if (toggleable) onToggleVisibility(c.key);
            }}
            sx={{ fontSize: 13 }}
          >
            <Checkbox
              size="small"
              checked={checked}
              sx={{
                mr: 1,
                color: 'rgba(255,255,255,0.35)',
                '&.Mui-checked': { color: ACCENT },
              }}
            />
            {c.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
