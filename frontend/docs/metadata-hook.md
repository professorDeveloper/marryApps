# `useMetadata` — Full Reference

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/hooks/use-metadata.ts
```

## 1. Purpose

A single SWR-backed hook that fetches multiple small "lookup" entities (storages, departments,
categories, ingredient groups, halls, users, …) in **one HTTP request**, instead of each screen
firing its own separate fetch per entity. Used for populating dropdowns, enriching table rows with
human-readable names (`storage_id` → `storage_name`), etc.

## 2. Supporting type file

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/types/metadata.ts
```

```ts
export enum MetadataEntity {
  STORAGES = 'storages',
  DEPARTMENTS = 'departments',
  CATEGORIES = 'categories',
  INGREDIENT_GROUPS = 'ingredient_groups',
  INGREDIENTS = 'ingredients',
  COMPOUNDS = 'compounds',
  MENUS = 'menus',
  MODIFIERS = 'modifiers',
  DEDICATION_GROUPS = 'dedication_groups',
  TRANSACTION_GROUPS = 'transaction_groups',
  HALLS = 'halls',
  CAFE_TABLES = 'cafetables',
  USERS = 'users',
}

export interface MetadataRecord {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export type MetadataResponse = Partial<Record<MetadataEntity, MetadataRecord[]>>;

// You can request either a plain entity, or an entity restricted to specific fields:
export type MetadataInclude =
  | MetadataEntity
  | { entity: MetadataEntity; fields: string[] };
```

## 3. Source — `use-metadata.ts` (full file, 47 lines)

```ts
import type { SWRConfiguration } from 'swr';
import type { MetadataEntity, MetadataInclude, MetadataResponse } from 'src/types/metadata';

import useSWR from 'swr';
import { fetcher } from 'src/lib/axios';

const SWR_OPTIONS: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

const serializeInclude = (item: MetadataInclude): { entity: MetadataEntity; token: string } => {
  if (typeof item === 'string') {
    return { entity: item, token: item };
  }
  const fields = item.fields.length > 0 ? `(${item.fields.join(',')})` : '';
  return { entity: item.entity, token: `${item.entity}${fields}` };
};

export const buildMetadataUrl = (entities: MetadataInclude[]): string | null => {
  if (entities.length === 0) return null;
  // Sort by entity name for stable cache key regardless of call-site ordering.
  const tokens = entities
    .map(serializeInclude)
    .sort((a, b) => a.entity.localeCompare(b.entity))
    .map((e) => e.token);
  return `/api/v1/metadata?include=${tokens.join(',')}`;
};

export function useMetadata(entities: MetadataInclude[]) {
  const url = buildMetadataUrl(entities);
  const { data, isLoading, error, mutate } = useSWR<MetadataResponse>(url, fetcher, SWR_OPTIONS);
  return {
    data: data ?? ({} as MetadataResponse),
    isLoading,
    error,
    mutate,
  };
}
```

## 4. How the cache key is built (`buildMetadataUrl`)

This is the crux of the design: the SWR cache key is a **URL string**, and it must be identical
regardless of the order entities were requested in, otherwise the same logical request would create
multiple cache entries and duplicate network calls.

- Each `MetadataInclude` item is normalized to a `{ entity, token }` pair via `serializeInclude`:
  - a bare `MetadataEntity` string → `token = entity` (e.g. `'storages'`)
  - `{ entity, fields: ['id','name'] }` → `token = 'storages(id,name)'`
- All tokens are **sorted alphabetically by entity name** before being joined, so
  `useMetadata([DEPARTMENTS, STORAGES])` and `useMetadata([STORAGES, DEPARTMENTS])` produce the
  exact same URL/cache key: `/api/v1/metadata?include=departments,storages`.
- If `entities` is empty, returns `null` → SWR key `null` → **the fetch is skipped** (this is the
  standard SWR "conditional fetching" pattern).

`buildMetadataUrl` is exported specifically so other code (preloaders) can compute the identical key
without going through the hook — see §6.

## 5. Hook contract

```ts
useMetadata(entities: MetadataInclude[]): {
  data: MetadataResponse;   // defaults to {} while loading/on no-key, never undefined
  isLoading: boolean;
  error: unknown;
  mutate: KeyedMutator<MetadataResponse>;
}
```

- Backed by global `useSWR` with `fetcher` from `src/lib/axios.ts` (adds JWT auth header etc. — same
  fetcher used everywhere else in the app).
- `SWR_OPTIONS`: `revalidateIfStale: true` (does revalidate stale cache on mount),
  `revalidateOnFocus: false`, `revalidateOnReconnect: false` — metadata is treated as slow-changing,
  so it's not aggressively refetched on tab focus/reconnect.
- `data` is coalesced to `{}` so callers can safely do `metadata.storages ?? []` without an
  `isLoading` guard.
- Because entities are just an array argument, **every distinct combination of entities requested
  across the app shares one cache entry per URL** — e.g. two components both calling
  `useMetadata([STORAGES, DEPARTMENTS])` hit the same SWR cache key and share one network request.

## 6. Startup preloading integration

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/lib/preload-critical.ts
```

```ts
import { buildMetadataUrl } from 'src/hooks/use-metadata';
import { preload } from 'src/lib/swr';
import { fetcher, endpoints } from 'src/lib/axios';
import { MetadataEntity } from 'src/types/metadata';

export function preloadCriticalData(): void {
  if (typeof window === 'undefined') return;
  if (!getStoredToken()) return;

  const metadataUrl = buildMetadataUrl([
    MetadataEntity.HALLS,
    MetadataEntity.USERS,
    MetadataEntity.CAFE_TABLES,
  ]);

  preload(endpoints.branches.list, fetcher).catch(() => {});
  if (metadataUrl) preload(metadataUrl, fetcher).catch(() => {});
}
```

Why this exists (from the file's own header comment): without it, cold-load is a serial waterfall —
`/user/me` (~1.1s) gates React render, and only then do `/branches` and `/metadata` fire. Since the
axios interceptor reads the JWT straight from storage per-request, these calls are valid *before*
React mounts, so firing them here runs them in parallel with the auth bootstrap.

**Critical constraint**: the preload key must match the consuming hook's key *exactly*, or the
preload becomes a wasted duplicate request instead of a cache hit. That's precisely why
`buildMetadataUrl` is exported from the hook file rather than reimplemented — this preloader
imports the exact same function the hook uses internally. If you add a new preloaded entity
combination here, whatever component calls `useMetadata([...])` later must request the **same set of
entities** (order doesn't matter, sorting handles that) for the preload to pay off.

Preload failures are swallowed (`.catch(() => {})`) — non-fatal, because the consuming `useMetadata`
call will simply fetch normally on mount if the preload didn't land in the cache in time.

## 7. Real usage example

```
/home/spike/Documents/work/MARY_AI/mary_front/frontv2/src/sections/menu/category/hooks/useCategoryData.ts
```

```ts
import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';

const { data: metadata } = useMetadata([MetadataEntity.STORAGES, MetadataEntity.DEPARTMENTS]);

const storages = metadata.storages || [];
const departments = metadata.departments || [];

const enrichedCategories = useMemo(() => {
  const storageMap = new Map(storages?.map((s: any) => [s.id, s.name]) || []);
  const departmentMap = new Map(departments?.map((d: any) => [d.id, d.name]) || []);
  return categories.map((category) => ({
    ...category,
    storage_name: storageMap.get(category.storage_id) || category.storage_name || '-',
    department_name: departmentMap.get(category.department_id) || category.department_name || '-',
  }));
}, [categories, storages, departments]);
```

Pattern: build a `Map` from `id → name` for each requested entity, then enrich a paginated list's raw
rows with human-readable names for display, falling back to any `_name` field already present on the
row, then `'-'`.

## 8. All current consumers (as of this writing)

```
src/sections/menu/compounds/compounds-list-view.tsx
src/sections/menu/category/hooks/useCategoryData.ts
src/sections/warehouse/invoice/invoice-details-standalone-list-view.tsx
src/sections/warehouse/ingredients/ingredients-list-view.tsx
src/sections/products/departments-list-view.tsx
src/sections/warehouse/utils/components/item-picker/components/ItemPickerSection.tsx
src/sections/warehouse/invoice/components/InvoiceFormLineItemsSection.tsx
src/sections/meals/meals-list-view.tsx
src/sections/reports/goods-report/components/GoodsReportListView.tsx
src/sections/warehouse/inventory/components/InventoryItemsSection.tsx
src/sections/reports/ingredients/ingredients-reports-list-view.tsx
src/sections/reports/bills/bills-list-view.tsx
src/actions/ingredient-stock.ts
```

(all paths relative to `/home/spike/Documents/work/MARY_AI/mary_front/frontv2/`)

Other places referencing `buildMetadataUrl` directly (not the hook) — these build the SWR key to
either preload or manually inspect the cache:

```
src/lib/list-cache.ts
src/lib/preload-critical.ts
```
