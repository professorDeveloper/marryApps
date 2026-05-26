import type { DeductionGroup } from 'src/hooks/use-deductions-api';

import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDeductionsAPI } from 'src/hooks/use-deductions-api';

import { toast } from 'src/components/snackbar';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ============================================================================
// TYPES
// ============================================================================

interface GroupFormData {
    name: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DeductionGroupEditViewProps {
    isNew?: boolean;
}

export function DeductionGroupEditView({ isNew = false }: DeductionGroupEditViewProps) {
    const { t } = useTranslation('menu');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { getDeductionGroups, createDeductionGroup, updateDeductionGroup } = useDeductionsAPI();

    // Form state
    const [formData, setFormData] = useState<GroupFormData>({
        name: '',
    });

    const [group, setGroup] = useState<DeductionGroup | null>(null);
    const [loading, setLoading] = useState(false);

    // Load group data if editing
    useEffect(() => {
        if (!isNew && id) {
            const loadData = async () => {
                try {
                    setLoading(true);
                    const groups = await getDeductionGroups();
                    const foundGroup = groups.find((g) => g.id === id);

                    if (foundGroup) {
                        setGroup(foundGroup);
                        setFormData({
                            name: foundGroup.name,
                        });
                    } else {
                        toast.error(t('error.notFound'));
                        navigate(paths.warehouse.deductionGroups.root);
                    }
                } catch (error) {
                    console.error('Error loading group:', error);
                    toast.error(t('error.loadFailed'));
                } finally {
                    setLoading(false);
                }
            };

            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNew, id]);

    // Handle form data change
    const handleFormDataChange = useCallback((data: Record<string, any>) => {
        setFormData(data as GroupFormData);
    }, []);

    // Handle form submission
    const handleSubmit = useCallback(
        async (data: GroupFormData) => {
            try {
                if (!data.name.trim()) {
                    throw new Error(t('deductions.groupNameRequired'));
                }

                const payload = {
                    name: data.name,
                };

                if (isNew) {
                    // Create new group
                    const result = await createDeductionGroup(payload);
                    if (result) {
                        setGroup(result);
                        toast.success(t('deductions.groupCreated'));
                        navigate(paths.warehouse.deductionGroups.root);
                    }
                } else if (id) {
                    // Update existing group
                    const result = await updateDeductionGroup(id, payload);
                    if (result) {
                        setGroup(result);
                        toast.success(t('deductions.groupUpdated'));
                        navigate(paths.warehouse.deductionGroups.root);
                    }
                }
            } catch (error) {
                console.error('Error saving group:', error);
                throw error;
            }
        },
        [isNew, id, createDeductionGroup, updateDeductionGroup, navigate, t]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        toast.error('Delete not implemented yet');
        throw new Error('Delete not implemented');
    }, []);

    const config = useMemo(
        () => ({
            title: isNew
                ? t('deductions.createGroup')
                : t('deductions.editGroup'),
            entityName: 'Deduction Group',
            breadcrumbs: [
                { name: t('app'), href: paths.menu.root },
                { name: t('deductions.groups'), href: paths.warehouse.deductionGroups.root },
                { name: isNew ? t('deductions.new') : String(group?.name || 'Group'), href: '' },
            ],
            showBreadcrumbs: false,
            showDeleteButton: false,
            sections: [
                {
                    id: 'basic-info',
                    title: t('deductions.groupDetails'),
                    columns: 1,
                    fields: [
                        {
                            key: 'name',
                            label: t('deductions.groupName'),
                            type: 'text' as const,
                            required: true,
                            defaultValue: '',
                        },
                    ],
                },
            ],
            onSubmit: handleSubmit as (formData: Record<string, any>) => Promise<void>,
            onDelete: handleDelete as () => Promise<void>,
        }),
        [isNew, t, group?.name, handleSubmit, handleDelete]
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* BREADCRUMBS AND TITLE */}
                <CustomBreadcrumbs
                    heading={config.title}
                    links={config.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                {/* FORM */}
                <GenericEditView
                    config={config}
                    data={formData}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                    isNew={isNew}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}

export default DeductionGroupEditView;
