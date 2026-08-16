/**
 * Menu feature constants
 */

import { COLOR_CODES } from 'src/sections/menu/compounds/utilities';

export { COLOR_CODES };

// Table column widths
export const TABLE_COLUMN_WIDTHS = {
  name: '4fr',
  storage: '3fr',
  color: '1fr',
  actions: '0.5fr',
} as const;

// Table column display configuration
export const TABLE_COLUMN_ORDER = ['name', 'storage_id', 'color_code', 'actions'] as const;

export const TABLE_COLUMN_VISIBILITY = {
  name: true,
  storage_id: true,
  color_code: true,
  actions: true,
} as const;
