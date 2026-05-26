import type { Theme, Components } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import { tableRowClasses } from '@mui/material/TableRow';
import { tableCellClasses } from '@mui/material/TableCell';

// ----------------------------------------------------------------------

const MuiTableContainer: Components<Theme>['MuiTableContainer'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.mixins.scrollbarStyles(theme),
      position: 'relative',
    }),
  },
};

const MuiTableRow: Components<Theme>['MuiTableRow'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${tableRowClasses.selected}`]: {
        backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.04),
        '&:hover': {
          backgroundColor: varAlpha(theme.vars.palette.primary.darkChannel, 0.08),
        },
      },
      '&:last-of-type': {
        [`& .${tableCellClasses.root}`]: {
          border: 0,
        },
      },
    }),
  },
};

const MuiTableCell: Components<Theme>['MuiTableCell'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: {
      borderBottomStyle: 'solid',
      height: 52,
      padding: '0 16px',
      fontSize: '13.5px',
      fontWeight: 500,
    },
    head: ({ theme }) => ({
      fontSize: theme.typography.pxToRem(11),
      color: theme.vars.palette.text.disabled,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      backgroundColor: theme.vars.palette.background.paper,
      height: 42,
      padding: '0 16px',
    }),
    stickyHeader: ({ theme }) => ({
      backgroundColor: theme.vars.palette.background.paper,
      backgroundImage: `linear-gradient(to bottom, ${theme.vars.palette.background.neutral}, ${theme.vars.palette.background.neutral})`,
    }),
    paddingCheckbox: ({ theme }) => ({
      paddingLeft: theme.spacing(1),
    }),
  },
};

const MuiTablePagination: Components<Theme>['MuiTablePagination'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    backIconButtonProps: { size: 'small' },
    nextIconButtonProps: { size: 'small' },
    slotProps: { select: { name: 'table-pagination-select' } },
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: { width: '100%' },
    toolbar: { height: 64 },
    actions: { marginRight: 8 },
    select: {
      display: 'flex',
      alignItems: 'center',
    },
    selectIcon: {
      right: 4,
      width: 16,
      height: 16,
      top: 'calc(50% - 8px)',
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const table: Components<Theme> = {
  MuiTableRow,
  MuiTableCell,
  MuiTableContainer,
  MuiTablePagination,
};
