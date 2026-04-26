import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from 'src/lib/axios';
import { MetadataEntity, MetadataResponse } from 'src/types/metadata';

const SWR_OPTIONS: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useMetadata(entities: MetadataEntity[]) {
  // Sort for stable cache key regardless of call-site ordering
  const includeString = [...entities].sort().join(',');
  const url = entities.length > 0 ? `/api/v1/metadata?include=${includeString}` : null;

  const { data, isLoading, error } = useSWR<MetadataResponse>(url, fetcher, SWR_OPTIONS);

  return {
    data: data ?? ({} as MetadataResponse),
    isLoading,
    error,
  };
}
