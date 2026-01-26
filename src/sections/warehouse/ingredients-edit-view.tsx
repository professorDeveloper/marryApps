import { useCallback, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import type { IIngredientFormData } from 'src/types/ingredients';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import {
    useGetIngredient,
    useCreateIngredient,
    useUpdateIngredient,
    useDeleteIngredient,
    useGetIngredientGroups,
} from 'src/actions/ingredients';

import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

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

function translateSection(section: CardSection, t: TFunction): CardSection {
    const mapped = { ...section } as CardSection;
    if (typeof mapped.title === 'string' && mapped.title.includes('.')) {
        mapped.title = t(mapped.title as string, mapped.title as string);
    }
    if (Array.isArray(mapped.fields)) {
        mapped.fields = mapped.fields.map((f) => {
            const nf = { ...f };
            if (typeof nf.label === 'string' && nf.label.includes('.')) {
                nf.label = t(nf.label as string, nf.label as string);
            }
            if (nf.options && Array.isArray(nf.options)) {
                nf.options = nf.options.map((opt) => ({
                    ...opt,
                    label:
                        typeof opt.label === 'string' && opt.label.includes('.')
                            ? t(opt.label as string, opt.label as string)
                            : opt.label,
                }));
            }
            return nf;
        });
    }
    return mapped;
}

function buildBasicInfoSection(): CardSection {
    return {
        id: 'basic',
        title: 'ingredients.basicInfo',
        columns: 1,
        fields: [
            {
                key: 'name',
                label: 'common.name',
                type: 'text' as const,
                required: true,
                defaultValue: '',
            },
            {
                key: 'measurement',
                label: 'common.measurement',
                type: 'select' as const,
                required: true,
                defaultValue: '',
                options: [
                    { value: 'kg', label: 'ingredients.measurementKg' },
                    { value: 'l', label: 'ingredients.measurementL' },
                    { value: 'piece', label: 'ingredients.measurementDona' },
                ],
            },
        ],
    };
}

function buildGroupSection(groupOptions: Array<{ value: string; label: string }>): CardSection {
    return {
        id: 'group',
        title: 'ingredients.groupInfo',
        columns: 1,
        fields: [
            {
                key: 'group_id',
                label: 'ingredients.group',
                type: 'select' as const,
                required: true,
                defaultValue: '',
                options: groupOptions,
            },
        ],
    };
}

function buildColorSection(): CardSection {
    return {
        id: 'color',
        title: 'ingredients.colorInfo',
        columns: 1,
        fields: [
            {
                key: 'color_code',
                label: 'common.colorCode',
                type: 'color' as const,
                defaultValue: '#FF4842',
                colors: COLOR_CODES,
            },
        ],
    };
}

function buildPictureSection(): CardSection {
    return {
        id: 'picture',
        title: 'ingredients.pictureInfo',
        columns: 1,
        fields: [
            {
                key: 'picture_url',
                label: 'common.pictureUrl',
                type: 'image' as const,
                defaultValue: null,
                height: 250,
            },
        ],
    };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

    // Form state for controlled mode
    const [formData, setFormData] = useState<Record<string, any>>({
        name: '',
        measurement: '',
        group_id: '',
        color: '#FF4842',
        image: null,
    });

    // Load ingredient if editing
    const { ingredient, ingredientLoading } = useGetIngredient(!isNew && id ? id : '');

    // Build group options
    const groupOptions = useMemo(
        () => ingredientGroups.map((g) => ({
            value: g.id,
            label: g.name,
        })),
        [ingredientGroups]
    );

    // Build sections
    const BASIC_INFO_SECTION_T = useMemo(() => translateSection(buildBasicInfoSection(), t), [t]);
    const GROUP_SECTION_T = useMemo(() => translateSection(buildGroupSection(groupOptions), t), [t, groupOptions]);
    const COLOR_SECTION_T = useMemo(() => translateSection(buildColorSection(), t), [t]);
    const IMAGE_SECTION_T = useMemo(() => translateSection(buildPictureSection(), t), [t]);

    // Handle form data changes (for controlled mode)
    const handleFormDataChange = useCallback(
        (newFormData: Record<string, any>) => {
            setFormData(newFormData);
        },
        []
    );

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                // Validate required fields
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

                // Small delay to ensure SWR cache is updated
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Clear form after successful creation
                if (isNew) {
                    setFormData({
                        name: '',
                        measurement: '',
                        group_id: '',
                        color: '#FF4842',
                        image: null,
                    });
                }

                // If onSuccess callback provided, call it instead of routing
                if (onSuccess) {
                    await onSuccess();
                } else {
                    router.push(paths.warehouse.ingredients.root);
                }
            } catch (err) {
                console.error('Error saving ingredient:', err);
                throw err;
            }
        },
        [isNew, id, t, createIngredient, updateIngredient, router, onSuccess]
    );

    // Handle delete
    const handleDelete = useCallback(
        async () => {
            try {
                if (id) {
                    await deleteIngredient(id);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    router.push(paths.warehouse.ingredients.root);
                }
            } catch (err) {
                console.error('Error deleting ingredient:', err);
                throw err;
            }
        },
        [id, deleteIngredient, router]
    );

    // Build config for GenericEditView
    const config: GenericEditViewConfig = useMemo(
        () => ({
            title: isNew ? t('ingredients.new') : t('ingredients.edit'),
            entityName: 'ingredient',
            showBreadcrumbs: false,
            breadcrumbs: [
                { name: t('app'), href: paths.menu.root },
                { name: t('ingredients.title'), href: paths.warehouse.ingredients.root },
                { name: isNew ? t('ingredients.new') : t('ingredients.edit'), href: '' },
            ],
            leftSidecard: IMAGE_SECTION_T,
            sections: [BASIC_INFO_SECTION_T, GROUP_SECTION_T, COLOR_SECTION_T],
            onSubmit: handleSubmit,
            onDelete: !isNew ? handleDelete : undefined,
            showDeleteButton: !isNew,
        }),
        [isNew, t, IMAGE_SECTION_T, BASIC_INFO_SECTION_T, GROUP_SECTION_T, COLOR_SECTION_T, handleSubmit, handleDelete]
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* BREADCRUMBS AND TITLE */}
                <CustomBreadcrumbs
                    heading={isNew ? t('ingredients.new') : t('ingredients.edit')}
                    links={config.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                <GenericEditView
                    config={config}
                    data={ingredient || undefined}
                    isNew={isNew}
                    loading={!isNew && ingredientLoading}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                />
            </Box>
        </Box>
    );
}

// ============================================================================
// WRAPPER FOR ROUTE INTEGRATION
// ============================================================================

export function IngredientEditViewWrapper({ isNew = false }: IngredientEditViewProps) {
    return <IngredientEditView isNew={isNew} />;
}
