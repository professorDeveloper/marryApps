import type { Theme, Components } from '@mui/material/styles';

// ----------------------------------------------------------------------

const MuiCard: Components<Theme>['MuiCard'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      position: 'relative',
      boxShadow: `var(--card-shadow, ${theme.vars.customShadows.card})`,
      borderRadius: '16px', // Match reference design
      zIndex: 0, // Fix Safari overflow: hidden with border radius
      backgroundImage: 'none',
      backgroundColor: theme.vars.palette.background.paper,
    }),
  },
};

const MuiCardHeader: Components<Theme>['MuiCardHeader'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    titleTypographyProps: { variant: 'h6' },
    subheaderTypographyProps: { variant: 'body2', marginTop: '4px' },
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3, 3, 0),
    }),
  },
};

const MuiCardContent: Components<Theme>['MuiCardContent'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
    }),
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const card: Components<Theme> = {
  MuiCard,
  MuiCardHeader,
  MuiCardContent,
};
