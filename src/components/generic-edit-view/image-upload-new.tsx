import type { FC } from 'react';

import { useTranslation } from 'react-i18next';
import { memo, useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
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

let uploadIdCounter = 0;

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
    const [inputId] = useState(() => `image-upload-${++uploadIdCounter}`);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate dynamic width based on height (4:3 aspect ratio)
    const dynamicWidth = Math.round(height * 1.15);

    // Use SWR hook for image URL
    const { imageUrl: displayUrl, loading: imageLoading } = useImageUrl(value);
    const loading = uploadLoading || imageLoading;

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadLoading(true);
        setError(null);

        try {
            const objectName = await uploadImage(file);
            onChange(objectName);
            toast.success(t('mealsProducts.upload_success') || 'Image uploaded successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Image upload error:', err);
        } finally {
            setUploadLoading(false);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    }, [onChange, t]);

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
                component="label"
                htmlFor={loading ? undefined : inputId}
                sx={{
                    display: 'flex',
                    position: 'relative',
                    cursor: loading ? 'wait' : 'pointer',
                    '&:hover .upload-box': {
                        borderColor: error ? 'error.main' : 'var(--accent)',
                        bgcolor: displayUrl ? 'transparent' : 'action.hover',
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
                                width: dynamicWidth,
                                height,
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
                                width: dynamicWidth,
                                height,
                                bgcolor: displayUrl ? 'transparent' : 'action.hover',
                                borderTopRightRadius: 1,
                                borderBottomRightRadius: 1,
                                borderTopLeftRadius: '35%',
                                borderBottomLeftRadius: '35%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '2px solid',
                                borderColor: error ? 'error.main' : 'divider',
                                transition: 'all 0.2s ease-in-out',
                                cursor: loading ? 'wait' : 'pointer',
                                '&:hover .remove-button': {
                                    opacity: 1,
                                },
                            }}
                        >
                            {displayUrl ? (
                                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <Box
                                        component="img"
                                        src={displayUrl}
                                        alt="Preview"
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <Box
                                        onClick={handleRemove}
                                        className="remove-button"
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            transition: 'opacity 0.2s ease-in-out',
                                            border: '1px solid var(--accent)',
                                            '&:hover': {
                                                bgcolor: 'var(--accent)',
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        <Iconify icon="solar:close-circle-bold" sx={{ fontSize: 16, color: 'white' }} />
                                    </Box>
                                </Box>
                            ) : error ? (
                                <Stack alignItems="center" spacing={0.5} sx={{ px: 2 }}>
                                    <Typography variant="caption" color="warning.main" align="center" sx={{ fontWeight: 600 }}>
                                        {error}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" align="center">
                                        {t('mealsProducts.upload_prompt')}
                                    </Typography>
                                </Stack>
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
                                        bgcolor: 'var(--overlay-light)',
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
                    id={inputId}
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={loading}
                />
            </Box>
        </Box>
    );
};

export const ImageUpload = memo(ImageUploadComponent);
