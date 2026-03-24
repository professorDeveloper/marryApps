import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import type { SyntheticEvent } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo, useEffect, useRef, startTransition } from 'react';
import { mutate } from 'swr';
import { Box, Tabs, Tab } from '@mui/material';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { endpoints } from 'src/lib/axios';
import {
    useGetMeal,
    useGetMealWithCalculations,
    useUpdateMealWithCalculations,
    useDeleteMeal,
    useCreateMealWithCalculations,
} from 'src/hooks/use-meals';
import { useGetCategories } from 'src/actions/categories';
import { useGetDepartments } from 'src/actions/departments';
import { useTranslationsAPI } from 'src/hooks/use-translations-api';
import { GenericEditView } from 'src/components/generic-edit-view';
import ProductCalculator from 'src/components/generic-edit-view/edit-calculation';


export interface MealEditViewProps {
    isNew?: boolean;
}

const mapCalculationsToPending = (
    calculations?: Array<{
        ingredient_id: string;
        component_compound_id?: string;
        quantity: string;
    }>
) => ({
    ingredient_calculations: calculations
        ?.filter((calculation) => calculation.ingredient_id && !calculation.component_compound_id)
        .map((calculation) => ({
            ingredient_id: calculation.ingredient_id,
            quantity: String(calculation.quantity),
        })) || [],
    compound_calculations: calculations
        ?.filter((calculation) => calculation.component_compound_id)
        .map((calculation) => ({
            compound_id: calculation.component_compound_id!,
            quantity: String(calculation.quantity),
        })) || [],
});

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'mealsProducts.imageTitle',
    fields: [
        {
            key: 'picture_url',
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
            // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
        },
        {
            key: 'name_en',
            label: 'mealsProducts.nameEn',
            type: 'text',
            required: false,
            defaultValue: '',
        },
        {
            key: 'name_ru',
            label: 'mealsProducts.nameRu',
            type: 'text',
            required: false,
            defaultValue: '',
        },
        {
            key: 'description',
            label: 'mealsProducts.description',
            type: 'textarea',
            required: false,
            defaultValue: '',
        },
        {
            key: 'category_id',
            label: 'mealsProducts.category',
            type: 'select',
            options: [], // Will be populated dynamically
            required: true,
            defaultValue: '',
        },
        // {
        //     key: 'department_id',
        //     label: 'mealsProducts.department',
        //     type: 'select',
        //     options: [], // Will be populated dynamically
        //     required: true,
        //     defaultValue: '',
        // },
        {
            key: 'price',
            label: 'mealsProducts.price',
            type: 'number',
            required: true,
        },
        {
            key: 'cook_time',
            label: 'mealsProducts.cookingTime',
            type: 'number',
            required: false,
        },
    ],
};


interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    keepMounted?: boolean;
    value: number;
}

function TabPanel({ children, value, index, keepMounted = false }: TabPanelProps) {
    const [hasBeenActive, setHasBeenActive] = useState(keepMounted && value === index);

    useEffect(() => {
        if (keepMounted && value === index) {
            setHasBeenActive(true);
        }
    }, [keepMounted, value, index]);

    if (!keepMounted && value !== index) {
        return null;
    }

    if (keepMounted && !hasBeenActive) {
        return null;
    }

    return (
        <div
            role="tabpanel"
            style={{ display: value === index ? 'block' : 'none' }}
        >
            {children}
        </div>
    );
}

export function MealEditView({ isNew = false }: MealEditViewProps) {
    const { id: mealId } = useParams<{ id: string }>();
    const router = useRouter();
    const { t, i18n } = useTranslation('menu');

    // SWR hooks
    const { meal, mealLoading } = useGetMeal(isNew ? '' : mealId || '');
    const { mealWithCalculations } = useGetMealWithCalculations(isNew ? undefined : mealId || undefined);
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();
    const { createMealWithCalculations } = useCreateMealWithCalculations();
    const { updateMealWithCalculations } = useUpdateMealWithCalculations();
    const { deleteMeal } = useDeleteMeal();
    const { createTranslation, updateTranslation } = useTranslationsAPI();

    const [activeTab, setActiveTab] = useState(0);
    // Store form data at parent level to preserve across tab changes
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [formTabData, setFormTabData] = useState<Record<string, any>>();
    // Track pending calculations when entity is created
    const pendingCalculationsRef = useRef<{
        ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
        compound_calculations?: Array<{ compound_id: string; quantity: string }>;
    } | null>(null);

    const loading = !isNew && mealLoading;

    const handleTabChange = useCallback((_: SyntheticEvent, newValue: number) => {
        if (newValue === 0) {
            setFormTabData(
                Object.keys(formData).length > 0
                    ? formData
                    : (meal || undefined)
            );
        }

        startTransition(() => {
            setActiveTab(newValue);
        });
    }, [formData, meal]);

    // Effective meal ID - either from URL params or fetched meal
    const effectiveMealId = mealId || meal?.id;

    // Initialize form data when meal is loaded
    useEffect(() => {
        if (meal && Object.keys(meal).length > 0) {
            // Ensure translation fields are always present
            const enrichedMeal = {
                name_en: '',
                name_ru: '',
                description_en: '',
                description_ru: '',
                ...meal,
            };
            setFormData(enrichedMeal);
            setFormTabData(enrichedMeal);
        } else if (isNew && (!formData || Object.keys(formData).length === 0)) {
            // Initialize empty form for new meal
            const initialData: Record<string, any> = {
                name: '',
                name_en: '',
                name_ru: '',
                description: '',
                description_en: '',
                description_ru: '',
                category_id: '',
                department_id: '',
                price: '',
                cook_time: '',
                picture_url: '',
            };
            setFormData(initialData);
            setFormTabData(initialData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meal, isNew]);

    useEffect(() => {
        if (!mealWithCalculations?.calculations) return;

        pendingCalculationsRef.current = mapCalculationsToPending(
            mealWithCalculations.calculations.map((calculation) => ({
                ingredient_id: calculation.ingredient_id,
                component_compound_id: calculation.component_compound_id,
                quantity: calculation.quantity,
            }))
        );
    }, [mealWithCalculations]);

    const handleFormDataChange = useCallback((nextFormData: Record<string, any>) => {
        setFormData(nextFormData);
    }, []);

    // Auto-set department_id when category changes
    useEffect(() => {
        if (formData.category_id && Array.isArray(categories)) {
            const selectedCategory = categories.find((cat: any) => cat.id === formData.category_id);
            if (selectedCategory && selectedCategory.department_id) {
                setFormData((prev) => ({
                    ...prev,
                    department_id: selectedCategory.department_id,
                }));
            }
        }
    }, [formData.category_id, categories]);

    // Helper function to get translated name based on current language
    const getTranslatedName = useCallback((item: any) => {
        const currentLang = i18n.language || 'uz';
        let displayName = item.name || '-';

        if (currentLang === 'en' && item.name_en) {
            displayName = item.name_en;
        } else if (currentLang === 'ru' && item.name_ru) {
            displayName = item.name_ru;
        } else if ((currentLang === 'uz' || currentLang === 'uz-Latn' || currentLang === 'uz-Cyrl') && item.name_uz) {
            displayName = item.name_uz;
        }

        return displayName;
    }, [i18n.language]);

    // Create translated copies of sections
    const IMAGE_SECTION_T: CardSection = {
        ...IMAGE_SECTION,
        title: t(IMAGE_SECTION.title),
        fields: IMAGE_SECTION.fields.map((f) => ({
            ...f,
            label: t(f.label),
            placeholder: f.placeholder ? t(f.placeholder) : undefined,
        })),
    };

    const BASIC_INFO_SECTION_T: CardSection = useMemo(() => ({
        ...BASIC_INFO_SECTION,
        title: t(BASIC_INFO_SECTION.title),
        fields: BASIC_INFO_SECTION.fields.map((f) => {
            // Map categories to options with translations
            if (f.key === 'category_id') {
                return {
                    ...f,
                    label: t(f.label),
                    options: Array.isArray(categories) ? categories.map((cat: any) => ({
                        value: cat.id,
                        label: getTranslatedName(cat),
                    })) : [],
                };
            }

            // Map departments to options with translations
            if (f.key === 'department_id') {
                return {
                    ...f,
                    label: t(f.label),
                    options: Array.isArray(departments) ? departments.map((dept: any) => ({
                        value: dept.id,
                        label: getTranslatedName(dept),
                    })) : [],
                };
            }

            // Translate other options
            if (Array.isArray(f.options) && f.options.length > 0) {
                return {
                    ...f,
                    label: t(f.label),
                    options: f.options.map((opt) => ({
                        ...opt,
                        label: t(opt.label),
                    })),
                };
            }

            return {
                ...f,
                label: t(f.label),
                placeholder: f.placeholder ? t(f.placeholder) : undefined,
            };
        }),
    }), [t, categories, departments, getTranslatedName]);

    // Handle form submission
    const handleSubmit = useCallback(
        async (submitFormData: Record<string, any>) => {
            try {
                if (isNew) {
                    let name_i18n = submitFormData.name_i18n;
                    if (!name_i18n) {
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '', // Primary name is always Uzbek
                        };

                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    } else if (submitFormData.name_en || submitFormData.name_ru || submitFormData.name) {
                        // Update existing translation if it exists and data changed
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '',
                        };
                        await updateTranslation(name_i18n, translationData);
                        await mutate(endpoints.translations.list);
                    }

                    // Create description translation if provided
                    let description_i18n: string | undefined = submitFormData.description_i18n;
                    if (!description_i18n && (submitFormData.description_en || submitFormData.description_ru)) {
                        const descriptionTranslationData: any = {
                            en: submitFormData.description_en || submitFormData.description || '',
                            ru: submitFormData.description_ru || submitFormData.description || '',
                            uz: submitFormData.description || '',
                        };
                        const descriptionTranslationResult = await createTranslation(descriptionTranslationData);
                        description_i18n = descriptionTranslationResult.id;
                    }

                    const pendingCalculations = pendingCalculationsRef.current;

                    await createMealWithCalculations({
                        good: {
                            ...submitFormData,
                            name_i18n,
                            description_i18n,
                        },
                        ingredient_calculations: pendingCalculations?.ingredient_calculations,
                        compound_calculations: pendingCalculations?.compound_calculations,
                    });

                    router.push(paths.menu.meals.root);
                } else if (mealId) {
                    // Update existing meal
                    let name_i18n = submitFormData.name_i18n;
                    if (!name_i18n && (submitFormData.name_en || submitFormData.name_ru)) {
                        // Create translation if provided
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '',
                        };
                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    } else if (name_i18n && (submitFormData.name_en || submitFormData.name_ru || submitFormData.name)) {
                        // Update existing translation when editing
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '',
                        };
                        await updateTranslation(name_i18n, translationData);
                        await mutate(endpoints.translations.list);
                    }

                    let description_i18n: string | undefined = submitFormData.description_i18n;
                    if (!description_i18n && (submitFormData.description_en || submitFormData.description_ru)) {
                        const descriptionTranslationData: any = {
                            en: submitFormData.description_en || submitFormData.description || '',
                            ru: submitFormData.description_ru || submitFormData.description || '',
                            uz: submitFormData.description || '',
                        };
                        const descriptionTranslationResult = await createTranslation(descriptionTranslationData);
                        description_i18n = descriptionTranslationResult.id;
                    }

                    const pendingCalculations = pendingCalculationsRef.current;

                    await updateMealWithCalculations(mealId, {
                        good: {
                            ...submitFormData,
                            name_i18n,
                            description_i18n,
                        },
                        ingredient_calculations: pendingCalculations?.ingredient_calculations,
                        compound_calculations: pendingCalculations?.compound_calculations,
                    });

                    router.push(paths.menu.meals.root);
                }
            } catch (err) {
                console.log("Error saving meal:", err);
            }
        },
        [isNew, mealId, createMealWithCalculations, createTranslation, updateTranslation, updateMealWithCalculations, router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!mealId) return;
        try {
            await deleteMeal(mealId);
            router.push(paths.menu.meals.root);
        } catch (err) {
            console.log("Error deleting meal:", err);
        }
    }, [mealId, deleteMeal, router]);

    const config: GenericEditViewConfig = {
        title: isNew ? t('mealsProducts.new') : t('mealsProducts.edit'),
        entityName: 'meal',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('mealsProducts.title'), href: paths.menu.meals.root },
            { name: isNew ? t('mealsProducts.new') : t('mealsProducts.edit'), href: '' },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [BASIC_INFO_SECTION_T],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };



    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* BREADCRUMBS AND TITLE */}
                <CustomBreadcrumbs
                    heading={isNew ? t('mealsProducts.new') : t('mealsProducts.edit')}
                    links={config.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                {/* TABS */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0, width: '100%' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            px: 0,
                            width: '100%',
                            minHeight: 48,
                            '.MuiTabs-flexContainer': {
                                width: '100%'
                            }
                        }}
                        variant="fullWidth"
                    >
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('mealsProducts.edit') || 'Asosiy'}
                            id="meal-tab-0"
                            aria-controls="meal-tabpanel-0"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('mealsProducts.calculate') || 'Hisoblash'}
                            id="meal-tab-1"
                            aria-controls="meal-tabpanel-1"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('mealsProducts.modifiers') || 'Modifikatorlar'}
                            id="meal-tab-2"
                            aria-controls="meal-tabpanel-2"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('mealsProducts.related') || 'Tegishli taomlar'}
                            id="meal-tab-3"
                            aria-controls="meal-tabpanel-3"
                        />
                    </Tabs>
                </Box>

                {/* TAB CONTENT */}
                <TabPanel value={activeTab} index={0}>
                    <GenericEditView
                        config={config}
                        data={formTabData || meal || undefined}
                        onFormDataChange={handleFormDataChange}
                        isNew={isNew}
                        loading={loading}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1} keepMounted>
                    {isNew ? (
                        <ProductCalculator
                            mealId={effectiveMealId}
                            // showTotalsSummary={true}
                            onCalculationsReady={(calculations) => {
                                // Store calculations for when save is clicked
                                pendingCalculationsRef.current = calculations;
                            }}
                        />
                    ) : (
                        <ProductCalculator
                            mealId={effectiveMealId}
                            // showTotalsSummary={true}
                            onCalculationsReady={(calculations) => {
                                // Store calculations for when save is clicked
                                pendingCalculationsRef.current = calculations;
                            }}
                        />
                    )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Modifikatorlar bo'limi (hali qo'shilmagan)
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Tegishli taomlar bo'limi (hali qo'shilmagan)
                    </Box>
                </TabPanel>
            </Box>
        </Box>
    );
}
