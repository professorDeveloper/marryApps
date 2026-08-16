import type { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function layoutSectionVars(theme: Theme) {
  return {
    '--layout-nav-mobile-width': '288px',
    '--layout-header-blur': '8px',
    '--layout-header-zIndex': theme.zIndex.appBar + 1,
    '--layout-header-mobile-height': '64px',
    '--layout-header-desktop-height': '64px',
  };
}
