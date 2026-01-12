import type { FC } from 'react';
import type { CardSection, GenericEditViewProps } from './types';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EditFormField } from './edit-form-field';
import { ImageUploadField } from './image-upload-field';

export const GenericEditView: FC<GenericEditViewProps> = ({
    config,
    data,
    isNew = false,
    loading: externalLoading = false,
}) => {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { t } = useTranslation('menu');

    const [loading, setLoading] = useState(externalLoading);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>(
        data || buildInitialFormData(config)
    );
    const isSubmittingRef = useRef(false);

    // Update loading state when externalLoading changes (only if not submitting)
    useEffect(() => {
        if (!isSubmittingRef.current) {
            setLoading(externalLoading);
        }
    }, [externalLoading]);

    // Update formData when data changes
    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            setFormData(data);
        } else if (isNew) {
            // For new items, use initial form data
            setFormData(buildInitialFormData(config));
        }
    }, [data, isNew, config]);

    // Handle field changes
    const handleChange = useCallback(
        (field: string, value: any) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
            setError(null);
        },
        []
    );

    // Handle form submission
    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            isSubmittingRef.current = true;
            setLoading(true);
            setError(null);

            try {
                await config.onSubmit(formData);
                // Reset loading state - redirect will happen in onSubmit if needed
                setLoading(false);
                isSubmittingRef.current = false;
            } catch (err) {
                setError(err instanceof Error ? err.message : `Failed to save ${config.entityName}`);
                // Always reset loading on error so button is not stuck
                setLoading(false);
                isSubmittingRef.current = false;
            }
        },
        [formData, config.onSubmit, config.entityName]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        const message = config.deleteConfirmMessage || `Are you sure you want to delete this ${config.entityName}?`;
        if (!window.confirm(message)) return;

        isSubmittingRef.current = true;
        setLoading(true);
        try {
            if (config.onDelete) {
                await config.onDelete();
            }
            // Reset loading state - redirect will happen in onDelete if needed
            setLoading(false);
            isSubmittingRef.current = false;
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to delete ${config.entityName}`);
            setLoading(false);
            isSubmittingRef.current = false;
        }
    }, [config]);

    return (
        <Box>
            {/* Breadcrumbs */}
            {config.showBreadcrumbs !== false && (
                <CustomBreadcrumbs
                    heading={isNew ? `${config.title}` : `${config.title}`}
                    links={config.breadcrumbs}
                />
            )}

            <form onSubmit={handleSubmit}>
                <Box
                    sx={{
                        maxWidth: 1400,
                        mx: 'auto',
                        pt: 5,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: config.leftSidecard ? '1fr 2fr' : '1fr' },
                        gap: 3,
                    }}
                >
                    {/* Left Column */}
                    {config.leftSidecard && (
                        <Box>
                            <ImageUploadField
                                label=""
                                value={formData.coverUrl}
                                onChange={(value) => handleChange('coverUrl', value)}
                            />
                            {/* <EditFormSection section={config.leftSidecard} formData={formData} onChange={handleChange} /> */}

                            {/* Action Buttons */}
                            <Stack direction="column" spacing={2} sx={{ mt: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    disabled={loading}
                                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                                >
                                    {loading ? t('loading') : t('save')}
                                </Button>

                                {!isNew && config.showDeleteButton !== false && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={handleDelete}
                                        disabled={loading}
                                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                                    >
                                        Delete {config.title}
                                    </Button>
                                )}

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => router.back()}
                                >
                                    {t('cancel')}
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* Right Column or Main Column */}
                    <Box>
                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Form Sections */}
                        {config.sections.map((section) => (
                            <EditFormSection
                                key={section.id}
                                section={section}
                                formData={formData}
                                onChange={handleChange}
                            />
                        ))}

                        {/* Action Buttons for mobile/no left sidebar */}
                        {!config.leftSidecard && (
                            <Stack direction="column" spacing={2} sx={{ mt: 3 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    disabled={loading}
                                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                                >
                                    {loading ? t('loading') : `${t('save')} ${config.title}`}
                                </Button>

                                {!isNew && config.showDeleteButton !== false && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={handleDelete}
                                        disabled={loading}
                                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                                    >
                                        Delete {config.title}
                                    </Button>
                                )}

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => router.back()}
                                >
                                    {t('cancel')}
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </form>
        </Box>
    );
};

// ============================================================================
// EDIT FORM SECTION
// ============================================================================

interface EditFormSectionProps {
    section: CardSection;
    formData: Record<string, any>;
    onChange: (field: string, value: any) => void;
}

const EditFormSection: FC<EditFormSectionProps> = ({ section, formData, onChange }) => (
    <Card sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
            <Typography variant="h6">{section.title}</Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: section.columns === 2 ? '1fr 1fr' : '1fr',
                    },
                    gap: 2,
                }}
            >
                {section.fields.map((field) => (
                    <EditFormField
                        key={field.key}
                        field={field}
                        value={formData[field.key] ?? field.defaultValue}
                        onChange={(value: any) => onChange(field.key, value)}
                    />
                ))}
            </Box>
        </Stack>
    </Card>
);

// ============================================================================
// UTILITIES
// ============================================================================

function buildInitialFormData(config: GenericEditViewProps['config']): Record<string, any> {
    const data: Record<string, any> = {};

    if (config.leftSidecard) {
        config.leftSidecard.fields.forEach((field) => {
            data[field.key] = field.defaultValue ?? null;
        });
    }

    config.sections.forEach((section) => {
        section.fields.forEach((field) => {
            data[field.key] = field.defaultValue ?? null;
        });
    });

    return data;
}

export type { GenericEditViewProps, GenericEditViewConfig } from './types';
