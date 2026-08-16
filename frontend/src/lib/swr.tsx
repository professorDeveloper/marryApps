import type { State, BareFetcher } from 'swr/_internal';
import type { Cache, ScopedMutator, SWRConfiguration } from 'swr';

import { useEffect } from 'react';
import { SWRConfig, useSWRConfig, preload as swrPreload, mutate as defaultMutate } from 'swr';

// ----------------------------------------------------------------------
// Bounded SWR cache.
//
// SWR's default cache is an unbounded Map, so every distinct list/search/
// filter key permanently retains its full response (often 1000-item pages —
// see the limit interceptor in src/lib/axios.ts). This provider caps the
// cache LRU-style: writes refresh recency, inserts beyond the cap evict the
// least-recently-written key. Evicting a still-mounted key is safe — SWR
// transparently refetches it on the next interaction. Reads deliberately do
// NOT refresh recency (see `get`).
// ----------------------------------------------------------------------

const MAX_CACHE_ENTRIES = 150;

function createLruCache(): Cache {
  const map = new Map<string, State>();

  const touch = (key: string, value: State) => {
    map.delete(key);
    map.set(key, value);
  };

  return {
    keys: () => map.keys(),
    // Reads must not mutate `map`: `internalMutate`'s function-filter path
    // iterates `cache.keys()` while calling `cache.get()` on each key, and
    // re-inserting the current key into a live Map iterator causes it to be
    // visited again indefinitely (infinite loop). Recency is tracked on
    // writes only (see `set`).
    get: (key: string) => map.get(key),
    set: (key: string, value: State) => {
      if (!map.has(key) && map.size >= MAX_CACHE_ENTRIES) {
        for (const candidate of map.keys()) {
          // Keys starting with "$" are SWR-internal (e.g. infinite queries)
          if (!candidate.startsWith('$')) {
            map.delete(candidate);
            break;
          }
        }
      }
      touch(key, value);
    },
    delete: (key: string) => {
      map.delete(key);
    },
  };
}

// ----------------------------------------------------------------------
// Provider-aware `mutate` / `preload`.
//
// With a custom cache provider, the globals exported by 'swr' still target
// the default cache and would silently stop affecting app data. Import these
// from this module instead of 'swr'.
// ----------------------------------------------------------------------

let scopedMutate: ScopedMutator | null = null;

export const mutate: ScopedMutator = (...args: [any, any?, any?]) =>
  (scopedMutate ?? defaultMutate)(...args);

export function preload<Data = unknown>(key: string, fetcher: BareFetcher<Data>): Promise<Data> {
  // Delegate to SWR's native preload: it registers the in-flight promise in
  // SWR's internal registry, so a hook mounting mid-flight consumes that same
  // request instead of firing a duplicate (the registry is independent of the
  // cache provider, so this is safe with our LRU provider). The previous
  // hand-rolled version only mutated the cache on completion, which meant a
  // hook mounting before completion double-fetched.
  return swrPreload(key, fetcher) as Promise<Data>;
}

function SWRMutateBridge() {
  const { mutate: contextMutate } = useSWRConfig();
  useEffect(() => {
    scopedMutate = contextMutate;
  }, [contextMutate]);
  return null;
}

// ----------------------------------------------------------------------

const globalSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000,
};

type AppSWRProviderProps = {
  children: React.ReactNode;
};

export function AppSWRProvider({ children }: AppSWRProviderProps) {
  return (
    <SWRConfig value={{ ...globalSWRConfig, provider: createLruCache }}>
      <SWRMutateBridge />
      {children}
    </SWRConfig>
  );
}
