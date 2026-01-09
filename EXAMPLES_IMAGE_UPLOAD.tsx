/**
 * Image Upload Integration Examples
 * 
 * This file shows practical examples of how to use the image upload
 * functionality in different scenarios across your application.
 */

// ============================================================================
// EXAMPLE 1: Using ImageUploadField in GenericEditView (AUTOMATIC)
// ============================================================================

/**
 * This is the simplest way. Just add a field with type 'url'
 * The component automatically uses ImageUploadField
 * 
 * Location: Any edit view using GenericEditView
 * Files: category-edit-view.tsx, compounds-edit-view.tsx, meals-edit-view.tsx
 */

import type { CardSection } from 'src/components/generic-edit-view';

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'categories.imageTitle',
    fields: [
        {
            key: 'picture_url',
            label: 'categories.imageUrl',
            type: 'url', // ⭐ This triggers ImageUploadField!
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

// That's it! The form will automatically:
// 1. Show an upload field
// 2. Upload to /api/v1/media/image
// 3. Convert response to full URL
// 4. Store URL in form data


// ============================================================================
// EXAMPLE 2: Using Hook in Custom Component
// ============================================================================

import { useState } from 'react';
import { useImageUpload } from 'src/hooks/use-image-upload';
import { ImageUploadField } from 'src/components/generic-edit-view/image-upload-field';

function CustomImageComponent() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const { loading, error, uploadAndGetUrl } = useImageUpload();

    const handleImageChange = async (url: string) => {
        // This is called by ImageUploadField after successful upload
        setImageUrl(url);
    };

    const handleRemove = () => {
        setImageUrl(null);
    };

    return (
        <ImageUploadField
            label="Product Image"
            value={imageUrl}
            onChange={handleImageChange}
            onRemove={handleRemove}
        />
    );
}


// ============================================================================
// EXAMPLE 3: Direct Hook Usage (Full Control)
// ============================================================================

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

function FileUploadButton() {
    const { uploadAndGetUrl, loading, error } = useImageUpload();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Upload and get full URL
            const imageUrl = await uploadAndGetUrl(file);

            // Use the URL
            console.log('Uploaded image URL:', imageUrl);

            // Send to API
            const response = await fetch('/api/v1/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'My Category',
                    picture_url: imageUrl, // Full URL from backend
                }),
            });
        } catch (err) {
            console.error('Upload failed:', err);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={loading}
            />
            {loading && <CircularProgress />}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </div>
    );
}


// ============================================================================
// EXAMPLE 4: URL Utility Functions
// ============================================================================

import { getFullImageUrl, getObjectName, isValidImageUrl } from 'src/utils/image-url';

// Example: Convert object name to full URL
function displayCategoryImage(objectName: string) {
    const fullUrl = getFullImageUrl(objectName);
    return <img src={fullUrl} alt="Category" />;
}

// Example: Extract object name from full URL
function storeCategoryImage(fullUrl: string) {
    const objectName = getObjectName(fullUrl);
    // Store just the object name in database
    return {
        picture_url: objectName,
    };
}

// Example: Validate image URL
function isValidCategoryImage(url: string): boolean {
    return isValidImageUrl(url);
}


// ============================================================================
// EXAMPLE 5: In a Form Component
// ============================================================================

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { uploadImage } from 'src/lib/image-upload';

interface CategoryForm {
    name: string;
    picture_url: string;
}

function CategoryForm() {
    const [isUploading, setIsUploading] = useState(false);
    const { register, handleSubmit, watch, setValue } = useForm<CategoryForm>({
        defaultValues: {
            name: '',
            picture_url: '',
        },
    });

    const pictureUrl = watch('picture_url');

    const onSubmit = async (data: CategoryForm) => {
        console.log('Submitting form with image:', data.picture_url);
        // Send to API
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const objectName = await uploadImage(file);
            const fullUrl = getFullImageUrl(objectName);
            setValue('picture_url', fullUrl);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input
                {...register('name')}
                type="text"
                placeholder="Category name"
            />

            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
            />

            {pictureUrl && (
                <div>
                    <img src={pictureUrl} alt="Preview" style={{ maxWidth: '200px' }} />
                </div>
            )}

            {isUploading && <p>Uploading...</p>}

            <button type="submit">Save Category</button>
        </form>
    );
}


// ============================================================================
// EXAMPLE 6: In a Product Grid with Images
// ============================================================================

import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';

interface Product {
    id: string;
    name: string;
    picture_url: string;
}

function ProductGrid({ products }: { products: Product[] }) {
    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            {products.map((product) => (
                <Card key={product.id}>
                    <CardMedia
                        component="img"
                        height="200"
                        // Both formats work:
                        // - Full URL: "https://...api/v1/media/image/..."
                        // - Object name: "group_4-2_20260108130516.png"
                        image={getFullImageUrl(product.picture_url)}
                        alt={product.name}
                    />
                    <div>
                        <h3>{product.name}</h3>
                    </div>
                </Card>
            ))}
        </div>
    );
}


// ============================================================================
// EXAMPLE 7: With Error Handling
// ============================================================================

async function handleImageWithErrorHandling(file: File) {
    try {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image must be less than 5MB');
        }

        // Upload
        const objectName = await uploadImage(file);

        // Success - use the image
        const fullUrl = getFullImageUrl(objectName);
        console.log('Image uploaded successfully:', fullUrl);

        return fullUrl;
    } catch (error) {
        // Handle different error types
        const message = error instanceof Error ? error.message : 'Upload failed';
        console.error('Error:', message);

        // Show to user
        alert(message);

        return null;
    }
}


// ============================================================================
// EXAMPLE 8: Batch Upload Handler
// ============================================================================

async function uploadMultipleImages(files: File[]) {
    const uploadPromises = files.map(async (file) => {
        try {
            const objectName = await uploadImage(file);
            const fullUrl = getFullImageUrl(objectName);
            return { success: true, url: fullUrl, file: file.name };
        } catch (error) {
            return {
                success: false,
                file: file.name,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });

    const results = await Promise.all(uploadPromises);

    // Separate successful and failed uploads
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('Uploaded:', successful.length, 'Failed:', failed.length);

    return { successful, failed };
}


// ============================================================================
// EXAMPLE 9: Reusable Upload Component
// ============================================================================

interface ImageInputProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    disabled?: boolean;
}

export function ImageInput({ value, onChange, label = 'Image', disabled = false }: ImageInputProps) {
    const { uploadAndGetUrl, loading, error } = useImageUpload();

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await uploadAndGetUrl(file);
            onChange(url);
        } catch (err) {
            console.error('Upload error:', err);
        }
    };

    return (
        <div>
            <label>{label}</label>
            <input
                type="file"
                accept="image/*"
                onChange={handleChange}
                disabled={loading || disabled}
            />
            {value && <img src={value} alt="Preview" style={{ maxWidth: '100px', marginTop: '8px' }} />}
            {loading && <p>Uploading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

// Usage:
// <ImageInput value={image} onChange={setImage} label="Product Image" />


// ============================================================================
// EXAMPLE 10: In a Modal/Dialog
// ============================================================================

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

function ImageUploadDialog({ open, onClose, onUpload }: {
    open: boolean;
    onClose: () => void;
    onUpload: (url: string) => void;
}) {
    const { uploadAndGetUrl, loading } = useImageUpload();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = await uploadAndGetUrl(file);
        onUpload(url);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogContent>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={loading}
                />
                {loading && <p>Uploading...</p>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}


/**
 * ============================================================================
 * SUMMARY
 * ============================================================================
 * 
 * Choose based on your needs:
 * 
 * ✨ EASIEST (GenericEditView)
 *    - Just set type: 'url'
 *    - Automatic upload handling
 *    - Best for category/compounds/meals pages
 * 
 * 🎯 FLEXIBLE (useImageUpload Hook)
 *    - Full control of upload process
 *    - Works in any component
 *    - Manage loading/error state
 * 
 * 🔧 ADVANCED (Direct Service)
 *    - Use uploadImage() directly
 *    - Implement custom logic
 *    - Combine with other APIs
 * 
 * All methods use the same backend API and produce the same results!
 */
