import type { LinkProps } from '@mui/material/Link';

import { useId } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme, useColorScheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();

  const uniqueId = useId();

  const TEXT_PRIMARY = theme.vars.palette.text.primary;
  const PRIMARY_LIGHT = theme.vars.palette.primary.light;
  const PRIMARY_MAIN = theme.vars.palette.primary.main;
  const PRIMARY_DARKER = theme.vars.palette.primary.dark;

  const isDarkMode = colorScheme === 'dark';

  const singleLogo = (
    <img
      alt="Single logo"
      src={isDarkMode ? "/logo/header-logo-light.svg" : "/logo/header-logo-night.svg"}
      width="100%"
      height="100%"
    />
  );

  const fullLogo = (
    <img
      alt="Full logo"
      src="/logo/header-logo2.svg"
      width="100%"
      height="100%"
    />
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logotip"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 140,
          height: 50,
          ...(!isSingle && { width: 180, height: 64 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
