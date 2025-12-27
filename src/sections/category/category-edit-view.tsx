// ============================================================================
// CATEGORY EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { ICategory } from 'src/types/category';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryEditViewProps {
    category?: ICategory;
    isNew?: boolean;
}

// ============================================================================
// FIELD CONFIGS
// ============================================================================

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'Cover Image',
    fields: [
        {
            key: 'image',
            label: 'Image URL',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'Basic Information',
    columns: 2,
    fields: [
        {
            key: 'name',
            label: 'Category Name',
            type: 'text',
            required: true,
            defaultValue: '',
        },
        {
            key: 'slug',
            label: 'Slug',
            type: 'text',
            defaultValue: '',
        },
        {
            key: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            defaultValue: '',
        },
    ],
};

const SETTINGS_SECTION: CardSection = {
    id: 'settings',
    title: 'Settings',
    columns: 2,
    fields: [
        {
            key: 'publish',
            label: 'Publish Status',
            type: 'select',
            options: [
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
            ],
            defaultValue: 'draft',
        },
        {
            key: 'isFeatured',
            label: 'Featured',
            type: 'switch',
            defaultValue: false,
        },
    ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoryEditView({ category, isNew = false }: CategoryEditViewProps) {
    const router = useRouter();

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                // TODO: Implement API call to save category
                console.log('Saving category:', formData);

                // After successful save, redirect to category list
                router.push(paths.menu.category.root);
            } catch (err) {
                console.log("Error saving category:", err);
            }
        },
        [router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            // TODO: Implement API call to delete category
            console.log('Deleting category:', category?.id);

            router.push(paths.menu.category.root);
        } catch (err) {
            console.log("Error deleting category:", err);
        }
    }, [category?.id, router]);

    const config: GenericEditViewConfig = {
        title: 'Category',
        entityName: 'category',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Category', href: paths.menu.category.root },
            { name: isNew ? 'New' : 'Edit', href: '' },
        ],
        leftSidecard: IMAGE_SECTION,
        sections: [
            BASIC_INFO_SECTION,
            SETTINGS_SECTION,
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
