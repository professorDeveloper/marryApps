// ============================================================================
// IMAGE UPLOAD FIELD - COMPONENT
// ============================================================================

import type { FC } from 'react';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { uploadImage, getImageUrl } from 'src/lib/image-upload';
import { toast } from 'src/components/snackbar';

interface ImageUploadFieldProps {
    label: string;
    value: string | null;
    onChange: (value: string) => void;
    onRemove?: () => void;
    height?: number;
}

export const ImageUploadField: FC<ImageUploadFieldProps> = ({
    label,
    value,
    onChange,
    onRemove,
    height = 300,
}) => {
    const { t } = useTranslation('menu');
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            // Upload file to backend
            const objectName = await uploadImage(file);

            // Get full URL from object name
            const imageUrl = getImageUrl(objectName);

            // Update form data with the image URL
            onChange(imageUrl);

            toast.success(t('mealsProducts.upload_success') || 'Image uploaded successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Image upload error:', err);
        } finally {
            setLoading(false);
            // Reset input
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        if (!loading) {
            inputRef.current?.click();
        }
    };

    const handleRemove = () => {
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        setError(null);
        onRemove?.();
    };

    return (
        <Card sx={{ p: 3 }}>
            <Stack spacing={2} alignItems="center">
                <Typography variant="h6">{label}</Typography>

                {error && (
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" color="error" align="center">
                            {error}
                        </Typography>
                    </Box>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={loading}
                />

                <Box
                    sx={{
                        width: 250,
                        height: 250,
                        bgcolor: value ? 'transparent' : 'action.hover',
                        borderRadius: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px dashed',
                        borderColor: error ? 'error.main' : 'divider',
                        transition: 'all 0.3s',
                        cursor: loading ? 'wait' : 'pointer',
                        '&:hover': {
                            borderColor: error ? 'error.main' : 'primary.main',
                            bgcolor: value ? 'transparent' : 'action.selected',
                        },
                    }}
                    onClick={handleClick}
                    role="button"
                    tabIndex={loading ? -1 : 0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            if (!loading) handleClick();
                        }
                    }}
                >
                    {value ? (
                        <Box
                            component="img"
                            src={value}
                            alt="Preview"
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <Iconify icon="eva:cloud-upload-fill" sx={{ fontSize: 48, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary" align="center">
                                {t('mealsProducts.upload_prompt')}
                            </Typography>
                        </Stack>
                    )}

                    {loading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                            }}
                        >
                            <Stack alignItems="center" spacing={1}>
                                <CircularProgress sx={{ color: 'white' }} />
                                <Typography variant="caption" sx={{ color: 'white' }}>
                                    {t('mealsProducts.uploading') || 'Uploading...'}
                                </Typography>
                            </Stack>
                        </Box>
                    )}

                    {value && !loading && (
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(0,0,0,0.8)',
                                },
                            }}
                        >
                            <Iconify icon="solar:close-circle-bold" />
                        </IconButton>
                    )}
                </Box>

                {value && !loading && (
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                        onClick={handleClick}
                        disabled={loading}
                    >
                        {t('mealsProducts.upload_another')}
                    </Button>
                )}

                <Typography variant="caption" color="textSecondary">
                    {t('mealsProducts.file_types')}
                </Typography>
            </Stack>
        </Card>
    );
};
