import type { IMealsItem } from 'src/types/meals';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useGetMeal, useCreateMeal, useUpdateMeal, useDeleteMeal, useCreateMealWithCalculations, useUpdateMealWithCalculations } from 'src/hooks/use-meals';
import { useGetCategories } from 'src/actions/categories';
import { useGetDepartments } from 'src/actions/departments';
import { useTranslationsAPI } from 'src/hooks/use-translations-api';
import { GenericEditView } from 'src/components/generic-edit-view';
import ProductCalculator from 'src/components/generic-edit-view/edit-calculation';


export interface MealEditViewProps {
    isNew?: boolean;
}

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
        {
            key: 'department_id',
            label: 'mealsProducts.department',
            type: 'select',
            options: [], // Will be populated dynamically
            required: true,
            defaultValue: '',
        },
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
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`meal-tabpanel-${index}`}
            aria-labelledby={`meal-tab-${index}`}
            {...other}
        >
            <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>
                {children}
            </Box>
        </div>
    );
}

export function MealEditView({ isNew = false }: MealEditViewProps) {
    const { id: mealId } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation('menu');

    // SWR hooks
    const { meal, mealLoading } = useGetMeal(isNew ? '' : mealId || '');
    const { categories } = useGetCategories();
    const { departments } = useGetDepartments();
    const { createMeal } = useCreateMeal();
    const { createMealWithCalculations } = useCreateMealWithCalculations();
    const { updateMealWithCalculations } = useUpdateMealWithCalculations();
    const { updateMeal } = useUpdateMeal();
    const { deleteMeal } = useDeleteMeal();
    const { createTranslation } = useTranslationsAPI();

    const [activeTab, setActiveTab] = useState(0);
    // Store form data at parent level to preserve across tab changes
    const [formData, setFormData] = useState<Record<string, any>>({});
    // Track the created meal ID for new items
    const [createdMealId, setCreatedMealId] = useState<string | undefined>(undefined);
    // Track pending calculations when entity is created
    const pendingCalculationsRef = useRef<{
        ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
        compound_calculations?: Array<{ compound_id: string; quantity: string }>;
    } | null>(null);

    const loading = !isNew && mealLoading;

    // Effective meal ID - either from URL params, fetched meal, or newly created
    const effectiveMealId = mealId || meal?.id || createdMealId;

    // Initialize form data when meal is loaded
    useEffect(() => {
        if (meal && Object.keys(meal).length > 0) {
            setFormData(meal);
        } else if (isNew && (!formData || Object.keys(formData).length === 0)) {
            // Initialize empty form for new meal
            const initialData: Record<string, any> = {
                name: '',
                description: '',
                category_id: '',
                department_id: '',
                price: '',
                cook_time: '',
                picture_url: '',
            };
            setFormData(initialData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meal, isNew]);

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
            // Map categories to options
            if (f.key === 'category_id') {
                return {
                    ...f,
                    label: t(f.label),
                    options: Array.isArray(categories) ? categories.map((cat: any) => ({
                        value: cat.id,
                        label: cat.name,
                    })) : [],
                };
            }

            // Map departments to options
            if (f.key === 'department_id') {
                return {
                    ...f,
                    label: t(f.label),
                    options: Array.isArray(departments) ? departments.map((dept: any) => ({
                        value: dept.id,
                        label: dept.name,
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
    }), [t, categories, departments]);

    // Handle form submission
    const handleSubmit = useCallback(
        async (submitFormData: Record<string, any>) => {
            try {
                if (isNew && !createdMealId) {
                    // YANGI FLOW: For new meals, create the meal and redirect to meals list
                    const translationData: any = {
                        en: submitFormData.name_en || submitFormData.name || '',
                        ru: submitFormData.name_ru || submitFormData.name || '',
                        uz: submitFormData.name || '', // Primary name is always Uzbek
                    };

                    const translationResult = await createTranslation(translationData);
                    const name_i18n = translationResult.id;

                    // Create the meal
                    const result = await createMeal({
                        ...submitFormData,
                        name_i18n,
                    }) as any;

                    const newMealId = result?.id || result?.data?.id;
                    if (newMealId) {
                        setCreatedMealId(newMealId);
                        // Redirect to meals list immediately after creating
                        router.push(paths.menu.meals.root);
                    }
                } else if (isNew && createdMealId) {
                    // Hisoblash asqarasi orqali saqlanganidan keyin, 1-tabdagi saqlash tugmasi bosilsa
                    // Redirect to meals list
                    router.push(paths.menu.meals.root);
                } else if (mealId) {
                    // Update existing meal
                    await updateMeal(mealId, submitFormData);
                    router.push(paths.menu.meals.root);
                }
            } catch (err) {
                console.log("Error saving meal:", err);
            }
        },
        [isNew, mealId, createdMealId, createMeal, createTranslation, updateMeal, router]
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
                        onChange={(e, newValue) => setActiveTab(newValue)}
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
                            label="Hisoblash"
                            id="meal-tab-1"
                            aria-controls="meal-tabpanel-1"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label="Modifikatorlar"
                            id="meal-tab-2"
                            aria-controls="meal-tabpanel-2"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label="Tegishli taomlar"
                            id="meal-tab-3"
                            aria-controls="meal-tabpanel-3"
                        />
                    </Tabs>
                </Box>

                {/* TAB CONTENT */}
                <TabPanel value={activeTab} index={0}>
                    <GenericEditView
                        config={config}
                        data={meal || undefined}
                        formData={formData}
                        onFormDataChange={setFormData}
                        isNew={isNew}
                        loading={loading}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    {isNew ? (
                        <ProductCalculator
                            mealId={effectiveMealId}
                            showTotalsSummary={true}
                            onCalculationsReady={(calculations) => {
                                // Store calculations for when save is clicked
                                pendingCalculationsRef.current = calculations;
                            }}
                            onSaveWithGood={async (calculationsData) => {
                                try {
                                    // Always create translation for new meals
                                    const translationData: any = {
                                        en: formData.name_en || formData.name || '',
                                        ru: formData.name_ru || formData.name || '',
                                        uz: formData.name || '', // Primary name is always Uzbek
                                    };

                                    const translationResult = await createTranslation(translationData);
                                    const name_i18n = translationResult.id;

                                    // Save meal with calculations using new API
                                    const result = await createMealWithCalculations({
                                        good: {
                                            ...formData,
                                            name_i18n,
                                        },
                                        ingredient_calculations: calculationsData.ingredient_calculations,
                                        compound_calculations: calculationsData.compound_calculations,
                                    }) as any;

                                    const newMealId = result?.good?.id || result?.data?.good?.id;
                                    if (newMealId) {
                                        setCreatedMealId(newMealId);
                                        pendingCalculationsRef.current = null;
                                        // Redirect to meals list
                                        // router.push(paths.menu.meals.root);
                                    }
                                } catch (err) {
                                    console.error("Error saving meal with calculations:", err);
                                    throw err;
                                }
                            }}
                        />
                    ) : (
                        <ProductCalculator
                            mealId={effectiveMealId}
                            showTotalsSummary={true}
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
