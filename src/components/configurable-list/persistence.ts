import type { PersistenceAdapter, PersistedListConfig } from './types';

const STORAGE_PREFIX = 'cl_config_';
const CONFIG_VERSION = 1;

/** Default persistence adapter backed by localStorage */
export const localStorageAdapter: PersistenceAdapter = {
  load(key: string): PersistedListConfig | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!raw) return null;

      const parsed: PersistedListConfig = JSON.parse(raw);

      // Ignore stale config versions
      if (parsed.version !== CONFIG_VERSION) return null;

      return parsed;
    } catch {
      return null;
    }
  },

  save(key: string, config: PersistedListConfig): void {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify({ ...config, version: CONFIG_VERSION })
      );
    } catch {
      // Storage full or unavailable — silently ignore
    }
  },

  clear(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
      // Ignore
    }
  },
};
