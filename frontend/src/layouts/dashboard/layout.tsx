import type { Breakpoint } from '@mui/material/styles';
import type { NavItemProps, NavSectionProps } from 'src/components/nav-section';
import type { MainSectionProps, HeaderSectionProps, LayoutSectionProps } from '../core';

import { merge } from 'es-toolkit';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { iconButtonClasses } from '@mui/material/IconButton';

import { usePageNavigation } from 'src/hooks/use-page-navigation';
import { useGetWorkspacesBranches } from 'src/hooks/use-workspaces-branches';

import { _notifications } from 'src/_mock';

import { Logo } from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DataTableActionsProvider } from 'src/sections/common/data-table/context/DataTableActionsContext';

import { useAuthContext } from 'src/auth/hooks';

import { NavMobile } from './nav-mobile';
import { VerticalDivider } from './content';
import { NavVertical } from './nav-vertical';
import { NavHorizontal } from './nav-horizontal';
import { SectionTabsBar } from './section-tabs-bar';
import { Searchbar } from '../components/searchbar';
import { getNavData } from '../nav-config-dashboard';
import { MenuButton } from '../components/menu-button';
import { SettingsButton } from '../components/settings-button';
import { LanguagePopover } from '../components/language-popover';
import { MainSection, HeaderSection, LayoutSection } from '../core';
import { WorkspacesPopover } from '../components/workspaces-popover';
import { NotificationsDrawer } from '../components/notifications-drawer';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  pageTitle?: string;
  slotProps?: {
    header?: HeaderSectionProps;
    nav?: {
      data?: NavSectionProps['data'];
    };
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();

  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const { workspaces } = useGetWorkspacesBranches();

  const { t: tLayout } = useTranslation('layout');
  const { t: tMenu } = useTranslation('menu');

  const { pageTitle: dynamicPageTitle, breadcrumbs: dynamicBreadcrumbs } = usePageNavigation();

  const { navLayout } = settings.state;

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const navData = useMemo(
    () => slotProps?.nav?.data ?? getNavData(tMenu),
    [slotProps?.nav?.data, tMenu]
  );

  const isNavMini = navLayout === 'mini';
  const isNavHorizontal = navLayout === 'horizontal';
  const isNavVertical = isNavMini || navLayout === 'vertical';

  const { setField } = settings;
  const navLayoutRef = useRef(navLayout);
  navLayoutRef.current = navLayout;

  // Ctrl + B shortcut uchun listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setField(
          'navLayout',
          navLayoutRef.current === 'vertical' ? 'mini' : 'vertical'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setField]);

  const userRole = user?.role;
  const canDisplayItemByRole = useCallback(
    (allowedRoles: NavItemProps['allowedRoles']): boolean => !allowedRoles?.includes(userRole),
    [userRole]
  );

  const isSuperadmin = String(user?.role || '').toLowerCase() === 'superadmin';

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
        sx: {
          ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
          ...(isNavHorizontal && {
            bgcolor: 'var(--layout-nav-bg)',
            height: { [layoutQuery]: '64px' },
            [`& .${iconButtonClasses.root}`]: { color: 'var(--layout-nav-text-secondary-color)' },
          }),
        },
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          {tLayout('infoAlert')}
        </Alert>
      ),
      bottomArea: isNavHorizontal ? (
        <NavHorizontal
          data={navData}
          layoutQuery={layoutQuery}
          checkPermissions={canDisplayItemByRole}
        />
      ) : null,
      leftArea: (
        <>
          {/* Breadcrumbs */}
          <CustomBreadcrumbs
            heading={dynamicPageTitle}
            links={dynamicBreadcrumbs}
            sideLayout
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              '& .MuiBreadcrumbs-separator': { mx: 0.5 },
              '& .MuiBreadcrumbs-li': { fontSize: '0.875rem' }
            }}
          />
          
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile
            data={navData}
            open={open}
            onClose={onClose}
            checkPermissions={canDisplayItemByRole}
          />

          {/** @slot Logo */}
          {isNavHorizontal && (
            <Logo />
          )}

          {/** @slot Divider */}
          {isNavHorizontal && (
            <VerticalDivider sx={{ [theme.breakpoints.up(layoutQuery)]: { display: 'flex' } }} />
          )}
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 0.75 } }}>
          {/** @slot Searchbar */}
           {/* @slot Workspace popover */}
            <WorkspacesPopover
              data={workspaces}
              sx={{ ...(isNavHorizontal && { color: 'var(--layout-nav-text-primary-color)' }) }}
              disabled={!isSuperadmin}
            />
          <Searchbar data={navData} />

          {/** @slot Language popover */}
          <LanguagePopover
            data={[
              { value: 'en', label: tLayout('languages.en'), countryCode: 'GB' },
              { value: 'uz-Latn', label: tLayout('languages.uz-Latn'), countryCode: 'UZ' },
              { value: 'uz-Cyrl', label: tLayout('languages.uz-Cyrl'), countryCode: 'UZ' },
              { value: 'ru', label: tLayout('languages.ru'), countryCode: 'RU' },
            ]}
          />

          {/** @slot Notifications popover */}
          <NotificationsDrawer data={_notifications} />

          {/** @slot Contacts popover */}
          {/* <ContactsPopover data={_contacts} /> */}

          {/** @slot Settings button */}
          <SettingsButton />
        </Box>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableElevation={isNavVertical}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const onToggleNav = useCallback(() => {
    setField('navLayout', navLayoutRef.current === 'vertical' ? 'mini' : 'vertical');
  }, [setField]);

  const renderSidebar = () => (
    <NavVertical
      data={navData}
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      checkPermissions={canDisplayItemByRole}
      onToggleNav={onToggleNav}
    />
  );

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        { px: 2, overflow: 'hidden' },
        ...(Array.isArray(slotProps?.main?.sx) ? slotProps.main.sx : [slotProps?.main?.sx]),
      ]}
    >
      {children}
    </MainSection>
  );

  return (
    <DataTableActionsProvider>
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Sidebar
       *************************************** */
      sidebarSection={isNavHorizontal ? null : renderSidebar()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      sx={[
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      mini={isNavMini}
    >
      <SectionTabsBar data={navData} checkPermissions={canDisplayItemByRole} />
      {renderMain()}
    </LayoutSection>
    </DataTableActionsProvider>
  );
}
