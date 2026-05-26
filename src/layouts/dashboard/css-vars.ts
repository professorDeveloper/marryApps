import type { Theme, CSSObject } from '@mui/material/styles';
import type { SettingsState } from 'src/components/settings';

import { varAlpha } from 'minimal-shared/utils';

// import { bulletColor } from 'src/components/nav-section';
// export const bulletColor = { dark: '#2370c8', light: '#EDEFF2' };
export const bulletColor = { dark: 'var(--accent)', light: 'var(--accent)' };

// ----------------------------------------------------------------------

export function dashboardLayoutVars(theme: Theme) {
  return {
    '--layout-nav-horizontal-height': '64px',
    '--layout-dashboard-content-pt': theme.spacing(1),
    '--layout-dashboard-content-pb': theme.spacing(5),
    '--layout-dashboard-content-px': theme.spacing(5),
  };
}

// ----------------------------------------------------------------------
 
// ----------------------------------------------------------------------
// SIDEBAR COLOR CONSTANTS - Clean & Organized
// ----------------------------------------------------------------------

// INTEGRATED THEME COLORS (Default sidebar style)
export const INTEGRATED_SIDEBAR_COLORS = {
  // === SIDEBAR BACKGROUND & BORDERS ===
  SIDEBAR_BG: 'var(--sidebar-bg)',
  SIDEBAR_HORIZONTAL_BG: 'rgba(255, 255, 255, 0.04)',
  SIDEBAR_BORDER: 'var(--border)',
  
  // === TEXT COLORS ===
  TEXT_PRIMARY: 'var(--text-strongest)',     // Main text (white)
  TEXT_SECONDARY: 'var(--text-strong)',     // Secondary text
  TEXT_DISABLED: 'var(--text-soft)',         // Disabled text
  
  // === NAVIGATION ITEMS ===
  NAV_ITEM_ACTIVE: 'var(--text-strongest)',  // Active item text
  NAV_ITEM_CAPTION: '#9ca3af',               // Caption/subtitle text
} as const;

// APPARENT THEME COLORS (Alternative sidebar style)
export const APPARENT_SIDEBAR_COLORS = {
  // === SIDEBAR BACKGROUND & BORDERS ===
  SIDEBAR_BG: '#dc2626',                      // Red background
  SIDEBAR_HORIZONTAL_BG: 'rgba(17, 24, 39, 0.96)', // 96% opacity dark
  SIDEBAR_BORDER: 'transparent',
  
  // === TEXT COLORS ===
  TEXT_PRIMARY: 'var(--text-strongest)',     // Main text (white)
  TEXT_SECONDARY: 'var(--text-strong)',     // Secondary text
  TEXT_DISABLED: 'var(--text-soft)',         // Disabled text
  
  // === NAVIGATION HEADERS ===
  NAV_SUBHEADER_COLOR: 'var(--text-strongest)',  // Section headers
  NAV_SUBHEADER_HOVER: '#ffffff',                 // Header hover
  NAV_SUBHEADER_ACTIVE_BG: '#f6543b',             // Active header background
  
  // === NAVIGATION ITEMS ===
  NAV_ITEM_COLOR: '#9ca3af',                     // Default item text
  NAV_ITEM_ACTIVE: 'var(--text-strongest)',     // Active item text
  NAV_ITEM_OPEN: '#ffffff',                      // Open item text
  NAV_ITEM_CAPTION: '#9ca3af',                   // Caption text
  
  // === NAVIGATION BULLETS ===
  NAV_BULLET_COLOR: bulletColor.dark,             // Bullet indicator
  
  // === SUB-ITEMS (Vertical layout only) ===
  NAV_SUB_ITEM_ACTIVE: '#ffffff',                // Active sub-item text
  NAV_SUB_ITEM_OPEN: '#ffffff',                  // Open sub-item text
} as const;

// ----------------------------------------------------------------------
// HELPER FUNCTION - Simple color selection
// ----------------------------------------------------------------------
export function getSidebarColors(navColor: SettingsState['navColor'] = 'integrate') {
  switch (navColor) {
    case 'integrate':
      return INTEGRATED_SIDEBAR_COLORS;
    case 'apparent':
      return APPARENT_SIDEBAR_COLORS;
    default:
      return INTEGRATED_SIDEBAR_COLORS;
  }
}

// ----------------------------------------------------------------------
// CSS VARIABLES GENERATOR - For layout integration
// ----------------------------------------------------------------------
export function generateSidebarCSSVars(
  navColor: SettingsState['navColor'] = 'integrate',
  navLayout: SettingsState['navLayout'] = 'vertical'
) {
  const colors = getSidebarColors(navColor);
  
  // Base layout variables (common to all themes)
  const layoutVars = {
    // Background & borders
    '--layout-nav-bg': colors.SIDEBAR_BG,
    '--layout-nav-horizontal-bg': colors.SIDEBAR_HORIZONTAL_BG,
    '--layout-nav-border-color': colors.SIDEBAR_BORDER,
    
    // Text colors
    '--layout-nav-text-primary-color': colors.TEXT_PRIMARY,
    '--layout-nav-text-secondary-color': colors.TEXT_SECONDARY,
    '--layout-nav-text-disabled-color': colors.TEXT_DISABLED,
  };
  
  // Navigation section variables
  const sectionVars: Record<string, string> = {
    '--nav-item-root-active-color': colors.NAV_ITEM_ACTIVE,
  };
  
  // Add apparent theme specific variables (type-safe)
  if (navColor === 'apparent') {
    const apparentColors = colors as typeof APPARENT_SIDEBAR_COLORS;
    
    Object.assign(sectionVars, {
      '--nav-item-caption-color': apparentColors.NAV_ITEM_CAPTION,
      '--nav-subheader-color': apparentColors.NAV_SUBHEADER_COLOR,
      '--nav-subheader-hover-color': apparentColors.NAV_SUBHEADER_HOVER,
      '--nav-subheader-active-bg': apparentColors.NAV_SUBHEADER_ACTIVE_BG,
      '--nav-item-color': apparentColors.NAV_ITEM_COLOR,
      '--nav-item-root-open-color': apparentColors.NAV_ITEM_OPEN,
      '--nav-bullet-light-color': apparentColors.NAV_BULLET_COLOR,
    });
    
    // Add sub-item variables for vertical layout
    if (navLayout === 'vertical') {
      Object.assign(sectionVars, {
        '--nav-item-sub-active-color': apparentColors.NAV_SUB_ITEM_ACTIVE,
        '--nav-item-sub-open-color': apparentColors.NAV_SUB_ITEM_OPEN,
      });
    }
  }
  
  return {
    layout: layoutVars,
    section: sectionVars,
  };
}
