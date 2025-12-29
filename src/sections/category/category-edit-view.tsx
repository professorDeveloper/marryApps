// ============================================================================
// CATEGORY EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { TFunction } from 'i18next';
import type { ICategory } from 'src/types/category';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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

const COLOR_OPTIONS = [
    '#000000',
    '#FFFFFF',
    '#EF4444',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#6B7280',
    '#14B8A6',
    '#F97316',
];

// ============================================================================
// FIELD CONFIGS
// ============================================================================

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'categories.imageTitle',
    fields: [
        {
            key: 'image',
            label: 'categories.imageUrl',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

const BASIC_INFO_SECTION: CardSection = {
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
            key: 'slug',
            label: 'categories.slug',
            type: 'text',
            defaultValue: '',
        },
        {
            key: 'description',
            label: 'categories.inventory',
            type: 'textarea',
            rows: 1,
            defaultValue: '',
        },
    ],
};


const COLORS_SECTION: CardSection = {
    id: 'colors',
    title: 'Ranglar',
    fields: [
        {
            key: 'colors',
            label: 'Ranglarni tanlang',
            type: 'color',
            colors: COLOR_OPTIONS,
            defaultValue: COLOR_OPTIONS[0],
        },
    ],
};
// const SETTINGS_SECTION: CardSection = {
//     id: 'settings',
//     title: 'categories.settingsTitle',
//     columns: 2,
//     fields: [
//         {
//             key: 'publish',
//             label: 'categories.publish',
//             type: 'select',
//             options: [
//                 { value: 'published', label: 'categories.published' },
//                 { value: 'draft', label: 'categories.draft' },
//             ],
//             defaultValue: 'draft',
//         },
//         {
//             key: 'isFeatured',
//             label: 'categories.isFeatured',
//             type: 'switch',
//             defaultValue: false,
//         },
//     ],
// };

// ============================================================================
// COMPONENT
// ============================================================================

export function CategoryEditView({ category, isNew = false }: CategoryEditViewProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');

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

    const IMAGE_SECTION_T = translateSection(IMAGE_SECTION, t);
    const BASIC_INFO_SECTION_T = translateSection(BASIC_INFO_SECTION, t);
    const SETTINGS_SECTION_T = translateSection(COLORS_SECTION, t);

    const config: GenericEditViewConfig = {
        title: t('categories.title', 'Category'),
        entityName: 'category',
        breadcrumbs: [
            { name: t('overview.menu.title', 'Menu'), href: paths.menu.root },
            { name: t('categories.title', 'Category'), href: paths.menu.category.root },
            { name: isNew ? t('new', 'New') : t('edit', 'Edit'), href: '' },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [
            BASIC_INFO_SECTION_T,
            SETTINGS_SECTION_T,
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
                nf.options = nf.options.map((opt) => ({ ...opt, label: typeof opt.label === 'string' && opt.label.includes('.') ? t(opt.label as string, opt.label as string) : opt.label }));
            }
            return nf;
        });
    }
    return mapped;
}
