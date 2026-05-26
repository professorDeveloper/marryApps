import type { Theme, Direction, CommonColors, ThemeProviderProps } from '@mui/material/styles';
import type { ThemeCssVariables } from './types';
import type { PaletteColorKey, PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

export type ThemeConfig = {
  direction: Direction;
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  defaultMode: ThemeProviderProps<Theme>['defaultMode'];
  modeStorageKey: ThemeProviderProps<Theme>['modeStorageKey'];
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<PaletteColorKey, PaletteColorNoChannels> & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: {
      [K in 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 as `${K}`]: string;
    };
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'dark',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'minimal',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    secondary: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    primary: {
      lighter: '#FFF0E9',
      light: '#FFAB7B',
      main: '#FF8956',
      dark: '#C9521B',
      darker: '#8F3210',
      contrastText: '#1A1D24',
    },
    secondary: {
      lighter: '#F0EDE6',
      light: '#D2CDB9',
      main: '#A6A399',
      dark: '#6E6B62',
      darker: '#45433C',
      contrastText: '#1A1D24',
    },
    info: {
      lighter: '#eff8ff',
      light: '#d1e9ff',
      main: '#2e90fa',
      dark: '#1570ef',
      darker: '#0043cc',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#E9FBF0',
      light: '#6EE7A0',
      main: '#4ADE80',
      dark: '#2F9E44',
      darker: '#1A5E28',
      contrastText: '#1A1D24',
    },
    warning: {
      lighter: '#FFF7E5',
      light: '#FCD34D',
      main: '#FBBF24',
      dark: '#B6781B',
      darker: '#7A4E0C',
      contrastText: '#1A1D24',
    },
    error: {
      lighter: '#FEEEEE',
      light: '#FCA5A5',
      main: '#F87171',
      dark: '#C83333',
      darker: '#861E1E',
      contrastText: '#FBFAF6',
    },
    grey: {
      50:  '#F6F4EE',
      100: '#EDE9DF',
      200: '#E4E0D4',
      300: '#D2CDB9',
      400: '#8A8A93',
      500: '#6E6B62',
      600: '#5E5F68',
      700: '#262A33',
      800: '#1F222B',
      900: '#1A1D24',
    },
    common: {
      black: '#15181F',
      white: '#FBFAF6',
    },
  },
};
