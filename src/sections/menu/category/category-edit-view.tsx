// ============================================================================
// CATEGORY EDIT VIEW - REAL API INTEGRATION
// ============================================================================

import type { TFunction } from 'i18next';
import type { ICategoryFormData } from 'src/types/category';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { mutate } from 'swr';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslationsAPI } from 'src/hooks/use-translations-api';

import { endpoints } from 'src/lib/axios';
import { useGetStorages, useGetDepartments } from 'src/actions/departments';
import { useGetCategory, useDeleteCategory, useCreateCategory, useUpdateCategory } from 'src/actions/categories';

import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryEditViewProps {
    categoryId?: string;
    isNew?: boolean;
}

// ============================================================================
// COLOR CODES - MOCK DATA
// ============================================================================

const COLOR_CODES = [
    '#f04438', // Error/Red
    '#2e90fa', // Info/Blue
    '#12b76a', // Success/Green
    '#f79009', // Warning/Yellow
    '#8E33FF', // Secondary/Violet
    '#ff4d1a', // Primary/Orange
    '#ff4d1a', // Accent Orange
    '#d92d20', // Danger/Dark Red
    '#fda29b', // Light Error
    '#84caff', // Light Info
    '#000000', // Black
    '#FFFFFF', // White
];

// ============================================================================
// FIELD CONFIGS
// ============================================================================

function buildImageSection(): CardSection {
    return {
        id: 'image',
        title: 'categories.imageTitle',
        fields: [
            {
                key: 'picture_url',
                label: 'categories.imageUrl',
                type: 'url',
                placeholder: 'https://example.com/image.jpg',
                defaultValue: '',
            },
        ],
    };
}

function buildBasicInfoSection(): CardSection {
    return {
        id: 'basic',
        title: 'categories.basicTitle',
        columns: 1,
        fields: [
            {
                key: 'name',
                label: 'categories.name',
                type: 'text',
                required: true,
                defaultValue: '',
                // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
            },
            {
                key: 'name_en',
                label: 'categories.nameEn',
                type: 'text',
                required: false,
                defaultValue: '',
            },
            {
                key: 'name_ru',
                label: 'categories.nameRu',
                type: 'text',
                required: false,
                defaultValue: '',
            },
            {
                key: 'color_code',
                label: 'departments.color',
                type: 'color',
                defaultValue: '#f04438',
                colors: COLOR_CODES,
            },
        ],
    };
}

function buildStorageAndDepartmentSection(
    storageOptions: Array<{ value: string; label: string }>,
    departmentOptions: Array<{ value: string; label: string }>
): CardSection {
    return {
        id: 'storage_department',
        title: 'categories.storageDepartmentTitle',
        columns: 2,
        fields: [
            // {
            //     key: 'storage_id',
            //     label: 'categories.storage',
            //     type: 'select',
            //     required: true,
            //     options: storageOptions,
            //     defaultValue: '',
            // },
            {
                key: 'department_id',
                label: 'categories.department',
                type: 'select',
                required: true,
                options: departmentOptions,
                defaultValue: '',
            },
        ],
    };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoryEditView({ categoryId, isNew = false }: CategoryEditViewProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');

    // API hooks
    const { category } = useGetCategory(categoryId || '');
    const { createCategory } = useCreateCategory();
    const { updateCategory } = useUpdateCategory();
    const { deleteCategory } = useDeleteCategory();
    const { createTranslation, updateTranslation } = useTranslationsAPI();
    const { departments } = useGetDepartments();
    const { storages } = useGetStorages();

    const [isSaving, setIsSaving] = useState(false);

    // Build storage options
    const storageOptions = useMemo(
        () => (Array.isArray(storages) ? storages.map((s) => ({
            value: s.id,
            label: s.name || s.id,
        })) : []),
        [storages]
    );

    // Build department options
    const departmentOptions = useMemo(
        () => (Array.isArray(departments) ? departments.map((d) => ({
            value: d.id,
            label: d.name || d.id,
        })) : []),
        [departments]
    );

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                setIsSaving(true);

                // Validate required fields
                if (!formData.name || !formData.name.trim()) {
                    throw new Error(t('categories.nameRequired'));
                }
                // if (!formData.storage_id) {
                //     throw new Error(t('categories.storageRequired'));
                // }
                if (!formData.department_id) {
                    throw new Error(t('categories.departmentRequired'));
                }

                // Create or update translation if translations are provided
                let name_i18n = formData.name_i18n;
                if (formData.name_en || formData.name_ru || formData.name) {
                    // Create translation with provided language-specific names
                    // name field is always Uzbek (uz), so use it as uz translation
                    const translationData: any = {
                        en: formData.name_en || '',
                        ru: formData.name_ru || '',
                        uz: formData.name || '', // Primary name is always Uzbek
                    };

                    if (!isNew && name_i18n) {
                        // Update existing translation when editing
                        await updateTranslation(name_i18n, translationData);
                        // Revalidate translations cache to reflect the update immediately
                        await mutate(endpoints.translations.list);
                    } else if (isNew && !name_i18n) {
                        // Create new translation when creating
                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    }
                }

                const categoryData: ICategoryFormData = {
                    name: formData.name,
                    name_i18n,
                    picture_url: formData.picture_url,
                    storage_id: formData.storage_id,
                    department_id: formData.department_id,
                    color_code: formData.color_code || '',
                };

                if (isNew) {
                    await createCategory(categoryData);
                    // Revalidate categories list to show the new category
                    await mutate(endpoints.category.list);
                    await mutate(endpoints.translations.list);
                } else if (categoryId) {
                    await updateCategory(categoryId, categoryData);
                    // Revalidate category cache to reflect the update immediately
                    await mutate(endpoints.category.details(categoryId));
                    await mutate(endpoints.category.list);
                }

                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, 300));
                router.push(paths.menu.category.root);
            } catch (err) {
                console.error('Error saving category:', err);
                setIsSaving(false);
                throw err;
            }
        },
        [isNew, categoryId, createCategory, updateCategory, router, t, createTranslation, updateTranslation]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            if (categoryId) {
                await deleteCategory(categoryId);
                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push(paths.menu.category.root);
            }
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    }, [categoryId, deleteCategory, router]);

    // Build sections
    const IMAGE_SECTION_T = translateSection(buildImageSection(), t);
    const BASIC_INFO_SECTION_T = translateSection(buildBasicInfoSection(), t);
    const STORAGE_SECTION_T = translateSection(
        buildStorageAndDepartmentSection(storageOptions, departmentOptions),
        t
    );

    const config: GenericEditViewConfig = {
        title: isNew ? t('categories.new') : t('categories.edit'),
        entityName: 'category',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('categories.title'), href: paths.menu.category.root },
            { name: isNew ? t('categories.new') : t('categories.edit'), href: '' },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [
            BASIC_INFO_SECTION_T,
            STORAGE_SECTION_T,
        ],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                <GenericEditView
                    config={config}
                    data={category}
                    isNew={isNew}
                />
            </Box>
        </Box>
    );
}

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
                    label: typeof opt.label === 'string' && opt.label.includes('.')
                        ? t(opt.label as string, opt.label as string)
                        : opt.label
                }));
            }
            if (nf.colors && Array.isArray(nf.colors)) {
                // Colors array doesn't need translation
            }
            return nf;
        });
    }
    return mapped;
}

// ============================================================================
// WRAPPER COMPONENT - EXTRACTS :id FROM ROUTE PARAMS
// ============================================================================

export function CategoryEditViewWrapper({ isNew = false }: { isNew?: boolean }) {
    const { id } = useParams<{ id?: string }>();

    return (
        <CategoryEditView
            categoryId={id}
            isNew={isNew}
        />
    );
}
