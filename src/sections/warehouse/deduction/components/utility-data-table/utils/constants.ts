import type { SxProps } from '@mui/material/styles';

// Application theme colors - matching new design system
export const SURFACE_BG = 'var(--color-surface-0)';
export const APP_BG = 'background.default';
export const BORDER = 'var(--color-border)';
export const ACCENT = 'primary.main'; // Primary orange from new design system

// Shared cell styling for DataTable columns
export const CELL_SX: SxProps = {
  display: 'flex',
  alignItems: 'center',
  py: 1.5,
  px: 1,
  color: 'var(--color-text-primary)',
  fontSize: '1.1rem',
  fontWeight: 400,
  fontFamily: 'var(--font-sans)',
  backgroundColor: 'transparent',
};
