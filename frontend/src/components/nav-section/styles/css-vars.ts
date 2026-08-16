import type { Theme } from '@mui/material/styles';


// ----------------------------------------------------------------------

// Sidebar should always be dark, regardless of light/dark mode
// Using CSS variable for consistency - matches --color-sidebar-text in global.css
export const bulletColor = { dark: 'var(--text-2)', light: 'var(--text-2)' };


function colorVars(theme: Theme, variant?: 'vertical' | 'mini' | 'horizontal') {
  const {
    vars: { palette },
  } = theme;

  return {
    '--nav-item-color': 'var(--text-2)',
    '--nav-item-hover-bg': 'var(--hover)',
    '--nav-item-caption-color': 'var(--text-3)',
    // root
    '--nav-item-root-active-color': 'var(--accent)',
    '--nav-item-root-active-color-on-dark': 'var(--accent)',
    '--nav-item-root-active-bg': 'var(--accent-soft)',
    '--nav-item-root-active-hover-bg': 'var(--accent-soft)',
    '--nav-item-root-open-color': 'var(--text)',
    '--nav-item-root-open-bg': 'var(--hover)',
    // sub
    '--nav-item-sub-active-color': 'var(--accent)',
    '--nav-item-sub-active-bg': 'var(--accent-soft)',
    '--nav-item-sub-open-color': 'var(--text)',
    '--nav-item-sub-open-bg': 'var(--hover)',
    ...(variant === 'vertical' && {
      '--nav-item-sub-active-bg': 'var(--accent-soft)',
      '--nav-subheader-color': 'var(--text-3)',
      '--nav-subheader-hover-color': 'var(--text)',
    }),
  };
}

// ----------------------------------------------------------------------

function verticalVars(theme: Theme) {
  const { shape } = theme;

  return {
    ...colorVars(theme, 'vertical'),
    '--nav-item-gap': '2px',
    '--nav-item-radius': '6px',
    '--nav-item-pt': '9px',
    '--nav-item-pr': '10px',
    '--nav-item-pb': '9px',
    '--nav-item-pl': '10px',
    // root
    '--nav-item-root-height': '40px',
    // sub
    '--nav-item-sub-height': '36px',
    // icon
    '--nav-icon-size': '28px',
    '--nav-icon-margin': '0 12px 0 0',
    // bullet
    '--nav-bullet-size': '4px',
    '--nav-bullet-light-color': 'var(--accent)',
    '--nav-bullet-dark-color': 'var(--accent)',
  };
}

// ----------------------------------------------------------------------

function miniVars(theme: Theme) {
  const { shape } = theme;

  return {
    ...colorVars(theme, 'mini'),
    '--nav-item-gap': '2px',
    '--nav-item-radius': `${shape.borderRadius}px`,
    // root
    '--nav-item-root-height': '48px',
    '--nav-item-root-padding': '10px 4px',
    // sub
    '--nav-item-sub-height': '40px',
    '--nav-item-sub-padding': '0 8px',
    // icon
    '--nav-icon-size': '28px',
    '--nav-icon-root-margin': '0',
    '--nav-icon-sub-margin': '0 8px 0 0',
  };
}

// ----------------------------------------------------------------------

function horizontalVars(theme: Theme) {
  const { shape } = theme;

  return {
    ...colorVars(theme, 'horizontal'),
    '--nav-item-gap': '6px',
    '--nav-height': '56px',
    '--nav-item-radius': `${Number(shape.borderRadius) * 0.75}px`,
    // root
    '--nav-item-root-height': '32px',
    '--nav-item-root-padding': '0 6px',
    // sub
    '--nav-item-sub-height': '34px',
    '--nav-item-sub-padding': '0 8px',
    // icon
    '--nav-icon-size': '22px',
    '--nav-icon-sub-margin': '0 8px 0 0',
    '--nav-icon-root-margin': '0 8px 0 0',
  };
}

// ----------------------------------------------------------------------

export const navSectionCssVars = {
  mini: miniVars,
  vertical: verticalVars,
  horizontal: horizontalVars,
};
