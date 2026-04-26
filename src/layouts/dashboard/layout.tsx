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

import { usePathname } from 'src/routes/hooks';

import { usePageNavigation } from 'src/hooks/use-page-navigation';
import { useGetWorkspacesBranches } from 'src/hooks/use-workspaces-branches';

import { _notifications } from 'src/_mock';

import { Logo } from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { NeuralGrid, StarPattern } from 'src/components/animate/background-patterns';

import { useAuthContext } from 'src/auth/hooks';

import { NavMobile } from './nav-mobile';
import { VerticalDivider } from './content';
import { NavVertical } from './nav-vertical';
import { NavHorizontal } from './nav-horizontal';
import { Searchbar } from '../components/searchbar';
import { getNavData } from '../nav-config-dashboard';
import { getAccountData } from '../nav-config-account';
import { MenuButton } from '../components/menu-button';
import { AccountDrawer } from '../components/account-drawer';
import { SettingsButton } from '../components/settings-button';
import { LanguagePopover } from '../components/language-popover';
import { WorkspacesPopover } from '../components/workspaces-popover';
import { dashboardLayoutVars, dashboardNavColorVars } from './css-vars';
import { NotificationsDrawer } from '../components/notifications-drawer';
import { MainSection, layoutClasses, HeaderSection, LayoutSection } from '../core';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

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
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
  pageTitle,
}: DashboardLayoutProps) {
  const theme = useTheme();
  const pathname = usePathname();

  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const { workspaces } = useGetWorkspacesBranches();

  const { t: tLayout } = useTranslation('layout');
  const { t: tMenu } = useTranslation('menu');

  const { pageTitle: dynamicPageTitle, breadcrumbs: dynamicBreadcrumbs } = usePageNavigation();

  const { navColor, navLayout } = settings.state;

  const navVars = useMemo(
    () => dashboardNavColorVars(theme, navColor, navLayout),
    [theme, navColor, navLayout]
  );

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const navData = useMemo(
    () => slotProps?.nav?.data ?? getNavData(tMenu),
    [slotProps?.nav?.data, tMenu]
  );

  const layoutCssVars = useMemo(
    () => ({ ...dashboardLayoutVars(theme), ...navVars.layout, ...cssVars }),
    [theme, navVars.layout, cssVars]
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
            height: { [layoutQuery]: 'var(--layout-nav-horizontal-height)' },
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
          cssVars={navVars.section}
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
            cssVars={navVars.section}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
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

          {/** @slot Account drawer */}
          <AccountDrawer data={getAccountData(tMenu)} />
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
      cssVars={navVars.section}
      checkPermissions={canDisplayItemByRole}
      onToggleNav={onToggleNav}
    />
  );

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        {
          position: 'relative',
          overflow: 'hidden',
          '& > .cyber-bg-layer': {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '& > *:not(.cyber-bg-layer)': { position: 'relative', zIndex: 1 },
        },
        ...(Array.isArray(slotProps?.main?.sx) ? slotProps.main.sx : [slotProps?.main?.sx]),
      ]}
    >
      <Box className="cyber-bg-layer">
        <NeuralGrid />
        <StarPattern />
      </Box>
      {children}
    </MainSection>
  );

  return (
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
      cssVars={layoutCssVars}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}
