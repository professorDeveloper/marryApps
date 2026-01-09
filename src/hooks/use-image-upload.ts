import { useState, useCallback } from 'react';
import { uploadImage, getImageUrl } from 'src/lib/image-upload';
import { getFullImageUrl, getObjectName } from 'src/utils/image-url';

// ============================================================================
// USE IMAGE UPLOAD HOOK
// ============================================================================

export interface UseImageUploadReturn {
    loading: boolean;
    error: string | null;
    uploadFile: (file: File) => Promise<string>;
    uploadAndGetUrl: (file: File) => Promise<string>;
    getUrl: (objectName: string) => string;
    getObjectNameFromUrl: (url: string) => string;
    reset: () => void;
}

/**
 * Hook to handle image uploads
 * Usage:
 * const { loading, error, uploadAndGetUrl } = useImageUpload();
 * const imageUrl = await uploadAndGetUrl(file);
 */
export const useImageUpload = (): UseImageUploadReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File): Promise<string> => {
        try {
            setLoading(true);
            setError(null);
            const objectName = await uploadImage(file);
            return objectName;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadAndGetUrl = useCallback(async (file: File): Promise<string> => {
        try {
            setLoading(true);
            setError(null);
            const objectName = await uploadImage(file);
            const url = getImageUrl(objectName);
            return url;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
    }, []);

    return {
        loading,
        error,
        uploadFile,
        uploadAndGetUrl,
        getUrl: getFullImageUrl,
        getObjectNameFromUrl: getObjectName,
        reset,
    };
};
