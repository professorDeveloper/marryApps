import type { NavGroupProps, NavSectionProps } from '../types';

import { memo } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { mergeClasses } from 'minimal-shared/utils';
import { isActiveLink } from 'minimal-shared/utils';

import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';

import { NavList } from './nav-list';
import { Nav, NavUl, NavLi, NavSubheader } from '../components';
import { navSectionClasses, navSectionCssVars } from '../styles';

// ----------------------------------------------------------------------

export const NavSectionVertical = memo(function NavSectionVertical({
  sx,
  data,
  render,
  className,
  slotProps,
  checkPermissions,
  enabledRootRedirect,
  cssVars: overridesVars,
  ...other
}: NavSectionProps) {
  const theme = useTheme();

  const cssVars = { ...navSectionCssVars.vertical(theme), ...overridesVars };

  return (
    <Nav
      className={mergeClasses([navSectionClasses.vertical, className])}
      sx={[{ ...cssVars }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <NavUl sx={{ flex: '1 1 auto', gap: 'var(--nav-item-gap)' }}>
        {data.map((group) => (
          <Group
            key={group.subheader ?? group.items[0].title}
            subheader={group.subheader}
            items={group.items}
            render={render}
            slotProps={slotProps}
            checkPermissions={checkPermissions}
            enabledRootRedirect={enabledRootRedirect}
          />
        ))}
      </NavUl>
    </Nav>
  );
});

// ----------------------------------------------------------------------

const Group = memo(function Group({
  items,
  render,
  subheader,
  slotProps,
  checkPermissions,
  enabledRootRedirect,
}: NavGroupProps) {
  const pathname = usePathname();
  const groupOpen = useBoolean(true);

  // Check if any child item in this group is active
  const isChildActive = items.some((item) => {
    const itemMatch = isActiveLink(pathname, item.path, item.deepMatch ?? false);
    const childMatch = item.children?.some((child) => isActiveLink(pathname, child.path, true)) ?? false;
    return itemMatch || childMatch;
  });

  const renderContent = () => (
    <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
      {items.map((list) => (
        <NavList
          key={list.title}
          data={list}
          render={render}
          depth={1}
          slotProps={slotProps}
          checkPermissions={checkPermissions}
          enabledRootRedirect={enabledRootRedirect}
        />
      ))}
    </NavUl>
  );

  return (
    <NavLi>
      {subheader ? (
        <>
          <NavSubheader
            data-title={subheader}
            open={groupOpen.value}
            active={isChildActive}
            onClick={groupOpen.onToggle}
            sx={slotProps?.subheader}
          >
            {subheader}
          </NavSubheader>

          <Collapse
            in={groupOpen.value}
            timeout={{ enter: 250, exit: 200 }}
            easing={{ enter: 'cubic-bezier(0.4, 0, 0.2, 1)', exit: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {renderContent()}
          </Collapse>
        </>
      ) : (
        renderContent()
      )}
    </NavLi>
  );
});
