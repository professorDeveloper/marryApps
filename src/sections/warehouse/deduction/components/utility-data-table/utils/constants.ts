import type { SxProps } from '@mui/material/styles';

// Application theme colors - matching new design system
export const SURFACE_BG = 'var(--bg2)';
export const APP_BG = 'var(--bg)';
export const BORDER = 'var(--border)';
export const ACCENT = 'var(--brand)';

// Shared cell styling for DataTable columns
export const CELL_SX: SxProps = {
  display: 'flex',
  alignItems: 'center',
  py: 1,
  px: 1,
  color: 'var(--text)',
  fontSize: '13px',
  fontWeight: 400,
  fontFamily: 'var(--font-sans)',
  backgroundColor: 'transparent',
};
