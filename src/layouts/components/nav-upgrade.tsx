import type { BoxProps } from '@mui/material/Box';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { CONFIG } from 'src/global-config';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function NavUpgrade({ sx, ...other }: BoxProps) {
  const { user } = useMockedUser();

  return (
     <></>
  );
}

// ----------------------------------------------------------------------

export function UpgradeBlock({ sx, ...other }: BoxProps) {
  return (
    <></>
  );
}
