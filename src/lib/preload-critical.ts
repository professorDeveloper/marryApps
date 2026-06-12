import { buildMetadataUrl } from 'src/hooks/use-metadata';

import { preload } from 'src/lib/swr';
import { fetcher, endpoints } from 'src/lib/axios';

import { MetadataEntity } from 'src/types/metadata';

// ----------------------------------------------------------------------
// Startup-critical data preloading.
//
// Without this, the cold-load waterfall is serial: /user/me (~1.1s) gates the
// app render, and only then do /branches (~1.8s) and /metadata fire (HAR
// evidence, June 2026). The axios request interceptor reads the JWT from
// storage per request (src/lib/axios.ts), so these fetches are valid before
// React mounts — firing them here runs them in parallel with the auth
// bootstrap instead of after it.
//
// Keys must match the consuming hooks exactly (useGetBranches keys on
// endpoints.branches.list; useMetadata keys via buildMetadataUrl), otherwise
// the preload becomes a wasted duplicate request.
// ----------------------------------------------------------------------

function getStoredToken(): string | null {
  try {
    return (
      sessionStorage.getItem('jwt_access_token') ||
      sessionStorage.getItem('accessToken') ||
      localStorage.getItem('jwt_access_token') ||
      localStorage.getItem('accessToken')
    );
  } catch {
    return null;
  }
}

export function preloadCriticalData(): void {
  if (typeof window === 'undefined') return;
  if (!getStoredToken()) return;

  const metadataUrl = buildMetadataUrl([
    MetadataEntity.HALLS,
    MetadataEntity.USERS,
    MetadataEntity.CAFE_TABLES,
  ]);

  // Failures are non-fatal: the consuming hooks refetch on mount anyway.
  preload(endpoints.branches.list, fetcher).catch(() => {});
  if (metadataUrl) preload(metadataUrl, fetcher).catch(() => {});
}
