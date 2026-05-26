import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from 'src/lib/axios';
import { MetadataEntity, MetadataInclude, MetadataResponse } from 'src/types/metadata';

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

export function useMetadata(entities: MetadataInclude[]) {
  // Sort by entity name for stable cache key regardless of call-site ordering.
  const tokens = entities
    .map(serializeInclude)
    .sort((a, b) => a.entity.localeCompare(b.entity))
    .map((e) => e.token);
  const includeString = tokens.join(',');
  const url = entities.length > 0 ? `/api/v1/metadata?include=${includeString}` : null;

  const { data, isLoading, error, mutate } = useSWR<MetadataResponse>(url, fetcher, SWR_OPTIONS);

  return {
    data: data ?? ({} as MetadataResponse),
    isLoading,
    error,
    mutate,
  };
}
