import type { FC } from 'react';

import { useTranslation } from 'react-i18next';
import { memo, useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useImageUrl } from 'src/hooks/use-image-url';

import { uploadImage } from 'src/lib/image-upload';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

interface Props {
    value: string | null;
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
}

const ImageFieldV2Component: FC<Props> = ({ value, onChange, label, disabled }) => {
    const { t } = useTranslation('menu');
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const { imageUrl: displayUrl, loading: urlLoading } = useImageUrl(value);
    const loading = uploading || urlLoading;

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);
            try {
                const objectName = await uploadImage(file);
                onChange(objectName);
                toast.success(t('mealsProducts.upload_success'));
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Upload failed');
            } finally {
                setUploading(false);
                if (inputRef.current) inputRef.current.value = '';
            }
        },
        [onChange, t],
    );

    const handleClick = useCallback(() => {
        if (!loading && !disabled) inputRef.current?.click();
    }, [loading, disabled]);

    return (
        <Card sx={{ p: 3 }}>
            <Stack spacing={2} alignItems="center">
                <Typography variant="h6">{label}</Typography>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={loading || disabled}
                />

                <Box
                    onClick={handleClick}
                    sx={{
                        width: 250,
                        height: 250,
                        bgcolor: displayUrl ? 'transparent' : 'action.hover',
                        borderRadius: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px dashed',
                        borderColor: 'divider',
                        cursor: loading || disabled ? 'default' : 'pointer',
                        '&:hover': {
                            borderColor: loading || disabled ? 'divider' : 'primary.main',
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={40} />
                    ) : displayUrl ? (
                        <Box
                            component="img"
                            src={displayUrl}
                            alt="Preview"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <Iconify icon="eva:cloud-upload-fill" sx={{ fontSize: 48, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                                {t('mealsProducts.upload_image')}
                            </Typography>
                        </Stack>
                    )}
                </Box>

                {displayUrl && !loading && (
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                        onClick={handleClick}
                        disabled={disabled}
                    >
                        {t('mealsProducts.upload_another')}
                    </Button>
                )}
            </Stack>
        </Card>
    );
};

export const ImageFieldV2 = memo(ImageFieldV2Component);
ImageFieldV2.displayName = 'ImageFieldV2';
