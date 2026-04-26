import type { SxProps } from '@mui/material/styles';

// Application theme colors - matching theme-config.ts
export const SURFACE_BG = 'rgba(24, 23, 22, 0.95)';
export const APP_BG = 'background.default';
export const BORDER = 'divider';
export const ACCENT = 'warning.main'; // Using warning.main which matches the orange accent color #FFAB00

// Shared cell styling for DataTable columns
export const CELL_SX: SxProps = {
  display: 'flex',
  alignItems: 'center',
  py: 1.5,
  px: 1,
  color: 'text.primary',
  fontSize: '0.875rem',
  fontWeight: 400,
  fontFamily: 'var(--font-mono)',
  backgroundColor: 'transparent',
};
