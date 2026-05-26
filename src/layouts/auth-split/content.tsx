import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { layoutClasses } from '../core';

// ----------------------------------------------------------------------

export type AuthSplitContentProps = BoxProps & { layoutQuery?: Breakpoint };

export function AuthSplitContent({
  sx,
  children,
  className,
  layoutQuery = 'md',
  ...other
}: AuthSplitContentProps) {
  return (
    <Box
      className={className}
      sx={[
        (theme) => ({
          display: 'flex',
          flex: { xs: '1 1 auto', [layoutQuery]: '0 0 40%' },
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          p: theme.spacing(3, 2, 10, 2),
          width: { xs: '100%', [layoutQuery]: '40%' },
          minWidth: { xs: '100%', [layoutQuery]: '350px' },
          maxWidth: { xs: '100%', [layoutQuery]: '600px' },
          backgroundColor: 'var(--bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: { xs: 'none', [layoutQuery]: '1px solid var(--border)' },
          [theme.breakpoints.up(layoutQuery)]: {
            p: theme.spacing(4),
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}
