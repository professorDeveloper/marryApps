import type { ThemeOptions } from './types';

import { createPaletteChannel } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FFE1CC',
          light: '#FF9340',
          main: '#FF6B00',
          dark: '#E65100',
          darker: '#7A2E00',
          contrastText: '#FFFFFF',
        }),
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FFE1CC',
          light: '#FF9340',
          main: '#FF6B00',
          dark: '#E65100',
          darker: '#7A2E00',
          contrastText: '#FFFFFF',
        }),
        background: {
          default: '#110C08',
          paper: '#1A130E',
        },
      },
    },
  },
};
