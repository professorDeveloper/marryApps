import type { DataTableColumn, PersistedDataTableConfig } from '../types/types';

export function mergeConfig<T>(
  columns: DataTableColumn<T>[],
  defaultConfig: {
    order?: string[];
    visibility?: Record<string, boolean>;
    widths?: Record<string, number | string>;
  },
  persisted: PersistedDataTableConfig | null
) {
  const allKeys = columns.map((c) => c.key);
  const keySet = new Set(allKeys);

  const baseOrder = (persisted?.order ?? defaultConfig.order ?? allKeys).filter((k) => keySet.has(k));
  const missing = allKeys.filter((k) => !baseOrder.includes(k));
  const order = [...baseOrder, ...missing];

  const visibility: Record<string, boolean> = {};
  for (const c of columns) {
    const def = c.defaultVisible ?? true;
    const fromDefault = defaultConfig.visibility?.[c.key];
    const fromPersisted = persisted?.visibility?.[c.key];
    const v = fromPersisted ?? fromDefault ?? def;
    visibility[c.key] = c.toggleable === false ? true : v;
  }

  const widths: Record<string, number | string> = { ...(defaultConfig.widths ?? {}) };
  if (persisted?.widths) Object.assign(widths, persisted.widths);

  return { order, visibility, widths };
}
