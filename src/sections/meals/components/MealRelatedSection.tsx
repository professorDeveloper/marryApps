import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Typography } from '@mui/material';

export const MealRelatedSection = React.memo(function MealRelatedSection() {
    const { t } = useTranslation('menu');
    return (
        <Box
            sx={{
                p: 6,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                color: 'text.secondary',
            }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>
                {t('mealsProducts.related', 'Related meals')}
            </Typography>
            <Typography variant="body2">
                {t('mealsProducts.comingSoon', 'Coming soon')}
            </Typography>
        </Box>
    );
});
