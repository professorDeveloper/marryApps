import type { SxProps, Theme } from '@mui/material/styles';

export const CYBER_TABLE_SX: SxProps<Theme> = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-md)',
  position: 'relative',
  backgroundColor: 'transparent',
  '& .MuiTableCell-head': {
    color: 'var(--color-text-secondary)',
    backgroundColor: 'var(--color-surface-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: 700,
    fontSize: '0.7rem',
    borderBottom: '1px solid var(--color-border)',
    padding: '8px 14px',
  },
  '& .MuiTableRow-root': {
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: 'var(--color-surface-secondary)',
    },
  },
  '& .MuiTableCell-root': {
    fontFamily: 'var(--font-sans)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: '0.875rem',
    padding: '10px 14px',
  },
  '& .MuiTableFooter-root': {
    backgroundColor: 'transparent',
    borderTop: '1px solid var(--color-border)',
  },
  '& .MuiTablePagination-root': {
    borderTop: '1px solid var(--color-border)',
  },
  '& .MuiTablePagination-select, & .MuiTablePagination-selectIcon': {
    color: 'text.primary',
  },
  '& .MuiTablePagination-actions button': {
    color: 'text.primary',
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: 'var(--color-surface-secondary)',
    },
  },
  '& .MuiTablePagination-displayedRows': {
    color: 'text.primary',
    fontSize: '0.875rem',
  },
} as const;
