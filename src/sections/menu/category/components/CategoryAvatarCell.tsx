import type { CategoryAvatarCellProps } from '../types';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

import { getFullImageUrl } from 'src/utils/image-url';
import { getInitials, getAvatarColor } from 'src/utils/avatar';

/**
 * Category image/avatar renderer
 */
export function CategoryAvatarCell({ category }: CategoryAvatarCellProps) {
    const { i18n } = useTranslation('menu');
    const currentLanguage = i18n.language;

    // Get name based on current language
    let name;
    if (currentLanguage.startsWith('en')) {
        name = category.name_en || category.name || '-';
    } else if (currentLanguage.startsWith('ru')) {
        name = category.name_ru || category.name || '-';
    } else {
        // Default to Uzbek (uz)
        name = category.name || '-';
    }

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Load image asynchronously if picture_url exists
    useEffect(() => {
        let isMounted = true;

        if (category.picture_url) {
            const loadImage = async () => {
                try {
                    if (isMounted) {
                        setLoading(true);
                    }
                    const url = await getFullImageUrl(category.picture_url);
                    if (isMounted) {
                        setImageUrl(url);
                    }
                } catch (error) {
                    console.error('Failed to load image:', error);
                    if (isMounted) {
                        setImageUrl(null);
                    }
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };
            loadImage();
        } else {
            setImageUrl(null);
        }

        return () => {
            isMounted = false;
        };
    }, [category.picture_url]);

    // If no image, show avatar with initials
    const initials = getInitials(name);
    const bgColor = imageUrl ? undefined : getAvatarColor(name);

    return (
        <Box
            sx={{
                py: 2,
                gap: 2,
                width: 1,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Avatar
                alt={name}
                src={imageUrl || undefined}
                variant="rounded"
                sx={{
                    width: 64,
                    height: 64,
                    bgcolor: bgColor,
                    color: 'var(--accent-fg)',
                    fontWeight: 'bold',
                    fontSize: '20px',
                    borderRadius: '15%',
                }}
            >
                {!imageUrl && !loading && initials}
                {loading && '...'}
            </Avatar>

            <ListItemText primary={<span>{name}</span>} />
        </Box>
    );
}
