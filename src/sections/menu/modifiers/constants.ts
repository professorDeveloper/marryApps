/**
 * Modifiers feature constants
 */

import { COLOR_CODES } from 'src/sections/menu/compounds/utilities';

export { COLOR_CODES };

// Table column widths
export const TABLE_COLUMN_WIDTHS = {
  name: '3fr',
  code: '2fr',
  is_active: '1fr',
  created_at: '2fr',
  actions: '60px',
} as const;

// Table column display configuration
export const TABLE_COLUMN_ORDER = ['name', 'code', 'is_active', 'created_at', 'actions'] as const;

export const TABLE_COLUMN_VISIBILITY = {
  name: true,
  code: true,
  is_active: true,
  created_at: true,
  actions: true,
} as const;

// Persist key for table state
export const MODIFIERS_TABLE_PERSIST_KEY = 'modifiers-table';
