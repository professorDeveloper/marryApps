// ============================================================================
// IMAGE UPLOAD FIELD - COMPONENT
// ============================================================================

import type { FC } from 'react';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

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
    const inputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Convert to base64 or upload
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            onChange(result);
        };
        reader.readAsDataURL(file);
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleRemove = () => {
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onRemove?.();
    };

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
                        borderColor: 'divider',
                        transition: 'all 0.3s',
                        '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: value ? 'transparent' : 'action.selected',
                        },
                    }}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            handleClick();
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
                                Rasmni yuklash uchun bosing yoki shu yerga tortib tashlang
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
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}

                    {value && (
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

                {value && (
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                        onClick={handleClick}
                    >
                        Boshqa rasm yuklash
                    </Button>
                )}

                <Typography variant="caption" color="textSecondary">
                    JPG, PNG, GIF - maksimal 5MB
                </Typography>
            </Stack>
        </Card>
    );
};
