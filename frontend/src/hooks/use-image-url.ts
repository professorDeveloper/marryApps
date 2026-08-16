import type { SWRConfiguration } from 'swr';

import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance from 'src/lib/axios';

// ============================================================================
// CONFIGURATION
// ============================================================================

const swrOptions: SWRConfiguration = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // Cache image URLs for 1 hour
    dedupingInterval: 60 * 60 * 1000,
};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Fetcher function for image URLs
 */
async function fetchImageUrl(objectName: string): Promise<string> {
    if (!objectName) return '';

    // If it's already a full URL, return as is
    if (objectName.startsWith('http://') || objectName.startsWith('https://')) {
        return objectName;
    }

    try {
        // Download image via POST API
        const response = await axiosInstance.post(
            '/api/v1/media/image/download',
            {
                object_name: objectName,
            },
            {
                responseType: 'blob',
            }
        );

        // Create blob URL
        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'image/jpeg',
        });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Failed to download image:', error);
        return '';
    }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get image URL from object name with caching
 * @param objectName - The object name returned from upload API
 * @returns Object with imageUrl, loading, error
 */
export function useImageUrl(objectName: string | null | undefined) {
    // Use objectName as key, but only if it's not already a blob URL or full URL
    const key = objectName && 
        !objectName.startsWith('blob:') && 
        !objectName.startsWith('http://') && 
        !objectName.startsWith('https://')
        ? `image-url-${objectName}` 
        : null;

    const { data, isLoading, error } = useSWR<string>(
        key,
        () => fetchImageUrl(objectName!),
        {
            ...swrOptions,
            // Don't fetch if it's already a blob URL or full URL
            shouldRetryOnError: false,
        }
    );

    const imageUrl = useMemo(() => {
        if (!objectName) return '';
        
        // If it's already a blob URL or full URL, use it directly
        if (objectName.startsWith('blob:') || objectName.startsWith('http://') || objectName.startsWith('https://')) {
            return objectName;
        }

        return data || '';
    }, [objectName, data]);

    return {
        imageUrl,
        loading: isLoading,
        error,
    };
}

