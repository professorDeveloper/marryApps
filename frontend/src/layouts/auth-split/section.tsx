import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export type AuthSplitSectionProps = BoxProps & {
  title?: string;
  method?: string;
  imgUrl?: string;
  subtitle?: string;
  layoutQuery?: Breakpoint;
  methods?: {
    path: string;
    icon: string;
    label: string;
  }[];
};

export function AuthSplitSection({
  sx,
  method,
  methods,
  layoutQuery = 'md',
  title = 'Ishni yanada samarali boshqarish',
  imgUrl = `${CONFIG.assetsDir}/assets/illustrations/illustration-dashboard.webp`,
  subtitle = 'Optimallashtirilgan iş oqimlari bilan.',
  ...other
}: AuthSplitSectionProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(0deg, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.92)}, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.92)})`,
              `url(${CONFIG.assetsDir}/assets/background/background-3-blur.webp)`,
            ],
          }),
          px: 3,
          pb: 3,
          width: 1,
          maxWidth: 480,
          display: 'none',
          position: 'relative',
          pt: 'var(--layout-header-desktop-height)',
          [theme.breakpoints.up(layoutQuery)]: {
            gap: 8,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <div />

   

    
    </Box>
  );
}
