import { CONFIG } from 'src/global-config';

// ============================================================================
// IMAGE URL UTILITIES
// ============================================================================

/**
 * Get full image URL from object name
 * @param objectName - The object name returned from upload API (e.g., "group_4-2_20260108130516.png")
 * @returns Full URL to the image
 */
export const getFullImageUrl = (objectName: string | null | undefined): string => {
    if (!objectName) return '';

    // If it's already a full URL, return as is
    if (objectName.startsWith('http://') || objectName.startsWith('https://')) {
        return objectName;
    }

    // Construct full URL
    const baseUrl = CONFIG.serverUrl || '';
    return `${baseUrl}/api/v1/media/image/${objectName}`;
};

/**
 * Extract object name from full URL
 * @param url - Full URL or object name
 * @returns Object name only
 */
export const getObjectName = (url: string | null | undefined): string => {
    if (!url) return '';

    const match = url.match(/\/api\/v1\/media\/image\/(.+)$/);
    if (match && match[1]) {
        return match[1];
    }

    // If it's not a full URL, assume it's already an object name
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
