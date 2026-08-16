import type { Theme, Components } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

const MuiDrawer: Components<Theme>['MuiDrawer'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    paper: {
      variants: [
        {
          props: (props) => props.variant === 'temporary' && props.anchor === 'left',
          style: ({ theme }) => ({
            ...theme.mixins.paperStyles(theme),
            backgroundColor: 'var(--sidebar-bg)',
            boxShadow: `4px 0 16px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
            ...theme.applyStyles('dark', {
              boxShadow: 'none',
            }),
          }),
        },
        {
          props: (props) => props.variant === 'temporary' && props.anchor === 'right',
          style: ({ theme }) => ({
            ...theme.mixins.paperStyles(theme),
            boxShadow: `-4px 0 16px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
            ...theme.applyStyles('dark', {
              boxShadow: 'none',
            }),
          }),
        },
      ],
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const drawer: Components<Theme> = {
  MuiDrawer,
};
