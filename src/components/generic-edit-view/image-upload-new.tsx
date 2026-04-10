import type { FC } from 'react';

import { useTranslation } from 'react-i18next';
import { memo, useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useImageUrl } from 'src/hooks/use-image-url';

import { uploadImage } from 'src/lib/image-upload';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

interface ImageUploadFieldProps {
    label: string;
    value: string | null;
    onChange: (value: string) => void;
    onRemove?: () => void;
    height?: number;
    sx?: object;
}

const ImageUploadComponent: FC<ImageUploadFieldProps> = ({
    label,
    value,
    onChange,
    onRemove,
    height = 300,
    sx,
}) => {
    const { t } = useTranslation('menu');
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use SWR hook for image URL
    const { imageUrl: displayUrl, loading: imageLoading } = useImageUrl(value);
    const loading = uploadLoading || imageLoading;

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadLoading(true);
        setError(null);

        try {
            // Upload file to backend
            const objectName = await uploadImage(file);

            // Update form data with the object name (not blob URL)
            onChange(objectName);

            toast.success(t('mealsProducts.upload_success') || 'Image uploaded successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Image upload error:', err);
        } finally {
            setUploadLoading(false);
            // Reset input
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    }, [onChange, t]);

    const handleClick = useCallback(() => {
        if (!loading) {
            inputRef.current?.click();
        }
    }, [loading]);

    const handleRemove = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        setError(null);
        onRemove?.();
    }, [onRemove]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                ...sx,
            }}
        >

            <Box
                onClick={handleClick}
                sx={{
                    display: 'flex',
                    position: 'relative',
                    '&:hover .upload-box': {
                        borderColor: error ? 'error.main' : 'primary.main',
                        bgcolor: displayUrl ? 'transparent' : 'action.hover',
                        animation: 'borderPulse 1.5s infinite',
                    },
                    '@keyframes borderPulse': {
                        '0%': {
                            borderColor: error ? 'error.main' : 'primary.main',
                        },
                        '50%': {
                            borderColor: error ? 'error.light' : 'primary.light',
                        },
                        '100%': {
                            borderColor: error ? 'error.main' : 'primary.main',
                        },
                    },
                }}
            >
                <Tooltip title={t('mealsProducts.upload_another')}>
                    <Box
                        className="upload-box"
                        sx={{
                            position: 'relative',
                            bgcolor: displayUrl ? 'transparent' : 'action.hover',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: error ? 'error.main' : 'divider',
                            transition: 'all 0.2s ease-in-out',
                            cursor: loading ? 'wait' : 'pointer',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                width: 120,
                                height: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 0.5,
                                overflow: 'hidden',
                                borderColor: error ? 'error.main' : 'divider',
                                transition: 'all 0.2s ease-in-out',
                                cursor: loading ? 'wait' : 'pointer',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" align="center">
                                {t('mealsProducts.file_types').split('-')[0]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" align="center">
                                {t('mealsProducts.file_types').split('-')[1]?.trim()}
                            </Typography>

                        </Box>
                        <Box
                            className="upload-box"
                            sx={{
                                position: 'relative',
                                width: 120,
                                height: 100,
                                bgcolor: displayUrl ? 'transparent' : 'action.hover',
                                borderTopRightRadius: 1,
                                borderBottomRightRadius: 1,
                                borderTopLeftRadius: "35%",
                                borderBottomLeftRadius: "35%",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '2px solid',
                                borderColor: error ? 'error.main' : 'divider',
                                transition: 'all 0.2s ease-in-out',
                                cursor: loading ? 'wait' : 'pointer',
                            }}
                            role="button"
                            tabIndex={loading ? -1 : 0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    if (!loading) handleClick();
                                }
                            }}
                        >
                            {displayUrl ? (
                                <Box
                                    component="img"
                                    src={displayUrl}
                                    alt="Preview"
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <Stack alignItems="center" spacing={1}>
                                    <Iconify icon="eva:cloud-upload-fill" sx={{ fontSize: 32, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary" align="center">
                                        {t('mealsProducts.upload_prompt')}
                                    </Typography>
                                </Stack>
                            )}

                            {loading && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(255,255,255,0.8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        borderRadius: 1,
                                    }}
                                >
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Tooltip>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={loading}
                />

                {error && (
                    <Typography variant="caption" color="error">
                        {error}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export const ImageUpload = memo(ImageUploadComponent);
