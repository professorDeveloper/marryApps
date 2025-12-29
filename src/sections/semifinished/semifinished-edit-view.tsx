// ============================================================================
// PRODUCT EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { TFunction } from 'i18next';
import type { ISemifinishedItem } from 'src/types/semifinished';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
    title: 'semifinishedProducts.imageTitle',
    fields: [
        {
            key: 'coverUrl',
            label: 'semifinishedProducts.imageUrl',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'semifinishedProducts.basicTitle',
    columns: 1,
    fields: [
        {
            key: 'name',
            label: 'semifinishedProducts.name',
            type: 'text',
            required: true,
            defaultValue: '',
        },
        {
            key: 'sku',
            label: 'semifinishedProducts.sku',
            type: 'text',
            defaultValue: '',
        },
        {
            key: 'code',
            label: 'semifinishedProducts.quantity',
            type: 'text',
            defaultValue: '',
        },
        {
            key: 'category',
            label: 'semifinishedProducts.category',
            type: 'text',
            defaultValue: '',
        },
    ],
};

const PRICING_SECTION: CardSection = {
    id: 'pricing',
    title: 'semifinishedProducts.pricingTitle',
    columns: 2,
    fields: [
        {
            key: 'price',
            label: 'semifinishedProducts.price',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'priceSale',
            label: 'semifinishedProducts.priceSale',
            type: 'number',
            defaultValue: null,
        },
        {
            key: 'taxes',
            label: 'semifinishedProducts.taxes',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'quantity',
            label: 'semifinishedProducts.quantity',
            type: 'number',
            defaultValue: 0,
        },
    ],
};

const COLORS_SECTION: CardSection = {
    id: 'colors',
    title: 'semifinishedProducts.colorsTitle',
    fields: [
        {
            key: 'colors',
            label: 'semifinishedProducts.selectColors',
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
    const { t } = useTranslation('menu');

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

    const IMAGE_SECTION_T = translateSection(IMAGE_SECTION, t);
    const BASIC_INFO_SECTION_T = translateSection(BASIC_INFO_SECTION, t);
    const PRICING_SECTION_T = translateSection(PRICING_SECTION, t);
    const COLORS_SECTION_T = translateSection(COLORS_SECTION, t);

    const config: GenericEditViewConfig = {
        title: t('semifinishedProducts.title', 'Product'),
        entityName: 'semifinished',
        breadcrumbs: [
            { name: t('overview.menu.title', 'Menu'), href: paths.menu.root },
            { name: t('semifinishedProducts.title', 'Product'), href: paths.menu.semifinished.root },
            { name: isNew ? t('new', 'New') : t('edit', 'Edit'), href: '' },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [
            BASIC_INFO_SECTION_T,
            // PRICING_SECTION_T,
            // COLORS_SECTION_T,
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

// Runtime helper: translate CardSection objects that may contain translation keys
function translateSection(section: CardSection, t: TFunction): CardSection {
    const mapped = { ...section } as CardSection;
    // translate title if it looks like a key
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
