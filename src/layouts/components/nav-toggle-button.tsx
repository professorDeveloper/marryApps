import type { IconButtonProps } from '@mui/material/IconButton';

import { varAlpha } from 'minimal-shared/utils';

import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NavToggleButtonProps = IconButtonProps & {
  isNavMini: boolean;
};

export function NavToggleButton({ isNavMini, sx, ...other }: NavToggleButtonProps) {
  return (
    <IconButton
      size="small"
      sx={[
        (theme) => ({
          p: 0.5,
          color: 'action.active',
          bgcolor: 'background.default',
          border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
          // transition: theme.transitions.create(['opacity', 'transform'], {
          //   easing: 'var(--layout-transition-easing)',
          //   duration: 'var(--layout-transition-duration)',
          // }),
          '&:hover': {
            color: 'text.primary',
            bgcolor: 'background.neutral',
          },
        }),
        // ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify
        width={16}
        icon={isNavMini ? 'solar:list-bold' : 'solar:close-circle-bold'}
        sx={(theme) => ({
          // ...(theme.direction === 'rtl' && { transform: 'scaleX(-1)' }),
        })}
      />
    </IconButton>
  );
}
