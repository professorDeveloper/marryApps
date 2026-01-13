import axiosInstance from './axios';
import { getFullImageUrl } from 'src/utils/image-url';

export interface ImageUploadResponse {
    status: 'success' | 'error';
    data?: {
        object_name: string;
    };
    message?: string;
}

export interface ImageUploadError {
    message: string;
}

/**
 * Upload image to backend
 * @param file - File to upload
 * @returns Promise with image name (object_name)
 */
export const uploadImage = async (file: File): Promise<string> => {
    try {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please select an image.');
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size exceeds 5MB limit.');
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload to backend
        const response = await axiosInstance.post<ImageUploadResponse>(
            '/api/v1/media/image',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        // Check response
        if (response.data.status === 'success' && response.data.data?.object_name) {
            return response.data.data.object_name;
        }

        throw new Error(response.data.message || 'Failed to upload image');
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Unknown error occurred during image upload');
    }
};

/**
 * Get full image URL from object name
 * @param objectName - The object name returned from upload API
 * @returns Promise with full URL to the image
 */
export const getImageUrl = async (objectName: string): Promise<string> => {
    return await getFullImageUrl(objectName);
};
