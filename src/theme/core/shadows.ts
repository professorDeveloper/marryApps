import type { Shadows } from '@mui/material/styles';
import type { SchemesRecord } from '../types';

import { varAlpha } from 'minimal-shared/utils';

import { createTheme } from '@mui/material/styles';

import { grey, common } from './palette';

// ----------------------------------------------------------------------

function updateShadowColor(shadow: string, colorChannel: string): string {
  return shadow.replace(/rgba\(\d+,\d+,\d+,(.*?)\)/g, (_, alpha) =>
    varAlpha(colorChannel, parseFloat(alpha))
  );
}

function createShadows(colorChannel: string): Shadows {
  // Get default MUI shadows
  const { shadows: defaultShadows } = createTheme();

  return defaultShadows.map((shadow) => updateShadowColor(shadow, colorChannel)) as Shadows;
}

/* **********************************************************************
 * 📦 Custom shadows matching reference design
 * **********************************************************************/
const lightShadows = [
  'none',
  '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', // Level 1
  '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  '0 4px 12px rgba(0,0,0,0.08)',
  '0 6px 20px rgba(0,0,0,0.12)',
  '0 8px 28px rgba(0,0,0,0.10)',
  '0 12px 32px rgba(0,0,0,0.12)',
  '0 16px 40px rgba(0,0,0,0.14)',
  '0 20px 48px rgba(0,0,0,0.16)',
  '0 24px 56px rgba(0,0,0,0.18)',
  ...Array(15).fill('0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'),
] as Shadows;

const darkShadows = [
  'none',
  '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)', // Level 1
  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  '0 4px 12px rgba(0,0,0,0.4)',
  '0 6px 20px rgba(0,0,0,0.5)',
  '0 8px 28px rgba(0,0,0,0.55)',
  '0 12px 32px rgba(0,0,0,0.6)',
  '0 16px 40px rgba(0,0,0,0.65)',
  '0 20px 48px rgba(0,0,0,0.7)',
  '0 24px 56px rgba(0,0,0,0.75)',
  ...Array(15).fill('0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'),
] as Shadows;

export const shadows: SchemesRecord<Shadows> = {
  light: lightShadows,
  dark: darkShadows,
};
