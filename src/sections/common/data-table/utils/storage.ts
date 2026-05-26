import type { StorageStrategy, PersistedDataTableConfig } from "../types/types";

const STORAGE_PREFIX = 'utility_dt_';
const VERSION = 1;

export const localStorageStrategy: StorageStrategy = {
  load(key) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedDataTableConfig;
      if (!parsed || parsed.version !== VERSION) return null;
      if (!Array.isArray(parsed.order) || typeof parsed.visibility !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  },
  save(key, config) {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify({ ...config, version: VERSION })
      );
    } catch {
      // ignore
    }
  },
  clear(key) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
      // ignore
    }
  },
};

