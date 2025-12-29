// ============================================================================
// PRODUCT EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { ISemifinishedItem } from 'src/types/semifinished';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

// ============================================================================
// TYPES
// ============================================================================

export interface SemifinishedEditViewProps {
    semifinished?: ISemifinishedItem;
    isNew?: boolean;
}

// ============================================================================
// FIELD CONFIGS
// ============================================================================

const COLOR_OPTIONS = [
    '#FFFFFF',
    '#000000',
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

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'Qopqog\' rasmi',
    fields: [
        {
            key: 'coverUrl',
            label: 'Rasm URL\'si',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'Asosiy ma\'lumotlar',
    columns: 2,
    fields: [
        {
            key: 'name',
            label: 'Mahsulot nomi',
            type: 'text',
            required: true,
            defaultValue: '',
        },
        {
            key: 'sku',
            label: 'SKU',
            type: 'text',
            defaultValue: '',
        },
        {
            key: 'code',
            label: 'Kod',
            type: 'text',
            defaultValue: '',
        },
        {
            key: 'category',
            label: 'Toifa',
            type: 'text',
            defaultValue: '',
        },
    ],
};

const PRICING_SECTION: CardSection = {
    id: 'pricing',
    title: 'Narxlash',
    columns: 2,
    fields: [
        {
            key: 'price',
            label: 'Narx',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'priceSale',
            label: 'Sale Price',
            type: 'number',
            defaultValue: null,
        },
        {
            key: 'taxes',
            label: 'Taxes',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'quantity',
            label: 'Quantity',
            type: 'number',
            defaultValue: 0,
        },
    ],
};

const COLORS_SECTION: CardSection = {
    id: 'colors',
    title: 'Colors',
    fields: [
        {
            key: 'colors',
            label: 'Select Colors',
            type: 'color',
            colors: COLOR_OPTIONS,
            defaultValue: [],
        },
    ],
};

// const DESCRIPTIONS_SECTION: CardSection = {
//     id: 'descriptions',
//     title: 'Tavsiflar',
//     fields: [
//         {
//             key: 'description',
//             label: 'Tavsifi',
//             type: 'textarea',
//             rows: 4,
//             defaultValue: '',
//         },
//         {
//             key: 'subDescription',
//             label: 'Qo\'shimcha tavsif',
//             type: 'textarea',
//             rows: 2,
//             defaultValue: '',
//         },
//     ],
// };

const ADVANCED_SECTION: CardSection = {
    id: 'advanced',
    title: 'Qo\'shimcha variantlar',
    fields: [
        {
            key: 'sizes',
            label: 'O\'lchamlar (vergul bilan ajratilgan)',
            type: 'text',
            placeholder: 'S, M, L, XL',
            defaultValue: [],
        },
        {
            key: 'tags',
            label: 'Teglar (vergul bilan ajratilgan)',
            type: 'text',
            placeholder: 'elektronika, populyar, yangi',
            defaultValue: [],
        },
        {
            key: 'gender',
            label: 'Erkaklar uchun',
            type: 'switch',
            defaultValue: false,
        },
        {
            key: 'gender',
            label: 'For Female',
            type: 'switch',
            defaultValue: false,
        },
    ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SemifinishedEditView({ semifinished, isNew = false }: SemifinishedEditViewProps) {
    const router = useRouter();

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                // TODO: Implement API call to save semifinished
                console.log('Saving semifinished:', formData);

                // After successful save, redirect to semifinished list
                router.push(paths.menu.semifinished.root);
            } catch (err) {
                console.log("Error saving semifinished:", err);
            }
        },
        [router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            // TODO: Implement API call to delete semifinished
            console.log('Deleting semifinished:', semifinished?.id);

            router.push(paths.menu.semifinished.root);
        } catch (err) {
            console.log("Error deleting semifinished:", err);
        }
    }, [semifinished?.id, router]);

    const config: GenericEditViewConfig = {
        title: 'Product',
        entityName: 'semifinished',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Product', href: paths.menu.semifinished.root },
            { name: isNew ? 'New' : 'Edit', href: '' },
        ],
        leftSidecard: IMAGE_SECTION,
        sections: [
            BASIC_INFO_SECTION,
            // PRICING_SECTION,
            COLORS_SECTION,
            // DESCRIPTIONS_SECTION,
            // ADVANCED_SECTION,
        ],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <GenericEditView
            config={config}
            data={semifinished}
            isNew={isNew}
        />
    );
}
