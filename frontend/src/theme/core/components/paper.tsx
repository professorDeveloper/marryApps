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
      borderRadius: '8px',
      border: `1px solid ${theme.vars.palette.divider}`,
      boxShadow: theme.vars.customShadows.z1,
      backgroundColor: theme.vars.palette.background.paper,
      variants: [
        {
          props: (props) => props.variant === 'outlined',
          style: ({ theme: variantTheme }) => ({
            borderColor: variantTheme.vars.palette.shared.paperOutlined,
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
