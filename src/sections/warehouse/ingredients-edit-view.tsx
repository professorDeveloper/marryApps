import type { IIngredientFormData } from 'src/types/ingredients';
import type { SectionConfig, EditViewConfig } from 'src/components/generic-edit-v2';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { useGetIngredient, useCreateIngredient, useUpdateIngredient, useDeleteIngredient, useGetIngredientGroups } from 'src/actions/ingredients';

import { GenericEditV2 } from 'src/components/generic-edit-v2';

const COLOR_CODES = [
    '#FF4842', // Red
    '#1890FF', // Blue
    '#00AB55', // Green
    '#FFC107', // Yellow
    '#7F00FF', // Violet
    '#FF6B35', // Orange
    '#FF1493', // Deep Pink
    '#00CED1', // Dark Turquoise
    '#FFD700', // Gold
    '#8B4513', // Saddle Brown
    '#000000', // Black
    '#FFFFFF', // White
];

export interface IngredientEditViewProps {
    isNew?: boolean;
    onSuccess?: () => void | Promise<void>;
}

export function IngredientEditView({ isNew = false, onSuccess }: IngredientEditViewProps) {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string | undefined;
    const { t } = useTranslation('menu');
    const { createIngredient } = useCreateIngredient();
    const { updateIngredient } = useUpdateIngredient();
    const { deleteIngredient } = useDeleteIngredient();
    const { ingredientGroups } = useGetIngredientGroups();

    // Load ingredient if editing
    const { ingredient, ingredientLoading } = useGetIngredient(!isNew && id ? id : '');

    const groupOptions = useMemo(
        () => ingredientGroups.map((g) => ({
            value: g.id,
            label: g.name,
        })),
        [ingredientGroups]
    );

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.name || !formData.name.trim()) {
                    throw new Error(t('ingredients.nameRequired'));
                }
                if (!formData.measurement || !formData.measurement.trim()) {
                    throw new Error(t('ingredients.measurementRequired'));
                }
                if (!formData.group_id) {
                    throw new Error(t('ingredients.groupRequired'));
                }

                const ingredientData: IIngredientFormData = {
                    name: formData.name,
                    measurement: formData.measurement,
                    group_id: formData.group_id,
                    color_code: formData.color_code || undefined,
                    picture_url: formData.picture_url || undefined,
                };

                if (isNew) {
                    await createIngredient(ingredientData);
                } else if (id) {
                    await updateIngredient(id, ingredientData);
                }

                await new Promise((resolve) => setTimeout(resolve, 500));
                if (onSuccess) {
                    await onSuccess();
                } else {
                    router.push(paths.menu.ingredients.root);
                }
            } catch (err) {
                console.error('Error saving ingredient:', err);
                throw err;
            }
        },
        [isNew, id, t, createIngredient, updateIngredient, router, onSuccess]
    );

    const handleDelete = useCallback(
        async () => {
            try {
                if (id) {
                    await deleteIngredient(id);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    router.push(paths.menu.ingredients.root);
                }
            } catch (err) {
                console.error('Error deleting ingredient:', err);
                throw err;
            }
        },
        [id, deleteIngredient, router]
    );

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    const config: EditViewConfig = useMemo(
        () => ({
            entityName: 'ingredient',
            showBreadcrumbs: false,
            sidebar: {
                id: 'picture',
                title: t('ingredients.pictureInfo', { defaultValue: 'Picture' }),
                fields: [
                    {
                        key: 'picture_url',
                        label: t('common.pictureUrl', { defaultValue: 'Picture' }),
                        type: 'image',
                        defaultValue: null,
                    },
                ],
            } as SectionConfig,
            breadcrumbs: [
                { name: t('app'), href: paths.menu.root },
                { name: t('ingredients.title'), href: paths.menu.ingredients.root },
                { name: isNew ? t('ingredients.new') : t('ingredients.edit'), href: '' },
            ],
            sections: [
                {
                    id: 'basic',
                    title: t('ingredients.basicInfo', { defaultValue: 'Basic Info' }),
                    columns: 1,
                    fields: [
                        {
                            key: 'name',
                            label: t('common.name', { defaultValue: 'Name' }),
                            type: 'text',
                            required: true,
                            defaultValue: '',
                        },
                        {
                            key: 'measurement',
                            label: t('common.measurement', { defaultValue: 'Measurement' }),
                            type: 'select',
                            required: true,
                            defaultValue: '',
                            options: [
                                { value: 'kg', label: t('ingredients.measurementKg', { defaultValue: 'Kg' }) },
                                { value: 'l', label: t('ingredients.measurementL', { defaultValue: 'Litre' }) },
                                { value: 'piece', label: t('ingredients.measurementDona', { defaultValue: 'Piece' }) },
                            ],
                        },
                    ],
                },
                {
                    id: 'group',
                    title: t('ingredients.groupInfo', { defaultValue: 'Group' }),
                    columns: 1,
                    fields: [
                        {
                            key: 'group_id',
                            label: t('ingredients.group', { defaultValue: 'Group' }),
                            type: 'select',
                            required: true,
                            defaultValue: '',
                            options: groupOptions,
                        },
                    ],
                },
                {
                    id: 'color',
                    title: t('ingredients.colorInfo', { defaultValue: 'Color' }),
                    columns: 1,
                    fields: [
                        {
                            key: 'color_code',
                            label: t('common.colorCode', { defaultValue: 'Color' }),
                            type: 'color',
                            defaultValue: COLOR_CODES[0],
                            colors: COLOR_CODES,
                        },
                    ],
                },
            ],
            showDeleteButton: !isNew,
        }),
        [isNew, t, groupOptions]
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          

                <GenericEditV2
                    data={ingredient || null}
                    config={config}
                    isNew={isNew}
                    loading={!isNew && ingredientLoading}
                    onSubmit={handleSubmit}
                    onDelete={!isNew ? handleDelete : undefined}
                    onCancel={handleCancel}
                />
            </Box>
        </Box>
    );
}

export function IngredientEditViewWrapper({ isNew = false }: IngredientEditViewProps) {
    return <IngredientEditView isNew={isNew} />;
}
