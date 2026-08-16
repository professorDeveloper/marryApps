import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'minimal-shared/hooks';
import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

import { useAuthContext } from 'src/auth/hooks';

import { layoutClasses } from '../core';
import { AnimatedToggleButton } from './togllebtn';
import { SignOutButton } from '../components/sign-out-button';
// ----------------------------------------------------------------------

export type NavVerticalProps = React.ComponentProps<'div'> &
  NavSectionProps & {
    isNavMini: boolean;
    layoutQuery?: Breakpoint;
    onToggleNav: () => void;
    slots?: {
      topArea?: React.ReactNode;
      bottomArea?: React.ReactNode;
    };
  };

const transitionProps: string[] = ['opacity', 'visibility'];

const visibleStyles = {
  opacity: 1,
  visibility: 'visible',
} as const;

const hiddenAnimatedStyles = {
  opacity: 0,
  visibility: 'hidden',
  position: 'absolute',
  pointerEvents: 'none',
} as const;

function UserAvatar({ src, name }: { src: string; name: string }) {
  return (
    <Avatar
      src={src}
      alt={name}
      sx={{
        width: 36,
        height: 36,
        bgcolor: 'var(--accent)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      {!src && name.charAt(0).toUpperCase()}
    </Avatar>
  );
}

export const NavVertical = memo(function NavVertical({
  sx,
  data,
  slots,
  cssVars,
  className,
  isNavMini,
  onToggleNav,
  checkPermissions,
  layoutQuery = 'md',
  ...other
}: NavVerticalProps) {
  const { t } = useTranslation('layout');
  const { user } = useAuthContext();
  const { value: drawerOpen, onTrue: openDrawer, onFalse: closeDrawer } = useBoolean();

  const profileName =
    user?.full_name || user?.fullName || user?.displayName || user?.username || 'User';
  const userRole = user?.role || '';
  const avatarSrc = user?.photoURL || '';

  return (
    <NavRoot
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      className={mergeClasses([
        layoutClasses.nav.root,
        layoutClasses.nav.vertical,
        className,
      ])}
      sx={sx}
      {...other}
    >
      {/* Close button for full mode */}
      {!isNavMini && (
        <IconButton
          aria-label={t('a11y.closeNavigation')}
          onClick={onToggleNav}
          sx={{
            position: 'absolute',
            top: 30,
            right: -12,
            p: 0.5,
            color: 'primary.main',
            zIndex: 1200,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            '&:hover': {
              color: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <FirstPageIcon />
        </IconButton>
      )}

      {/* Full sidebar */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          overflow: 'hidden',
          ...(isNavMini ? hiddenAnimatedStyles : visibleStyles),
          transition: theme.transitions.create(transitionProps, {
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            duration: '400ms',
          }),
        })}
      >
        {slots?.topArea ?? (
          <Box sx={{ pl: 2, pt: 2.5, pb: 1 }}>
            <Logo size={48}/>
          </Box>
        )}

        <Scrollbar fillContent>
          <NavSectionVertical
            data={data.map((group) => ({
              ...group,
              items: group.items.map(({ children: _c, ...item }) => item),
            }))}
            cssVars={cssVars}
            checkPermissions={checkPermissions}
            sx={{ px: 1, flex: '1 1 auto' }}
          />
        </Scrollbar>

        {/* User profile at bottom - full mode */}
        <Box sx={{ borderTop: '1px solid var(--border)', p: 1.5 }}>
          <ButtonBase
            onClick={openDrawer}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 1.5,
              textAlign: 'left',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <UserAvatar src={avatarSrc} name={profileName} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontSize: '13px', color: 'var(--accent)' }}>
                {profileName}
              </Typography>
              <Typography variant="caption" noWrap sx={{ fontSize: '11px', color: 'var(--text)' }}>
                {userRole}
              </Typography>
            </Box>
          </ButtonBase>
        </Box>
      </Box>

      {/* Mini sidebar */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          overflow: 'hidden',
          ...(isNavMini ? visibleStyles : hiddenAnimatedStyles),
          transition: theme.transitions.create(transitionProps, {
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            duration: '400ms',
          }),
        })}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, pb: 2 }}>
          <AnimatedToggleButton onToggle={onToggleNav} />
        </Box>

        <NavSectionMini
          data={data}
          cssVars={cssVars}
          checkPermissions={checkPermissions}
          sx={[
            (theme) => ({
              ...theme.mixins.hideScrollY,
              pb: 2,
              px: 0.5,
              flex: '1 1 auto',
              overflowY: 'auto',
            }),
          ]}
        />

        {/* User profile at bottom - mini mode */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pb: 2,
            pt: 1,
            borderTop: '1px solid var(--border)',
          }}
        >
          <IconButton aria-label={t('a11y.openProfile')} onClick={openDrawer} sx={{ p: 0.5 }}>
            <UserAvatar src={avatarSrc} name={profileName} />
          </IconButton>
        </Box>
      </Box>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: {
            sx: {
              width: 320,
              backgroundColor: 'var(--bg)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <IconButton
          aria-label={t('a11y.closeMenu')}
          onClick={closeDrawer}
          sx={{ position: 'absolute', top: 12, left: 12, zIndex: 9 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Box
          sx={{
            pt: 8,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Avatar
            src={avatarSrc}
            alt={profileName}
            sx={{ width: 80, height: 80, bgcolor: 'var(--accent)', fontSize: 28, fontWeight: 700 }}
          >
            {!avatarSrc && profileName.charAt(0).toUpperCase()}
          </Avatar>

          <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
            {profileName}
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
            {userRole}
          </Typography>
        </Box>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={closeDrawer} />
        </Box>
      </Drawer>
    </NavRoot>
  );
});

// ----------------------------------------------------------------------

const NavRoot = styled('div', {
  shouldForwardProp: (prop: string) => !['isNavMini', 'layoutQuery', 'sx'].includes(prop),
})<Pick<NavVerticalProps, 'isNavMini' | 'layoutQuery'>>(
  ({ isNavMini, layoutQuery = 'md', theme }) => ({
    top: 0,
    left: 0,
    height: '100%',
    display: 'none',
    position: 'fixed',
    flexDirection: 'column',
    zIndex: theme.zIndex.drawer + 1,
    overflow: 'visible',
    willChange: 'width',
    backgroundColor: 'var(--bg3)',
    borderRight: '1px solid var(--border)',
    width: isNavMini ? '64px' : '220px',
    minWidth: isNavMini ? '64px' : '220px',
    transition: theme.transitions.create(['width'], {
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      duration: '400ms',
    }),
    [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
  })
);
