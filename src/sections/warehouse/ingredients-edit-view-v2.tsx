import type { IIngredientFormData } from 'src/types/ingredients';
import type { SectionConfig, EditViewConfig } from 'src/components/generic-edit-v2';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import {
    useGetIngredient,
    useCreateIngredient,
    useUpdateIngredient,
    useDeleteIngredient,
    useGetIngredientGroups,
} from 'src/actions/ingredients';

import { GenericEditV2 } from 'src/components/generic-edit-v2';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ── Constants ────────────────────────────────────────────────────────────────

const COLOR_CODES = [
    'var(--color-danger-500)', 'var(--color-info-500)', 'var(--color-success-500)', 'var(--color-warning-500)', 'var(--color-secondary-500)', 'var(--color-primary-500)',
    'var(--color-danger-100)', 'var(--color-danger-600)', 'var(--color-info-100)', 'var(--color-warning-300)', 'var(--color-text)', 'var(--color-text-on-primary)',
];

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
    isNew?: boolean;
    onSuccess?: () => void | Promise<void>;
}

export function IngredientEditViewV2({ isNew = false, onSuccess }: Props) {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string | undefined;
    const { t } = useTranslation('menu');

    const { createIngredient } = useCreateIngredient();
    const { updateIngredient } = useUpdateIngredient();
    const { deleteIngredient } = useDeleteIngredient();
    const { ingredientGroups } = useGetIngredientGroups();
    const { ingredient, ingredientLoading } = useGetIngredient(!isNew && id ? id : '');

    // ── Build options ────────────────────────────────────────────────────
    const groupOptions = useMemo(
        () => ingredientGroups.map((g) => ({ value: g.id, label: g.name })),
        [ingredientGroups],
    );

    // ── Config (rebuilt only when options or translations change) ─────────
    const config: EditViewConfig = useMemo(() => {
        const basicSection: SectionConfig = {
            id: 'basic',
            title: t('ingredients.basicInfo', 'Basic Info'),
            columns: 1,
            fields: [
                {
                    key: 'name',
                    label: t('common.name', 'Name'),
                    type: 'text',
                    required: true,
                    defaultValue: '',
                },
                {
                    key: 'measurement',
                    label: t('common.measurement', 'Measurement'),
                    type: 'select',
                    required: true,
                    defaultValue: '',
                    options: [
                        { value: 'kg', label: t('ingredients.measurementKg', 'Kg') },
                        { value: 'l', label: t('ingredients.measurementL', 'Litre') },
                        { value: 'piece', label: t('ingredients.measurementDona', 'Piece') },
                    ],
                },
            ],
        };

        const groupSection: SectionConfig = {
            id: 'group',
            title: t('ingredients.groupInfo', 'Group'),
            columns: 1,
            fields: [
                {
                    key: 'group_id',
                    label: t('ingredients.group', 'Group'),
                    type: 'select',
                    required: true,
                    defaultValue: '',
                    options: groupOptions,
                },
            ],
        };

        const colorSection: SectionConfig = {
            id: 'color',
            title: t('ingredients.colorInfo', 'Color'),
            columns: 1,
            fields: [
                {
                    key: 'color_code',
                    label: t('common.colorCode', 'Color'),
                    type: 'color',
                    defaultValue: COLOR_CODES[0],
                    colors: COLOR_CODES,
                },
            ],
        };

        const sidebar: SectionConfig = {
            id: 'picture',
            title: t('ingredients.pictureInfo', 'Picture'),
            fields: [
                {
                    key: 'picture_url',
                    label: t('common.pictureUrl', 'Picture'),
                    type: 'image',
                    defaultValue: null,
                },
            ],
        };

        return {
            entityName: 'ingredient',
            showBreadcrumbs: false,
            sidebar,
            sections: [basicSection, groupSection, colorSection],
            breadcrumbs: [
                { name: t('app'), href: paths.menu.root },
                { name: t('ingredients.title'), href: paths.menu.ingredients.root },
                { name: isNew ? t('ingredients.new') : t('ingredients.edit'), href: '' },
            ],
            showDeleteButton: !isNew,
        };
    }, [t, groupOptions, isNew]);

    // ── Handlers ─────────────────────────────────────────────────────────

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            if (!formData.name?.trim()) throw new Error(t('ingredients.nameRequired'));
            if (!formData.measurement?.trim()) throw new Error(t('ingredients.measurementRequired'));
            if (!formData.group_id) throw new Error(t('ingredients.groupRequired'));

            const payload: IIngredientFormData = {
                name: formData.name,
                measurement: formData.measurement,
                group_id: formData.group_id,
                color_code: formData.color_code || undefined,
                picture_url: formData.picture_url || undefined,
            };

            if (isNew) {
                await createIngredient(payload);
            } else if (id) {
                await updateIngredient(id, payload);
            }

            await new Promise((r) => setTimeout(r, 500)); // SWR cache

            if (onSuccess) {
                await onSuccess();
            } else {
                router.push(paths.menu.ingredients.root);
            }
        },
        [isNew, id, t, createIngredient, updateIngredient, router, onSuccess],
    );

    const handleDelete = useCallback(async () => {
        if (!id) return;
        await deleteIngredient(id);
        await new Promise((r) => setTimeout(r, 500));
        router.push(paths.menu.ingredients.root);
    }, [id, deleteIngredient, router]);

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                <CustomBreadcrumbs
                    heading={isNew ? t('ingredients.new') : t('ingredients.edit')}
                    links={config.breadcrumbs!}
                    sx={{ mb: 3 }}
                />

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

export function IngredientEditViewV2Wrapper({ isNew = false }: Props) {
    return <IngredientEditViewV2 isNew={isNew} />;
}
