import type { DataTableColumn } from '../types/types';

import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';


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
          backgroundColor: 'var(--bg3)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow)',
        },
      }}
    >
      <Typography
        sx={{
          px: 1.5,
          py: 1,
          fontSize: 12,
          color: 'var(--text2)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Columns
      </Typography>
      <Divider sx={{ borderColor: 'var(--border)' }} />
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
            sx={{
              fontSize: 13,
              '&:hover': {
                backgroundColor: 'var(--brand-dim)',
                boxShadow: 'var(--shadow)',
              },
            }}
          >
            <Checkbox
              size="small"
              checked={checked}
              sx={{
                mr: 1,
                color: 'var(--text2)',
                '&.Mui-checked': { color: 'var(--brand)' },
              }}
            />
            {c.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
