import type { Cache, ScopedMutator, SWRConfiguration } from 'swr';
import type { State, BareFetcher } from 'swr/_internal';

import { SWRConfig, useSWRConfig, mutate as defaultMutate } from 'swr';

// ----------------------------------------------------------------------
// Bounded SWR cache.
//
// SWR's default cache is an unbounded Map, so every distinct list/search/
// filter key permanently retains its full response (often 1000-item pages —
// see the limit interceptor in src/lib/axios.ts). This provider caps the
// cache LRU-style: reads and writes refresh recency, inserts beyond the cap
// evict the least-recently-used key. Evicting a still-mounted key is safe —
// SWR transparently refetches it on the next interaction.
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
    get: (key: string) => {
      const value = map.get(key);
      if (value !== undefined) touch(key, value);
      return value;
    },
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

const preloadInFlight = new Map<string, Promise<unknown>>();

export function preload<Data = unknown>(key: string, fetcher: BareFetcher<Data>): Promise<Data> {
  const inFlight = preloadInFlight.get(key);
  if (inFlight) return inFlight as Promise<Data>;

  const request = Promise.resolve(fetcher(key))
    .then((data) => {
      void mutate(key, data, { revalidate: false });
      return data;
    })
    .finally(() => {
      preloadInFlight.delete(key);
    });

  preloadInFlight.set(key, request);
  return request;
}

function SWRMutateBridge() {
  const { mutate: contextMutate } = useSWRConfig();
  scopedMutate = contextMutate;
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
