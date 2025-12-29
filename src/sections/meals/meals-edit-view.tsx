// ============================================================================
// MEALS EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

// ============================================================================
// TYPES
// ============================================================================

export interface MealEditViewProps {
    meal?: Record<string, any>;
    isNew?: boolean;
}

// ============================================================================
// FIELD CONFIGS
// ============================================================================

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'mealsProducts.imageTitle',
    fields: [
        {
            key: 'image',
            label: 'mealsProducts.imageUrl',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'mealsProducts.basicTitle',
    columns: 1,
    fields: [
        {
            key: 'name',
            label: 'mealsProducts.name',
            type: 'text',
            required: true,
            defaultValue: '',
        },
        {
            key: 'section',
            label: 'mealsProducts.category',
            type: 'select',
            options: [
                { value: 'breakfast', label: 'mealsProducts.tushlik' },
                { value: 'lunch', label: 'mealsProducts.tushlik' },
                { value: 'dinner', label: 'mealsProducts.kechki' },
                { value: 'snack', label: 'mealsProducts.snack' },
            ],
            defaultValue: '',
        },
        {
            key: 'inventory',
            label: 'mealsProducts.inventory',
            type: 'select',
            options: [
                { value: 'breakfast', label: 'mealsProducts.tushlik' },
                { value: 'lunch', label: 'mealsProducts.tushlik' },
                { value: 'dinner', label: 'mealsProducts.kechki' },
                { value: 'snack', label: 'mealsProducts.snack' },
            ],
            defaultValue: '',
        },
   {
            key: 'name',
            label: 'mealsProducts.price',
            type: 'text',
            required: true,
            defaultValue: '',
        },
         {
            key: 'name',
            label: 'mealsProducts.cookingTime',
            type: 'text',
            required: true,
            defaultValue: '',
        },
         {
            key: 'name',
            label: 'mealsProducts.barcode',
            type: 'text',
            required: true,
            defaultValue: '',
        },
    ],
};

const NUTRITION_SECTION: CardSection = {
    id: 'nutrition',
    title: 'mealsProducts.nutritionTitle',
    columns: 2,
    fields: [
        {
            key: 'calories',
            label: 'mealsProducts.calories',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'protein',
            label: 'mealsProducts.protein',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'carbs',
            label: 'mealsProducts.carbs',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'fat',
            label: 'mealsProducts.fat',
            type: 'number',
            defaultValue: 0,
        },
    ],
};

const PRICE_SECTION: CardSection = {
    id: 'price',
    title: 'mealsProducts.priceTitle',
    columns: 2,
    fields: [
        {
            key: 'price',
            label: 'mealsProducts.price',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'discount',
            label: 'mealsProducts.discount',
            type: 'number',
            defaultValue: 0,
        },
    ],
};

const SETTINGS_SECTION: CardSection = {
    id: 'settings',
    title: 'mealsProducts.settingsTitle',
    columns: 2,
    fields: [
        {
            key: 'publish',
            label: 'mealsProducts.publish',
            type: 'select',
            options: [
                { value: 'published', label: 'mealsProducts.published' },
                { value: 'draft', label: 'mealsProducts.draft' },
            ],
            defaultValue: 'draft',
        },
        {
            key: 'isSpicy',
            label: 'mealsProducts.isSpicy',
            type: 'switch',
            defaultValue: false,
        },
        {
            key: 'isVegetarian',
            label: 'mealsProducts.isVegetarian',
            type: 'switch',
            defaultValue: false,
        },
        {
            key: 'isPopular',
            label: 'mealsProducts.isPopular',
            type: 'switch',
            defaultValue: false,
        },
    ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function MealEditView({ meal, isNew = false }: MealEditViewProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');

    // Create translated copies of sections so UI gets actual strings instead of raw keys
    const IMAGE_SECTION_T: CardSection = {
        ...IMAGE_SECTION,
        title: typeof IMAGE_SECTION.title === 'string' ? t(IMAGE_SECTION.title) : IMAGE_SECTION.title,
        fields: IMAGE_SECTION.fields.map((f) => ({
            ...f,
            label: typeof f.label === 'string' && f.label.startsWith('mealsProducts.') ? t(f.label) : f.label,
            placeholder: typeof f.placeholder === 'string' && f.placeholder.startsWith('mealsProducts.') ? t(f.placeholder) : f.placeholder,
        })),
    };

    const BASIC_INFO_SECTION_T: CardSection = {
        ...BASIC_INFO_SECTION,
        title: typeof BASIC_INFO_SECTION.title === 'string' ? t(BASIC_INFO_SECTION.title) : BASIC_INFO_SECTION.title,
        fields: BASIC_INFO_SECTION.fields.map((f) => ({
            ...f,
            label: typeof f.label === 'string' && f.label.startsWith('mealsProducts.') ? t(f.label) : f.label,
            options: Array.isArray(f.options)
                ? f.options.map((opt: any) => ({ ...opt, label: typeof opt.label === 'string' && opt.label.startsWith('mealsProducts.') ? t(opt.label) : opt.label }))
                : f.options,
        })),
    };

    const NUTRITION_SECTION_T: CardSection = {
        ...NUTRITION_SECTION,
        title: typeof NUTRITION_SECTION.title === 'string' ? t(NUTRITION_SECTION.title) : NUTRITION_SECTION.title,
        fields: NUTRITION_SECTION.fields.map((f) => ({
            ...f,
            label: typeof f.label === 'string' && f.label.startsWith('mealsProducts.') ? t(f.label) : f.label,
        })),
    };

    const PRICE_SECTION_T: CardSection = {
        ...PRICE_SECTION,
        title: typeof PRICE_SECTION.title === 'string' ? t(PRICE_SECTION.title) : PRICE_SECTION.title,
        fields: PRICE_SECTION.fields.map((f) => ({
            ...f,
            label: typeof f.label === 'string' && f.label.startsWith('mealsProducts.') ? t(f.label) : f.label,
        })),
    };

    const SETTINGS_SECTION_T: CardSection = {
        ...SETTINGS_SECTION,
        title: typeof SETTINGS_SECTION.title === 'string' ? t(SETTINGS_SECTION.title) : SETTINGS_SECTION.title,
        fields: SETTINGS_SECTION.fields.map((f) => ({
            ...f,
            label: typeof f.label === 'string' && f.label.startsWith('mealsProducts.') ? t(f.label) : f.label,
            options: Array.isArray(f.options)
                ? f.options.map((opt: any) => ({ ...opt, label: typeof opt.label === 'string' && opt.label.startsWith('mealsProducts.') ? t(opt.label) : opt.label }))
                : f.options,
        })),
    };

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                // TODO: Implement API call to save meal
                console.log('Saving meal:', formData);

                // After successful save, redirect to meal list
                router.push(paths.menu.meals.root);
            } catch (err) {
                console.log("Error saving meal:", err);
            }
        },
        [router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            // TODO: Implement API call to delete meal
            console.log('Deleting meal:', meal?.id);

            router.push(paths.menu.meals.root);
        } catch (err) {
            console.log("Error deleting meal:", err);
        }
    }, [meal?.id, router]);

    const config: GenericEditViewConfig = {
        title: t('mealsProducts.title'),
        entityName: 'meal',
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('mealsProducts.title'), href: paths.menu.meals.root },
            { name: isNew ? t('mealsProducts.new') : t('mealsProducts.edit'), href: '' },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [
            BASIC_INFO_SECTION_T,
            // NUTRITION_SECTION_T,
            // PRICE_SECTION_T,
            // SETTINGS_SECTION_T,
        ],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <GenericEditView
            config={config}
            data={meal}
            isNew={isNew}
        />
    );
}
