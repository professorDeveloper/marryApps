import type { IMealsItem } from 'src/types/meals';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useMealsAPI } from 'src/hooks/use-meals-api';

import { GenericEditView } from 'src/components/generic-edit-view';
import ProductCalculator from 'src/components/generic-edit-view/edit-calculation';
import { setCustomIconsLoader } from '@iconify/react';

// ============================================================================
// TYPES
// ============================================================================

export interface MealEditViewProps {
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
            <Box sx={{ pt: 3, display: value === index ? 'block' : 'none' }}>
                {children}
            </Box>
        </div>
    );
}

export function MealEditView({ isNew = false }: MealEditViewProps) {
    const { id: mealId } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation('menu');

    // API hooks
    const { getMealById, createMeal, updateMeal, getCategories, getDepartments } = useMealsAPI();

    // State
    const [meal, setMeal] = useState<Partial<IMealsItem> | null>(null);
    const [loading, setLoading] = useState(!isNew);
    const [categories, setCategories] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(0);

    const loadMeal = useCallback(async () => {
        if (!mealId) return;
        setLoading(true);
        try {
            const data = await getMealById(mealId);
            setMeal(data);
        } finally {
            setLoading(false);
        }
    }, [mealId, getMealById]);

    // Load meal if editing
    useEffect(() => {
        if (!isNew && mealId) {
            loadMeal();
        } else if (isNew) {
            setLoading(false);
        }
    }, [mealId, isNew, loadMeal]);

    // Load categories and departments
    useEffect(() => {
        const loadSelectOptions = async () => {
            const [catsData, deptsData] = await Promise.all([
                getCategories(),
                getDepartments(),
            ]);
            setCategories(catsData);
            setDepartments(deptsData);
        };

        loadSelectOptions();
    }, [getCategories, getDepartments]);

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

    const BASIC_INFO_SECTION_T: CardSection = {
        ...BASIC_INFO_SECTION,
        title: t(BASIC_INFO_SECTION.title),
        fields: BASIC_INFO_SECTION.fields.map((f) => {
            // Map categories to options
            if (f.key === 'category_id') {
                return {
                    ...f,
                    label: t(f.label),
                    options: Array.isArray(categories) ? categories.map((cat) => ({
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
                    options: Array.isArray(departments) ? departments.map((dept) => ({
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
    };

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (isNew) {
                    await createMeal(formData);
                } else if (mealId) {
                    await updateMeal(mealId, formData);
                }

                router.push(paths.menu.meals.root);
            } catch (err) {
                console.log("Error saving meal:", err);
            }
        },
        [isNew, mealId, createMeal, updateMeal, router]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            // Note: Delete functionality should be in useMealsAPI
            // This will be called if the user clicks delete button
            router.push(paths.menu.meals.root);
        } catch (err) {
            console.log("Error deleting meal:", err);
        }
    }, [router]);

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
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, width: '100%' }}>
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
                        isNew={isNew}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <ProductCalculator />
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
