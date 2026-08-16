import type { MealItemRow } from './types';

/**
 * Persistent cache for MealItemPicker state.
 * Survives component unmount/remount across:
 * - Tab switches
 * - Accordion close/open
 * - View transitions
 *
 * Cache is keyed by a unique identifier (e.g., mealId, compoundId).
 * Entries are cleared when the user navigates away from the parent view.
 */
const cache = new Map<string, Map<string, MealItemRow>>();

export const MealItemPickerCache = {
  /**
   * Save rows to cache
   */
  save: (key: string, rows: Map<string, MealItemRow>) => {
    cache.set(key, new Map(rows));
  },

  /**
   * Restore rows from cache
   */
  restore: (key: string): Map<string, MealItemRow> | null => cache.get(key) ?? null,

  /**
   * Clear cache entry (call when leaving the parent view)
   */
  clear: (key: string) => {
    cache.delete(key);
  },

  /**
   * Clear all cache entries
   */
  clearAll: () => {
    cache.clear();
  },
};
