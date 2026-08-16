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

// Shared styling for the `TextField select` filter controls rendered in a
// list view's toolbar `filterRow`. Full-width on the smallest screens so
// they stack cleanly instead of overflowing; fixed minWidth from `sm` up.
export const FILTER_SELECT_SX: SxProps = {
  minWidth: { xs: '100%', sm: 140 },
  flex: { xs: '1 1 100%', sm: '0 0 auto' },
  '& .MuiInputBase-root': { height: 36, fontSize: 13.5, backgroundColor: 'var(--bg2)', borderRadius: '6px', fontFamily: 'var(--font-sans)' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
  '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
  '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--brand)', boxShadow: '0 0 0 2px var(--accent-soft)' },
  '& .MuiInputLabel-root': { display: 'none' },
  '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
};
