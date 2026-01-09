/**
 * Image Upload - Central Export File
 * 
 * This file provides convenient exports for all image upload related functionality
 * across the application.
 */

// Service
export { uploadImage, getImageUrl, type ImageUploadResponse, type ImageUploadError } from 'src/lib/image-upload';

// Hook
export { useImageUpload, type UseImageUploadReturn } from 'src/hooks/use-image-upload';

// Component
export { ImageUploadField } from 'src/components/generic-edit-view/image-upload-field';

// Utilities
export {
    getFullImageUrl,
    getObjectName,
    isValidImageUrl,
} from 'src/utils/image-url';

/**
 * Quick Start:
 * 
 * 1. Using ImageUploadField in GenericEditView:
 *    - Add field with type: 'url' and key: 'picture_url'
 *    - Component automatically handles upload
 * 
 * 2. Using Hook Directly:
 *    const { uploadAndGetUrl, loading, error } = useImageUpload();
 *    const url = await uploadAndGetUrl(file);
 * 
 * 3. Converting URLs:
 *    const url = getFullImageUrl("group_4-2_20260108130516.png");
 *    const name = getObjectName("https://...png");
 */
