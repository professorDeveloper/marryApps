import type { FC } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { useRouter } from 'src/routes/hooks';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import type { GenericEditViewProps } from './types';
import { buildInitialFormData } from './utils';
import EditFormSection from './EditFormSection';
import { ImageUploadField } from 'src/index-image-upload';
import { FormActionButtons } from './FormActionButtons';

export const GenericEditView: FC<GenericEditViewProps> = ({
    config,
    data,
    isNew = false,
    loading: externalLoading = false,
    onFormDataChange,
}) => {
    const router = useRouter();
    const { t } = useTranslation('menu');
    const prevDataRef = useRef(data);
    const isInitializedRef = useRef(false);

    const [isLoading, setIsLoading] = useState(externalLoading);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Memoize initial form data to prevent recalculation
    const initialFormData = useMemo(() => {
        if (data && !isInitializedRef.current) {
            isInitializedRef.current = true;
            return { ...buildInitialFormData(config), ...data };
        }
        return buildInitialFormData(config);
    }, [config, data]);

    // Initialize react-hook-form with memoized defaults
    const methods = useForm({
        defaultValues: initialFormData,
        mode: 'onBlur', // Enable onBlur mode for better performance
    });

    // Update loading state efficiently
    useEffect(() => {
        setIsLoading(externalLoading);
    }, [externalLoading]);

    // Only reset form when data actually changes (not on every render)
    useEffect(() => {
        if (data && data !== prevDataRef.current) {
            const mergedData = { ...buildInitialFormData(config), ...data };
            methods.reset(mergedData, { keepValues: true });
            prevDataRef.current = data;
        }
    }, [data, config, methods]);

    // Memoize submit handler to prevent recreation
    const onSubmit = useCallback(async (formData: Record<string, any>) => {
        setIsLoading(true);
        setError(null);

        try {
            await config.onSubmit(formData);
            onFormDataChange?.(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to save ${config.entityName}`);
        } finally {
            setIsLoading(false);
        }
    }, [config.onSubmit, config.entityName, onFormDataChange]);

    // Memoize delete handler
    const handleDelete = useCallback(async () => {
        setIsLoading(true);
        setDeleteDialogOpen(false);
        try {
            await config.onDelete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to delete ${config.entityName}`);
        } finally {
            setIsLoading(false);
        }
    }, [config.onDelete, config.entityName]);

    // Memoize computed values
    const imageFieldKey = useMemo(() => config.leftSidecard?.fields?.[0]?.key || 'picture_url', [config.leftSidecard]);
    const hasLeftSidecard = useMemo(() => !!config.leftSidecard, [config.leftSidecard]);

    const actionButtonProps = useMemo(() => ({
        isNew,
        isLoading,
        showDeleteButton: config.showDeleteButton,
        onDelete: () => setDeleteDialogOpen(true),
    }), [isNew, isLoading, config.showDeleteButton]);


    // Memoize sections to prevent recreation
    const renderedSections = useMemo(() => config.sections.map((section) => (
        <EditFormSection key={section.id} section={section} />
    )), [config.sections]);

    return (
        <Box>
            {config.showBreadcrumbs !== false && (
                <CustomBreadcrumbs
                    heading={isNew ? `New ${config.title}` : `Edit ${config.title}`}
                    links={config.breadcrumbs}
                />
            )}

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <Box
                        sx={{
                            maxWidth: 1400,
                            mx: 'auto',
                            pt: 5,
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: hasLeftSidecard ? '1fr 2fr' : '1fr' },
                            gap: 3,
                        }}
                    >
                        {hasLeftSidecard && (
                            <Box>
                                <Controller
                                    name={imageFieldKey}
                                    control={methods.control}
                                    render={({ field }) => (
                                        <ImageUploadField
                                            label="Upload Image"
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                <FormActionButtons {...actionButtonProps} /> {/* ✅ */}
                            </Box>
                        )}

                        <Box>
                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                            {renderedSections}
                            {!hasLeftSidecard && (
                                <FormActionButtons
                                    isNew={isNew}
                                    isLoading={isLoading}
                                    showDeleteButton={config.showDeleteButton}
                                    onDelete={() => setDeleteDialogOpen(true)}
                                />
                            )}
                        </Box>
                    </Box>
                </form>
            </FormProvider>

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title={t('common.deleteConfirmTitle')}
                content={config.deleteConfirmMessage || t('common.deleteConfirmMessage')}
                action={
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={isLoading}>
                        {t('delete')}
                    </Button>
                }
            />
        </Box>
    );
};