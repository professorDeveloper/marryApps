import type { SyntheticEvent } from 'react';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Tab, Tabs, Stack, Button, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslationsAPI } from 'src/hooks/use-translations-api';
import {
    useGetMeal,
    useGetMealWithCalculations,
    useUpdateMealWithCalculations,
    useCreateMealWithCalculations,
} from 'src/hooks/use-meals';

import { endpoints } from 'src/lib/axios';
import { useGetCategories } from 'src/actions/categories';

import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

import { MealRelatedSection } from './components/MealRelatedSection';
import { MealModifiersSection } from './components/MealModifiersSection';
import { MealGeneralInformation } from './components/MealGeneralInformation';
import { MealItemPicker, type MealItemPickerApi } from './components/MealItemPicker';

export interface MealEditViewProps {
    isNew?: boolean;
}

export function MealEditView({ isNew = false }: MealEditViewProps) {
    const { id: mealId } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation('menu');

    // SWR hooks
    const { meal, mealLoading } = useGetMeal(isNew ? '' : mealId || '');
    const { mealWithCalculations } = useGetMealWithCalculations(
        isNew ? undefined : mealId || undefined
    );
    const { categories } = useGetCategories();
    const { createMealWithCalculations } = useCreateMealWithCalculations();
    const { updateMealWithCalculations } = useUpdateMealWithCalculations();
    const { createTranslation, updateTranslation } = useTranslationsAPI();

    // ── General info state ─────────────────────────────────────────────────
    const [name, setName] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [nameRu, setNameRu] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [price, setPrice] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [pictureUrl, setPictureUrl] = useState('');
    const [nameI18n, setNameI18n] = useState<string | undefined>(undefined);
    const [descriptionI18n, setDescriptionI18n] = useState<string | undefined>(undefined);

    // ── UI state ──────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(0);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [isMealItemsOpen, setIsMealItemsOpen] = useState(false); // Second accordion closed by default
    const [submitting, setSubmitting] = useState(false);

    const pageLoading = !isNew && mealLoading;

    // ── Section refs ──────────────────────────────────────────────────────
    const mealItemsApiRef = useRef<MealItemPickerApi | null>(null);

    // ── Hydrate general info from loaded meal ─────────────────────────────
    useEffect(() => {
        if (!meal) return;
        setName(meal.name || '');
        setNameEn((meal as any).name_en || '');
        setNameRu((meal as any).name_ru || '');
        setDescription(meal.description || '');
        setCategoryId(meal.category_id || '');
        setDepartmentId(meal.department_id || '');
        setPrice(meal.price != null ? String(meal.price) : '');
        setCookTime(meal.cook_time != null ? String(meal.cook_time) : '');
        setPictureUrl(meal.picture_url || '');
        setNameI18n((meal as any).name_i18n || undefined);
        setDescriptionI18n((meal as any).description_i18n || undefined);
    }, [meal]);

    // ── Hydrate ingredient/compound sections from loaded calculations ─────
    useEffect(() => {
        if (!mealWithCalculations?.calculations) return;
        const calcs = mealWithCalculations.calculations;
        const ingredientCalcs = calcs
            .filter((c) => c.ingredient_id && !c.component_compound_id)
            .map((c) => ({
                ingredient_id: c.ingredient_id,
                quantity: String(c.quantity),
            }));
        const compoundCalcs = calcs
            .filter((c) => c.component_compound_id)
            .map((c) => ({
                compound_id: c.component_compound_id as string,
                quantity: String(c.quantity),
            }));
        mealItemsApiRef.current?.restoreFromPersisted(ingredientCalcs, compoundCalcs);
    }, [mealWithCalculations]);

    // ── Set default category when categories are loaded ───────────────────
    useEffect(() => {
        if (!categoryId && Array.isArray(categories) && categories.length > 0) {
            setCategoryId(categories[0].id);
        }
    }, [categories, categoryId]);

    // ── Auto-set department when category changes ─────────────────────────
    useEffect(() => {
        if (!categoryId || !Array.isArray(categories)) return;
        const selected = categories.find((c: any) => c.id === categoryId);
        if (selected && selected.department_id) {
            setDepartmentId(selected.department_id);
        }
    }, [categoryId, categories]);

    const handleTabChange = useCallback((_: SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    }, []);

    // Toggle accordion behavior - reverse logic, when one closes, other opens
    const handleInfoToggle = useCallback(() => {
        setIsInfoOpen((prev) => {
            const newOpen = !prev;
            // If closing info, open meal items
            if (!newOpen) {
                setIsMealItemsOpen(true);
            }
            // If opening info, close meal items
            if (newOpen && isMealItemsOpen) {
                setIsMealItemsOpen(false);
            }
            return newOpen;
        });
    }, [isMealItemsOpen]);

    const handleMealItemsToggle = useCallback(() => {
        setIsMealItemsOpen((prev) => {
            const newOpen = !prev;
            // If closing meal items, open info
            if (!newOpen) {
                setIsInfoOpen(true);
            }
            // If opening meal items, close info
            if (newOpen && isInfoOpen) {
                setIsInfoOpen(false);
            }
            return newOpen;
        });
    }, [isInfoOpen]);

    const handleCancel = useCallback(() => {
        router.push(paths.menu.meals.root);
    }, [router]);

    const handleSubmit = useCallback(async () => {
        if (!name.trim()) {
            toast.error(t('mealsProducts.name'));
            return;
        }
        if (!categoryId) {
            toast.error(t('mealsProducts.category'));
            return;
        }
        if (!price) {
            toast.error(t('mealsProducts.price'));
            return;
        }

        try {
            setSubmitting(true);

            // ── Translation handling (preserve existing flow) ──────────────
            let resolvedNameI18n = nameI18n;
            const nameTranslationData = {
                en: nameEn || name,
                ru: nameRu || name,
                uz: name,
            };
            if (!resolvedNameI18n) {
                const result = await createTranslation(nameTranslationData);
                resolvedNameI18n = result.id;
            } else {
                await updateTranslation(resolvedNameI18n, nameTranslationData);
                await mutate(endpoints.translations.list);
            }

            let resolvedDescriptionI18n = descriptionI18n;
            if (!resolvedDescriptionI18n && description) {
                const result = await createTranslation({
                    en: description,
                    ru: description,
                    uz: description,
                });
                resolvedDescriptionI18n = result.id;
            }

            const { ingredient_calculations: ingredientCalculations, compound_calculations: compoundCalculations } =
                mealItemsApiRef.current?.getCalculations() ?? {
                    ingredient_calculations: [],
                    compound_calculations: [],
                };

            const goodPayload = {
                name,
                name_i18n: resolvedNameI18n,
                description,
                description_i18n: resolvedDescriptionI18n,
                category_id: categoryId,
                department_id: departmentId,
                picture_url: pictureUrl || null,
                price,
                cook_time: cookTime ? Number(cookTime) : 0,
            };

            if (isNew) {
                await createMealWithCalculations({
                    good: goodPayload,
                    ingredient_calculations: ingredientCalculations,
                    compound_calculations: compoundCalculations,
                });
            } else if (mealId) {
                await updateMealWithCalculations(mealId, {
                    good: goodPayload,
                    ingredient_calculations: ingredientCalculations,
                    compound_calculations: compoundCalculations,
                });
            }

            router.push(paths.menu.meals.root);
        } catch (err) {
            console.error('Error saving meal:', err);
        } finally {
            setSubmitting(false);
        }
    }, [
        name,
        nameEn,
        nameRu,
        description,
        categoryId,
        departmentId,
        price,
        cookTime,
        pictureUrl,
        nameI18n,
        descriptionI18n,
        isNew,
        mealId,
        createMealWithCalculations,
        updateMealWithCalculations,
        createTranslation,
        updateTranslation,
        router,
        t,
    ]);

    const breadcrumbs = [
        { name: t('app'), href: paths.menu.root },
        { name: t('mealsProducts.title'), href: paths.menu.meals.root },
        { name: isNew ? t('mealsProducts.new') : t('mealsProducts.edit'), href: '' },
    ];

    const saveLabel = isNew ? t('save') : t('save');
    const sectionsDisabled = submitting || pageLoading;

    // Calculate summary for meal items accordion
    const mealItemsSummary = useMemo(() => {
        if (!mealItemsApiRef.current) return { ingredientCount: 0, compoundCount: 0, totalCost: 0 };
        
        const calculations = mealItemsApiRef.current.getCalculations();
        const ingredientCount = calculations.ingredient_calculations.length;
        const compoundCount = calculations.compound_calculations.length;
        
        // Calculate total cost (this would need actual pricing data)
        const totalCost = 0; // Placeholder - would need to calculate based on actual prices
        
        return { ingredientCount, compoundCount, totalCost };
    }, [mealItemsApiRef.current]);

    return (
        <Box sx={{ px: 2, m: 0 }}>
          


            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {pageLoading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            opacity: 0.85,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                <MealGeneralInformation
                    name={name}
                    nameEn={nameEn}
                    nameRu={nameRu}
                    description={description}
                    categoryId={categoryId}
                    price={price}
                    cookTime={cookTime}
                    pictureUrl={pictureUrl}
                    categories={Array.isArray(categories) ? categories : []}
                    onNameChange={setName}
                    onNameEnChange={setNameEn}
                    onNameRuChange={setNameRu}
                    onDescriptionChange={setDescription}
                    onCategoryChange={setCategoryId}
                    onPriceChange={setPrice}
                    onCookTimeChange={setCookTime}
                    onPictureUrlChange={setPictureUrl}
                    disabled={sectionsDisabled}
                    isOpen={isInfoOpen}
                    onToggle={handleInfoToggle}
                />

                {/* Items Accordion */}
                <GeneralInformation
                    title={t('mealsProducts.items', 'Items')}
                    isOpen={isMealItemsOpen}
                    onToggle={handleMealItemsToggle}
                    disabled={sectionsDisabled}
                    summaryValues={[
                        `${mealItemsSummary.ingredientCount} ${t('mealsProducts.filterIngredients', 'Ingredients')}`,
                        `${mealItemsSummary.compoundCount} ${t('mealsProducts.filterSemiFinished', 'Compounds')}`,
                        `${t('total', 'Total')}: ${mealItemsSummary.totalCost}`
                    ]}
                >
                    {/* Tabs inside accordion */}
                    <Box sx={{ width: '100%' }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab
                                sx={{ minWidth: 0, flex: 1 }}
                                label={t('mealsProducts.items', 'Items')}
                            />
                            <Tab
                                sx={{ minWidth: 0, flex: 1 }}
                                label={t('mealsProducts.modifiers', 'Modifiers')}
                            />
                            <Tab
                                sx={{ minWidth: 0, flex: 1 }}
                                label={t('mealsProducts.related', 'Related')}
                            />
                        </Tabs>
                    </Box>

                    {/* Tab content with full height */}
                    <Box sx={{ mx: -2, p: 0, mb: -2, flex: 1, minHeight: 0 }}>
                        {activeTab === 0 && (
                            <Box sx={{ height: '100%' }}>
                                <MealItemPicker
                                    apiRef={mealItemsApiRef}
                                    onCancel={() => {}} // No-op - handled outside
                                    onSave={() => {}} // No-op - handled outside
                                    cancelDisabled // Disable internal buttons
                                    saveDisabled // Disable internal buttons
                                    saveLabel={saveLabel}
                                    hideActionBar // Hide internal action bar
                                    isVisible={isMealItemsOpen}
                                    metaFieldsOpen={isInfoOpen}
                                    menuPrice={price}
                                    showProfitMargin
                                />
                            </Box>
                        )}
                        {activeTab === 1 && (
                            <Box sx={{ height: '100%' }}>
                                {React.createElement(MealModifiersSection)}
                            </Box>
                        )}
                        {activeTab === 2 && (
                            <Box sx={{ height: '100%' }}>
                                {React.createElement(MealRelatedSection)}
                            </Box>
                        )}
                    </Box>
                </GeneralInformation>

                {/* Action buttons - outside accordion */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancel}
                        disabled={sectionsDisabled}
                    >
                        {t('cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={sectionsDisabled}
                    >
                        {saveLabel}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}
