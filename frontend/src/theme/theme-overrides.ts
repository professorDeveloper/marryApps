import type { ThemeOptions } from './types';

import { createPaletteChannel } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#fff2ec',
          light: '#ff6d3d',
          main: '#ff4d1a',
          dark: '#c12e05',
          darker: '#7a1e08',
          contrastText: '#FFFFFF',
        }),
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#fff2ec',
          light: '#ff6d3d',
          main: '#ff4d1a',
          dark: '#c12e05',
          darker: '#7a1e08',
          contrastText: '#FFFFFF',
        }),
        background: {
          default: '#1a1d2e',
          paper: '#141626',
        },
      },
    },
  },
};
