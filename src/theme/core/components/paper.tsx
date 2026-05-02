import type { Theme, Components } from '@mui/material/styles';

// ----------------------------------------------------------------------

const MuiPaper: Components<Theme>['MuiPaper'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    elevation: 0,
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundImage: 'none',
      borderRadius: '16px',
      border: `1px solid ${theme.vars.palette.divider}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      [`[data-theme="dark"] &, .dark &`]: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
      },
      variants: [
        {
          props: (props) => props.variant === 'outlined',
          style: ({ theme }) => ({
            borderColor: theme.vars.palette.shared.paperOutlined,
          }),
        },
      ],
    }),
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const paper: Components<Theme> = {
  MuiPaper,
};
