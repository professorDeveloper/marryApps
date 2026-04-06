// import { useTranslation } from 'node_modules/react-i18next';
import type { FC } from 'react';

import { memo } from 'react';
import { useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';
// FormActionButtons.tsx — ALOHIDA FAYL
import Button from '@mui/lab/LoadingButton';

import { useRouter } from 'src/routes/hooks/use-router';

import { Iconify } from '../iconify';

export const FormActionButtons: FC<{
    isNew: boolean;
    isLoading: boolean;
    showDeleteButton?: boolean;
    onDelete: () => void;
}> = memo(({ isNew, isLoading, showDeleteButton, onDelete }) => {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { isSubmitting } = useFormState(); // ✅ Faqat shu komponent re-render bo'ladi

    return (
        <Stack direction="column" spacing={2} sx={{ mt: 3 }}>
            <Button
                sx={{ backgroundColor: '#FB6633', color: '#FFFFFF' }}
                type="submit"
                disabled={isLoading || isSubmitting}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
                {isLoading ? t('loading') : t('save')}
            </Button>
            {!isNew && showDeleteButton !== false && (
                <Button
                    variant="outlined"
                    color="error"
                    onClick={onDelete}
                    disabled={isLoading}
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                >
                    {t('delete')}
                </Button>
            )}
            <Button variant="outlined" onClick={() => router.back()}>
                {t('cancel')}
            </Button>
        </Stack>
    );
});