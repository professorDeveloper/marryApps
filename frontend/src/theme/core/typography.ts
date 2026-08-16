import type { Breakpoint, TypographyVariantsOptions } from '@mui/material/styles';

import { pxToRem, setFont } from 'minimal-shared/utils';

import { createTheme } from '@mui/material/styles';

import { themeConfig } from '../theme-config';

// ----------------------------------------------------------------------

/**
 * TypeScript extension for MUI theme augmentation.
 * @to {@link file://./../extend-theme-types.d.ts}
 */

export type TypographyVariantsExtend = {
  fontWeightSemiBold: React.CSSProperties['fontWeight'];
  fontWeightExtraBold: React.CSSProperties['fontWeight'];
  fontSecondaryFamily: React.CSSProperties['fontFamily'];
};

/**
 * Generates responsive font styles for given breakpoints
 * @param sizes - Object mapping breakpoints to font sizes in pixels
 * @returns CSS media query styles for responsive font sizes
 */
type FontSizesInput = Partial<Record<Breakpoint, number>>;
type FontSizesResult = Record<string, { fontSize: React.CSSProperties['fontSize'] }>;

function responsiveFontSizes(sizes: FontSizesInput): FontSizesResult {
  const {
    breakpoints: { keys, up },
  } = createTheme();

  return keys.reduce((styles, breakpoint) => {
    const size = sizes[breakpoint];

    if (size !== undefined && size >= 0) {
      styles[up(breakpoint)] = {
        fontSize: pxToRem(size),
      };
    }

    return styles;
  }, {} as FontSizesResult);
}

// ----------------------------------------------------------------------

const primaryFont = setFont(themeConfig.fontFamily.primary);
const secondaryFont = setFont(themeConfig.fontFamily.secondary);

const baseTypography: TypographyVariantsOptions = {
  fontFamily: primaryFont,
  fontSecondaryFamily: secondaryFont,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
};

/* **********************************************************************
 * 📦 Final
 * **********************************************************************/
/**
 * Line height is set as a unitless ratio: 22 / 14 ≈ 1.57
 * - 22px is the desired visual line height
 * - 14px is the font size
 * This keeps the line height scalable and responsive.
 */
/* Slate Dawn type ladder — admin pages stay calm, nothing above 20px */
export const typography: TypographyVariantsOptions = {
  ...baseTypography,
  h1: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 1.3,
    fontSize: pxToRem(20),
    letterSpacing: '-0.025em',
  },
  h2: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 1.4,
    fontSize: pxToRem(16),
    letterSpacing: '-0.02em',
  },
  h3: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 1.4,
    fontSize: pxToRem(14),
    letterSpacing: '-0.01em',
  },
  h4: {
    fontWeight: 700,
    lineHeight: 1.4,
    fontSize: pxToRem(14),
  },
  h5: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(13),
  },
  h6: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(13),
  },
  subtitle1: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(14),
  },
  subtitle2: {
    fontWeight: 500,
    lineHeight: 1.5,
    fontSize: pxToRem(12.5),
  },
  body1: {
    fontWeight: 500,
    lineHeight: 1.6,
    fontSize: pxToRem(14),
    letterSpacing: '-0.005em',
  },
  body2: {
    fontWeight: 500,
    lineHeight: 1.6,
    fontSize: pxToRem(13),
    letterSpacing: '-0.005em',
  },
  caption: {
    fontWeight: 500,
    lineHeight: 1.5,
    fontSize: pxToRem(12.5),
  },
  overline: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(11),
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  button: {
    fontWeight: 600,
    lineHeight: 1,
    fontSize: pxToRem(13),
    textTransform: 'unset',
    letterSpacing: '-0.005em',
  },
};
