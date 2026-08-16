import type { CSSObject } from '@mui/material/styles';
import type { NavItemProps } from '../types';

import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from '../../iconify';
import { navItemStyles } from '../styles';

// ----------------------------------------------------------------------

export type StyledState = Pick<NavItemProps, 'open' | 'active' | 'disabled'> & {
  variant: 'rootItem' | 'subItem';
};

const shouldForwardProp = (prop: string) =>
  !['open', 'active', 'variant', 'sx'].includes(prop);

/**
 * @slot root
 */
export const ItemRoot = styled(ButtonBase, { shouldForwardProp })<StyledState>(({
  active,
  open,
  variant,
  theme,
}) => {
  const bulletSvg = `"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 14 14'%3E%3Cpath d='M1 1v4a8 8 0 0 0 8 8h4' stroke='%23efefef' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"`;

  const bulletStyles: CSSObject = {
    left: 0,
    content: '""',
    position: 'absolute',
    width: 'var(--nav-bullet-size)',
    height: 'var(--nav-bullet-size)',
    backgroundColor: 'var(--nav-bullet-light-color)',
    mask: `url(${bulletSvg}) no-repeat 50% 50%/100% auto`,
    WebkitMask: `url(${bulletSvg}) no-repeat 50% 50%/100% auto`,
    transform:
      theme.direction === 'rtl'
        ? 'translate(calc(var(--nav-bullet-size) * 1), calc(var(--nav-bullet-size) * -0.4)) scaleX(-1)'
        : 'translate(calc(var(--nav-bullet-size) * -1), calc(var(--nav-bullet-size) * -0.4))',
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--nav-bullet-dark-color)',
    }),
  };

  return {
    width: '100%',
    paddingTop: 'var(--nav-item-pt)',
    paddingLeft: 'var(--nav-item-pl)',
    paddingRight: 'var(--nav-item-pr)',
    paddingBottom: 'var(--nav-item-pb)',
    borderRadius: 'var(--nav-item-radius)',
    color: 'var(--text)',
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
    '&:hover': { backgroundColor: 'var(--hover)' },
    '&:active': { transform: 'scale(0.97)' },
    ...(variant === 'rootItem' && {
      minHeight: 'var(--nav-item-root-height)',
      ...(open && !active && {
        color: 'var(--text)',
        backgroundColor: 'var(--hover)',
      }),
      ...(active && {
        color: 'var(--accent)',
        backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
        borderLeft: '3px solid var(--accent)',
        paddingLeft: 'calc(var(--nav-item-pl) - 3px)',
        '&:hover': {
          backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
        },
      }),
    }),
    ...(variant === 'subItem' && {
      minHeight: 'var(--nav-item-sub-height)',
      '&::before': bulletStyles,
      ...(open && !active && {
        color: 'var(--text)',
      }),
      ...(active && {
        color: 'var(--accent)',
        backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
        fontWeight: 600,
      }),
    }),
    ...(navItemStyles.disabled && { '&.Mui-disabled': navItemStyles.disabled }),
  };
});

/**
 * @slot icon
 */
export const ItemIcon = styled('span', { shouldForwardProp })<StyledState>(() => ({
  ...navItemStyles.icon,
  width: 'var(--nav-icon-size)',
  height: 'var(--nav-icon-size)',
  margin: 'var(--nav-icon-margin)',
}));

/**
 * @slot title
 */
export const ItemTitle = styled('span', { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.title(theme),
  ...theme.typography.body2,
  fontWeight: theme.typography.fontWeightMedium,
  variants: [
    { props: { active: true }, style: { fontWeight: theme.typography.fontWeightBold } },
  ],
}));

/**
 * @slot info
 */
export const ItemInfo = styled('span', { shouldForwardProp })<StyledState>(() => ({
  ...navItemStyles.info,
}));

/**
 * @slot arrow
 */
export const ItemArrow = styled(Iconify, { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.arrow(theme),
}));
