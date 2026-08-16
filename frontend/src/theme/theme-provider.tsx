import type { Theme, ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';
import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

import { useMemo } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';

import { useSettingsContext } from 'src/components/settings';

import { createTheme } from './create-theme';
import { Rtl } from './with-settings/right-to-left';

// ----------------------------------------------------------------------

export type ThemeProviderProps = Partial<MuiThemeProviderProps<Theme>> & {
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  const settings = useSettingsContext();

  // Only the fields that actually affect theme creation — navLayout/navColor/compactLayout do NOT.
  const { direction, fontFamily, contrast, primaryColor, mode } = settings.state;

  const theme = useMemo(
    () =>
      createTheme({
        settingsState: settings.state,
        themeOverrides,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, fontFamily, contrast, primaryColor, mode, themeOverrides]
  );

  return (
    <ThemeVarsProvider disableTransitionOnChange theme={theme} {...other}>
      <CssBaseline />
      <Rtl direction={direction}>{children}</Rtl>
    </ThemeVarsProvider>
  );
}
