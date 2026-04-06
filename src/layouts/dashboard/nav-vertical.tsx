import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import { memo } from 'react';
import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

import { layoutClasses } from '../core';
import { AnimatedToggleButton } from './togllebtn';
import { NavUpgrade } from '../components/nav-upgrade';
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
  console.log('NavVertical render, isNavMini:', isNavMini);
  
  return (
    <NavRoot
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      className={mergeClasses([layoutClasses.nav.root, layoutClasses.nav.vertical, className])}
      sx={sx}
      {...other}
    >


      {/* Close button for mini mode */}
      {!isNavMini && (
        <IconButton
          onClick={() => {
            console.log('Close clicked, isNavMini:', isNavMini);
            onToggleNav();
          }}
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

      {/* Vertical (full) nav — fades out when mini */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          overflow: 'hidden',
          ...(isNavMini ? hiddenAnimatedStyles : visibleStyles),
          transition: theme.transitions.create(transitionProps, {
            easing: 'var(--layout-transition-easing)',
            duration: 'var(--layout-transition-duration)',
          }),
        })}
      >
        {slots?.topArea ?? (
          <Box sx={{ pl: 3.5, pt: 2.5, pb: 1 }}>
            <Logo isNavMini={false} />
          </Box>
        )}

        <Scrollbar fillContent>
          <NavSectionVertical
            data={data}
            cssVars={cssVars}
            checkPermissions={checkPermissions}
            sx={{ px: 2, flex: '1 1 auto' }}
          />

          {slots?.bottomArea ?? <NavUpgrade />}
        </Scrollbar>
      </Box>

      {/* Mini nav — fades in when mini */}
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          overflow: 'hidden',
          ...(isNavMini ? visibleStyles : hiddenAnimatedStyles),
          transition: theme.transitions.create(transitionProps, {
            easing: 'var(--layout-transition-easing)',
            duration: 'var(--layout-transition-duration)',
          }),
        })}
      >
        <Box sx={{px:3, mt:2, pb:2}}>
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
              // pt:7,
              px: 0.5,
              flex: '1 1 auto',
              overflowY: 'auto',
            }),
          ]}
        />

        {slots?.bottomArea}
      </Box>
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
    zIndex: 'var(--layout-nav-zIndex)',
    backgroundColor: 'var(--layout-nav-bg)',
    overflow: 'visible',
    willChange: 'width',
    width: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
    borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
    transition: theme.transitions.create(['width'], {
      easing: 'var(--layout-transition-easing)',
      duration: 'var(--layout-transition-duration)',
    }),
    [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
  })
);
