import type { SxProps, Theme } from '@mui/material/styles';

export const CYBER_TABLE_SX: SxProps<Theme> = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-md)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary-soft) 1px, transparent 0)',
    backgroundSize: '24px 24px',
    pointerEvents: 'none',
    borderRadius: 'var(--radius-md)',
  },
  '& .MuiTableCell-head': {
    color: 'primary.main',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: 800,
    fontSize: '0.7rem',
    borderBottom: '2px solid var(--color-border-strong)',
    py: 2.5,
  },
  '& .MuiTableRow-root': {
    '&:hover': {
      backgroundColor: 'var(--color-primary-soft)',
    },
    transition: '0.2s',
  },
  '& .MuiTableCell-root': {
    fontFamily: 'var(--font-mono)',
    borderBottom: '1px solid var(--color-border)',
  },
  '& .MuiTableFooter-root': {
    backgroundColor: 'var(--color-primary-soft)',
    borderTop: '1px solid var(--color-border-strong)',
  },
  '& .MuiTablePagination-root': {
    borderTop: '1px solid var(--color-border-strong)',
  },
  '& .MuiTablePagination-select, & .MuiTablePagination-selectIcon': {
    color: 'text.primary',
  },
  '& .MuiTablePagination-actions button': {
    color: 'text.primary',
    '&:hover': {
      backgroundColor: 'var(--color-primary-soft)',
    },
  },
  '& .MuiTablePagination-displayedRows': {
    color: 'text.primary',
    fontSize: '0.875rem',
  },
} as const;
