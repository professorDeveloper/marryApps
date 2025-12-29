// ============================================================================
// MEALS EDIT VIEW - USING GENERIC EDIT COMPONENT
// ============================================================================

import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

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
    title: 'Taom rasmi',
    fields: [
        {
            key: 'image',
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
            label: 'Taom nomi',
            type: 'text',
            required: true,
            defaultValue: '',
        },
        {
            key: 'category',
            label: 'Toifa',
            type: 'select',
            options: [
                { value: 'breakfast', label: 'Nonushta' },
                { value: 'lunch', label: 'Tushlik' },
                { value: 'dinner', label: 'Kechki ovqat' },
                { value: 'snack', label: 'Zakuska' },
            ],
            defaultValue: '',
        },
        {
            key: 'description',
            label: 'Tavsifi',
            type: 'textarea',
            rows: 3,
            defaultValue: '',
        },
    ],
};

const NUTRITION_SECTION: CardSection = {
    id: 'nutrition',
    title: 'Oziqlanish ma\'lumotlari',
    columns: 2,
    fields: [
        {
            key: 'calories',
            label: 'Kalorilari',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'protein',
            label: 'Oqsil (g)',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'carbs',
            label: 'Uglevodlar (g)',
            type: 'number',
            defaultValue: 0,
        },
        {
            key: 'fat',
            label: 'Yog\' (g)',
            type: 'number',
            defaultValue: 0,
        },
    ],
};

const PRICE_SECTION: CardSection = {
    id: 'price',
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
            key: 'discount',
            label: 'Chegirma %',
            type: 'number',
            defaultValue: 0,
        },
    ],
};

const SETTINGS_SECTION: CardSection = {
    id: 'settings',
    title: 'Sozlamalar',
    columns: 2,
    fields: [
        {
            key: 'publish',
            label: 'Nashr qilish holati',
            type: 'select',
            options: [
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
            ],
            defaultValue: 'draft',
        },
        {
            key: 'isSpicy',
            label: 'Spicy',
            type: 'switch',
            defaultValue: false,
        },
        {
            key: 'isVegetarian',
            label: 'Vegetarian',
            type: 'switch',
            defaultValue: false,
        },
        {
            key: 'isPopular',
            label: 'Popular',
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
        title: 'Meal',
        entityName: 'meal',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Meals', href: paths.menu.meals.root },
            { name: isNew ? 'New' : 'Edit', href: '' },
        ],
        leftSidecard: IMAGE_SECTION,
        sections: [
            BASIC_INFO_SECTION,
            NUTRITION_SECTION,
            PRICE_SECTION,
            SETTINGS_SECTION,
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
