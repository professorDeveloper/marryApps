import type { CSSObject } from '@mui/material/styles';
import type { NavItemProps } from '../types';

import { mergeClasses } from 'minimal-shared/utils';

import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from '../../iconify';
import { createNavItem } from '../utils';
import { navItemStyles, navSectionClasses } from '../styles';

// ----------------------------------------------------------------------

export function NavItem({
  path,
  icon,
  info,
  title,
  caption,
  /********/
  open,
  active,
  disabled,
  /********/
  depth,
  render,
  hasChild,
  slotProps,
  className,
  externalLink,
  enabledRootRedirect,
  ...other
}: NavItemProps) {
  const navItem = createNavItem({
    path,
    icon,
    info,
    depth,
    render,
    hasChild,
    externalLink,
    enabledRootRedirect,
  });

  const ownerState: StyledState = {
    open,
    active,
    disabled,
    variant: navItem.rootItem ? 'rootItem' : 'subItem',
  };

  return (
    <ItemRoot
      aria-label={title}
      {...ownerState}
      {...navItem.baseProps}
      className={mergeClasses([navSectionClasses.item.root, className], {
        [navSectionClasses.state.open]: open,
        [navSectionClasses.state.active]: active,
        [navSectionClasses.state.disabled]: disabled,
      })}
      sx={slotProps?.sx}
      {...other}
    >
      {icon && (
        <ItemIcon {...ownerState} className={navSectionClasses.item.icon} sx={slotProps?.icon}>
          {navItem.renderIcon}
        </ItemIcon>
      )}

      {title && ownerState.variant !== 'rootItem' && (
        <ItemTitle {...ownerState} className={navSectionClasses.item.title} sx={slotProps?.title}>
          {title}
        </ItemTitle>
      )}

      {caption && (
        <Tooltip title={caption} arrow placement="right">
          <ItemCaptionIcon
            {...ownerState}
            icon="eva:info-outline"
            className={navSectionClasses.item.caption}
            sx={slotProps?.caption}
          />
        </Tooltip>
      )}

      {info && navItem.subItem && (
        <ItemInfo {...ownerState} className={navSectionClasses.item.info} sx={slotProps?.info}>
          {navItem.renderInfo}
        </ItemInfo>
      )}

    </ItemRoot>
  );
}

// ----------------------------------------------------------------------

type StyledState = Pick<NavItemProps, 'open' | 'active' | 'disabled'> & {
  variant: 'rootItem' | 'subItem';
};

const shouldForwardProp = (prop: string) =>
  !['open', 'active', 'disabled', 'variant', 'sx'].includes(prop);

/**
 * @slot root
 */
const ItemRoot = styled(ButtonBase, { shouldForwardProp })<StyledState>(({
  active,
  open,
  theme,
}) => {
  const rootItemStyles: CSSObject = {
    textAlign: 'center',
    flexDirection: 'column',
    minHeight: 'var(--nav-item-root-height)',
    padding: 'var(--nav-item-root-padding)',
    ...(open && {
      color: 'var(--nav-item-root-open-color)',
      backgroundColor: 'var(--nav-item-root-open-bg)',
    }),
    ...(active && {
      color: 'var(--accent)',
      backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
      borderLeft: '3px solid var(--accent)',
      '&:hover': {
        backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
      },
    }),
  };

  const subItemStyles: CSSObject = {
    minHeight: 'var(--nav-item-sub-height)',
    padding: 'var(--nav-item-sub-padding)',
    color: theme.vars.palette.text.secondary,
    ...(open && {
      color: 'var(--nav-item-sub-open-color)',
      backgroundColor: 'var(--nav-item-sub-open-bg)',
    }),
    ...(active && {
      color: 'var(--nav-item-sub-active-color)',
      backgroundColor: 'var(--nav-item-sub-active-bg)',
    }),
  };

  return {
    width: '100%',
    color: 'var(--nav-item-color)',
    borderRadius: 'var(--nav-item-radius)',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.15s ease',
    '&:hover': { backgroundColor: 'var(--nav-item-hover-bg)' },
    '&:active': { transform: 'scale(0.95)' },
    variants: [
      { props: { variant: 'rootItem' }, style: rootItemStyles },
      { props: { variant: 'subItem' }, style: subItemStyles },
      { props: { disabled: true }, style: navItemStyles.disabled },
    ],
  };
});

/**
 * @slot icon
 */
const ItemIcon = styled('span', { shouldForwardProp })<StyledState>(() => ({
  ...navItemStyles.icon,
  width: 'var(--nav-icon-size)',
  height: 'var(--nav-icon-size)',
  margin: 'var(--nav-icon-root-margin)',
  variants: [{ props: { variant: 'subItem' }, style: { margin: 'var(--nav-icon-sub-margin)' } }],
}));

/**
 * @slot title
 */
const ItemTitle = styled('span', { shouldForwardProp })<StyledState>(({ active, theme }) => ({
  ...navItemStyles.title(theme),
  lineHeight: '16px',
  fontSize: theme.typography.pxToRem(10),
  fontWeight: theme.typography.fontWeightSemiBold,
  variants: [
    {
      props: { variant: 'rootItem' },
      style: { ...(active && { fontWeight: theme.typography.fontWeightBold }) },
    },
    {
      props: { variant: 'subItem' },
      style: {
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeightMedium,
        ...(active && { fontWeight: theme.typography.fontWeightSemiBold }),
      },
    },
  ],
}));

/**
 * @slot caption icon
 */
const ItemCaptionIcon = styled(Iconify, { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.captionIcon,
  color: 'var(--nav-item-caption-color)',
  variants: [{ props: { variant: 'rootItem' }, style: { top: 11, left: 6, position: 'absolute' } }],
}));

/**
 * @slot info
 */
const ItemInfo = styled('span', { shouldForwardProp })<StyledState>(({ theme }) => ({
  ...navItemStyles.info,
}));

