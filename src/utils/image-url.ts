import axiosInstance from 'src/lib/axios';

// ============================================================================
// IMAGE URL UTILITIES
// ============================================================================

/**
 * Get full image URL from object name by downloading via API
 * @param objectName - The object name returned from upload API (e.g., "c0f18a64-7f5c-4425-9414-1b01cddee9d9/{extension}")
 * @returns Promise with blob URL to the image
 */
export const getFullImageUrl = async (objectName: string | null | undefined): Promise<string> => {
    if (!objectName) return '';

    // If it's already a full URL, return as is
    if (objectName.startsWith('http://') || objectName.startsWith('https://')) {
        return objectName;
    }

    try {
        // Download image via POST API
        const response = await axiosInstance.post('/api/v1/media/image/download', {
            object_name: objectName,
        }, {
            responseType: 'blob',
        });

        // Create blob URL
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Failed to download image:', error);
        return '';
    }
};

/**
 * Extract object name from full URL or return as is (since new format is just the object_name)
 * @param url - Full URL or object name
 * @returns Object name only
 */
export const getObjectName = (url: string | null | undefined): string => {
    if (!url) return '';

    // Since we're now using blob URLs and the API returns object_name directly,
    // we can return the input as is if it's not a blob URL
    if (url.startsWith('blob:')) {
        // For blob URLs, we can't extract the original object_name
        // This might need to be handled differently in components that need the object_name
        return '';
    }

    // If it's a full URL from old system, extract the object name
    const match = url.match(/\/api\/v1\/media\/image\/(.+)$/);
    if (match && match[1]) {
        return match[1];
    }

    // If it's not a full URL, assume it's already an object name (UUID format)
    return url;
};

/**
 * Check if URL is a valid image URL
 * @param url - URL to check
 * @returns true if valid image URL
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;

    try {
        new URL(url);
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    } catch {
        // Not a valid URL, but could be an object name
        return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    }
};
