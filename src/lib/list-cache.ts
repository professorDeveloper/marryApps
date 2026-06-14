import type { MetadataEntity, MetadataResponse } from 'src/types/metadata';

import { mutate } from 'src/lib/swr';

// ----------------------------------------------------------------------
// Response-based list prepending.
//
// After a create POST, the backend already returns the full created entity.
// Instead of revalidating (`mutate(endpoint)`, which triggers a refetch),
// splice the entity directly into the cached list so the list shows it
// immediately on the next render.
// ----------------------------------------------------------------------

// Matches `listEndpoint` whether the cache key is the bare string or
// `[listEndpoint, { params }]` (any params shape).
export async function prependToListCache<T extends { id: string }>(
  listEndpoint: string,
  item: T
): Promise<void> {
  await mutate(
    (key) => key === listEndpoint || (Array.isArray(key) && key[0] === listEndpoint),
    (current: any) => {
      if (!current) return current;
      if (Array.isArray(current)) {
        return current.some((e) => e?.id === item.id) ? current : [item, ...current];
      }
      if (Array.isArray(current.data)) {
        if (current.data.some((e: any) => e?.id === item.id)) return current;
        const offset = current.pagination?.offset ?? current.offset ?? 0;
        const bump = (n?: number) => (typeof n === 'number' ? n + 1 : n);
        return {
          ...current,
          data: offset === 0 ? [item, ...current.data] : current.data,
          pagination: current.pagination
            ? { ...current.pagination, total: bump(current.pagination.total) }
            : current.pagination,
          total: bump(current.total),
        };
      }
      return current;
    },
    { revalidate: false }
  );
}

// Matches `/api/v1/metadata?include=...<entity>...` keys built by buildMetadataUrl.
export async function prependToMetadataCache<T extends { id: string }>(
  entity: MetadataEntity,
  item: T
): Promise<void> {
  await mutate(
    (key) =>
      typeof key === 'string' && key.startsWith('/api/v1/metadata?include=') && key.includes(entity),
    (current: MetadataResponse | undefined) => {
      const list = current?.[entity];
      if (!list) return current;
      if (list.some((e) => e?.id === item.id)) return current;
      return { ...current, [entity]: [item, ...list] };
    },
    { revalidate: false }
  );
}
