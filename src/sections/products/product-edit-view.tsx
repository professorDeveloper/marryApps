// ============================================================================
// PRODUCT EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { IProductItem } from 'src/types/product';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductEditViewProps {
    product?: IProductItem;
    isNew?: boolean;
}

// ============================================================================
// FIELD CONFIGS
// ============================================================================

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
    columns: 1,
    fields: [
        {
            key: 'name',
            label: 'Ichimliklar',
            type: 'text',
            required: true,
            defaultValue: '',
        },
        {
            key: 'name',
            label: 'Ichimliklar ombori',
            type: 'text',
            required: true,
            defaultValue: '',
        },
    ],
};

const PRICING_SECTION: CardSection = {
    id: 'pricing',
    title: 'Narxlash',
    columns: 1,
    fields: [
        {
            key: 'price',
            label: 'Narx',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'priceSale',
            label: 'Sotuvning narxi',
            type: 'number',
            defaultValue: null,
        },
        {
            key: 'taxes',
            label: 'Vergilari',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'quantity',
            label: 'Miqdor',
            type: 'number',
            defaultValue: 0,
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
    columns: 1,
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
            label: 'For Male',
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

export function ProductEditView({ product, isNew = false }: ProductEditViewProps) {
    const router = useRouter();

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                // TODO: Implement API call to save product
                console.log('Saving product:', formData);

                // After successful save, redirect to product list
                router.push(paths.menu.product.root);
            } catch (err) {
                console.log("Error saving product:", err);
            }
        },
        [router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            // TODO: Implement API call to delete product
            console.log('Deleting product:', product?.id);

            router.push(paths.menu.product.root);
        } catch (err) {
            console.log("Error deleting product:", err);
        }
    }, [product?.id, router]);

    const config: GenericEditViewConfig = {
        title: 'Product',
        entityName: 'product',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Product', href: paths.menu.product.root },
            { name: isNew ? 'New' : 'Edit', href: '' },
        ],
        leftSidecard: IMAGE_SECTION,
        sections: [
            BASIC_INFO_SECTION,
            COLORS_SECTION,
        ],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <GenericEditView
            config={config}
            data={product}
            isNew={isNew}
        />
    );
}
