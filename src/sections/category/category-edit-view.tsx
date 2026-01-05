// ============================================================================
// CATEGORY EDIT VIEW - REAL API INTEGRATION
// ============================================================================

import type { TFunction } from 'i18next';
import type { ICategoryFormData } from 'src/types/category';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetStorages, useGetDepartments } from 'src/actions/departments';
import { useGetCategory, useCreateCategory, useUpdateCategory, useDeleteCategory } from 'src/actions/categories';

import { GenericEditView } from 'src/components/generic-edit-view';

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryEditViewProps {
    categoryId?: string;
    isNew?: boolean;
}

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
            },
            {
                key: 'name_i18n',
                label: 'categories.name_i18n',
                type: 'text',
                defaultValue: '',
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
            {
                key: 'storage_id',
                label: 'categories.storage',
                type: 'select',
                options: storageOptions,
                defaultValue: '',
            },
            {
                key: 'department_id',
                label: 'categories.department',
                type: 'select',
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
    const { category, categoryLoading } = useGetCategory(categoryId || '');
    const { createCategory } = useCreateCategory();
    const { updateCategory } = useUpdateCategory();
    const { deleteCategory } = useDeleteCategory();
    const { departments } = useGetDepartments();
    const { storages } = useGetStorages();

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Build storage options
    const storageOptions = useMemo(
        () => storages.map((s) => ({
            value: s.id,
            label: s.name || s.id,
        })),
        [storages]
    );

    // Build department options
    const departmentOptions = useMemo(
        () => departments.map((d) => ({
            value: d.id,
            label: d.name || d.id,
        })),
        [departments]
    );

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                setIsSaving(true);

                const categoryData: ICategoryFormData = {
                    name: formData.name,
                    name_i18n: formData.name_i18n,
                    picture_url: formData.picture_url,
                    storage_id: formData.storage_id,
                    department_id: formData.department_id,
                };

                if (isNew) {
                    await createCategory(categoryData);
                } else if (categoryId) {
                    await updateCategory(categoryId, categoryData);
                }

                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push(paths.menu.category.root);
            } catch (err) {
                console.error('Error saving category:', err);
                setIsSaving(false);
            }
        },
        [isNew, categoryId, createCategory, updateCategory, router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            setIsDeleting(true);

            if (categoryId) {
                await deleteCategory(categoryId);
                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise(resolve => setTimeout(resolve, 500));
                router.push(paths.menu.category.root);
            }
        } catch (err) {
            console.error('Error deleting category:', err);
            setIsDeleting(false);
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
        title: isNew ? t('categories.addTitle', 'Add Category') : category?.name || t('categories.editTitle', 'Edit Category'),
        entityName: 'category',
        breadcrumbs: [
            { name: t('overview.menu.title', 'Menu'), href: paths.menu.root },
            { name: t('categories.title', 'Category'), href: paths.menu.category.root },
            { name: isNew ? t('add', 'Add') : t('edit', 'Edit'), href: '' },
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
        <GenericEditView
            config={config}
            data={category}
            isNew={isNew}
        />
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
