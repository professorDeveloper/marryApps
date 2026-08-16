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

/**
 * Builds the SWR key/url for a metadata request. Exported so preload code can
 * produce the exact same key as the hook (a mismatched key makes a preload useless).
 */
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
