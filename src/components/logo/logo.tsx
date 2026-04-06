import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useColorScheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
  isNavMini?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  isNavMini = false,
  ...other
}: LogoProps) {
  const { colorScheme } = useColorScheme();


  const isDarkMode = colorScheme === 'dark';

  const singleLogo = (
    <img
      alt="Single logo"
      src={isNavMini ? "/logo/header-mobil.svg" : (isDarkMode ? "/logo/new-logo-night.svg" : "/logo/new-logo-light.svg")}
      width="100%"
      height="100%"
    />
  );

  const fullLogo = (
    <img
      alt="Full logo"
      src={isNavMini ? "/logo/header-mobil.svg" : "/logo/header-logo2.svg"}
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
