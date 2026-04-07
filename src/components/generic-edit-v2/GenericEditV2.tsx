import type { GenericEditV2Props } from './types';

import { useTranslation } from 'react-i18next';
import { memo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { FieldRenderer } from './FieldRenderer';
import { SectionRenderer } from './SectionRenderer';
import { useGenericEdit } from './hooks/useGenericEdit';

function GenericEditV2Inner<T extends Record<string, any>>({
    data,
    config,
    isNew = false,
    loading = false,
    onSubmit,
    onDelete,
    onCancel,
    title,
}: GenericEditV2Props<T>) {
    const { t } = useTranslation('menu');

    const {
        localData,
        handleFieldChange,
        handleSubmit,
        submitting,
        error,
    } = useGenericEdit(data, onSubmit);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!onDelete) return;
        setDeleting(true);
        setDeleteDialogOpen(false);
        try {
            await onDelete();
        } finally {
            setDeleting(false);
        }
    }, [onDelete]);

    const isDisabled = submitting || deleting || loading;
    const hasSidebar = !!config.sidebar;

    const sidebarField = config.sidebar?.fields[0];

    return (
        <Box>
 
            <Box
                sx={{
                    maxWidth: 1400,
                    mx: 'auto',
                    pt: config.showBreadcrumbs !== false ? 5 : 0,
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: hasSidebar ? '1fr 2fr' : '1fr',
                    },
                    gap: 3,
                }}
            >
                {/* ── Sidebar (image + actions) ─────────────────── */}
                {hasSidebar && sidebarField && (
                    <Box>
                        <FieldRenderer
                            field={sidebarField}
                            value={localData[sidebarField.key]}
                            onChange={handleFieldChange}
                            disabled={isDisabled}
                        />
                        <ActionButtons
                            isNew={isNew}
                            loading={isDisabled}
                            onSubmit={handleSubmit}
                            onCancel={onCancel}
                            onDelete={onDelete ? () => setDeleteDialogOpen(true) : undefined}
                            showDeleteButton={config.showDeleteButton}
                        />
                    </Box>
                )}

                {/* ── Main sections ─────────────────────────────── */}
                <Box>
                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    {config.sections.map((section) => (
                        <SectionRenderer
                            key={section.id}
                            section={section}
                            data={localData}
                            onChange={handleFieldChange}
                            disabled={isDisabled}
                        />
                    ))}

                    {!hasSidebar && (
                        <ActionButtons
                            isNew={isNew}
                            loading={isDisabled}
                            onSubmit={handleSubmit}
                            onCancel={onCancel}
                            onDelete={onDelete ? () => setDeleteDialogOpen(true) : undefined}
                            showDeleteButton={config.showDeleteButton}
                        />
                    )}
                </Box>
            </Box>

            {/* ── Delete confirmation ───────────────────────── */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title={t('common.deleteConfirmTitle', { defaultValue: 'Confirm Delete' })}
                content={
                    config.deleteConfirmMessage
                    || t('common.deleteConfirmMessage', { defaultValue: 'Are you sure?' })
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {t('delete')}
                    </Button>
                }
            />
        </Box>
    );
}

// ── Action buttons (isolated, memoized) ──────────────────────────────────────

interface ActionButtonsProps {
    isNew: boolean;
    loading: boolean;
    onSubmit: () => void;
    onCancel?: () => void;
    onDelete?: () => void;
    showDeleteButton?: boolean;
}

const ActionButtons = memo<ActionButtonsProps>(({
    isNew,
    loading,
    onSubmit,
    onCancel,
    onDelete,
    showDeleteButton,
}) => {
    const { t } = useTranslation('menu');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 3 }}>
            <LoadingButton
                sx={{ backgroundColor: '#FB6633', color: '#FFFFFF' }}
                loading={loading}
                onClick={onSubmit}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
                {t('save')}
            </LoadingButton>

            {!isNew && showDeleteButton !== false && onDelete && (
                <Button
                    variant="outlined"
                    color="error"
                    onClick={onDelete}
                    disabled={loading}
                    startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                >
                    {t('delete')}
                </Button>
            )}

            {onCancel && (
                <Button variant="outlined" onClick={onCancel} disabled={loading}>
                    {t('cancel')}
                </Button>
            )}
        </Box>
    );
});

ActionButtons.displayName = 'ActionButtons';

// ── Export ────────────────────────────────────────────────────────────────────

export const GenericEditV2 = memo(GenericEditV2Inner) as typeof GenericEditV2Inner;
