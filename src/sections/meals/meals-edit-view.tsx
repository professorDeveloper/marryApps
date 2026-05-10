import type { SyntheticEvent } from 'react';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState, useEffect, useCallback } from 'react';

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
import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    mealFormPickerActions,
    mapMealCalculationsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

import { MealRelatedSection } from './components/MealRelatedSection';
import { MealModifiersSection, type MealModifiersApi } from './components/MealModifiersSection';
import { MealGeneralInformation } from './components/MealGeneralInformation';
import { MealItemPicker, type MealItemPickerApi } from './components/MealItemPicker';
import { useGetGoodModifiers, useSyncGoodModifiers } from 'src/actions/good-modifiers';

export interface MealEditViewProps {
    isNew?: boolean;
}

export function MealEditView({ isNew = false }: MealEditViewProps) {
    const { id: mealId } = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation('menu');
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.mealEditForm;

    // SWR hooks
    const { meal, mealLoading } = useGetMeal(isNew ? '' : mealId || '');
    const { mealWithCalculations } = useGetMealWithCalculations(
        isNew ? undefined : mealId || undefined
    );
    const { categories } = useGetCategories();
    const { createMealWithCalculations } = useCreateMealWithCalculations();
    const { updateMealWithCalculations } = useUpdateMealWithCalculations();
    const { createTranslation, updateTranslation } = useTranslationsAPI();
    const { syncModifiers } = useSyncGoodModifiers();
    const { modifiers: goodModifiers } = useGetGoodModifiers(isNew ? undefined : mealId || undefined);

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
    const [tableHeight, setTableHeight] = useState(0);

    const pageLoading = !isNew && mealLoading;

    // ── Section refs ──────────────────────────────────────────────────────
    const mealItemsApiRef = useRef<MealItemPickerApi | null>(null);
    const modifierPickerApiRef = useRef<MealModifiersApi | null>(null);

    // ── Track initial modifiers for comparison ────────────────────────────
    const [initialModifierIds, setInitialModifierIds] = useState<string[]>([]);



      useEffect(() => {
        const calculateHeight = () => {
            const viewportHeight = window.innerHeight;
            const reservedSpace = isInfoOpen ? 500 : 280;
            const calculatedHeight = Math.max(300, viewportHeight - reservedSpace);
            setTableHeight(calculatedHeight);
        };

        calculateHeight();
        window.addEventListener('resize', calculateHeight);
        return () => window.removeEventListener('resize', calculateHeight);
    }, [isInfoOpen]);


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
        dispatch(
            mealFormPickerActions.setFormState({
                formName,
                items: mapMealCalculationsToPickerItems({
                    ingredient_calculations: ingredientCalcs,
                    compound_calculations: compoundCalcs,
                }),
                meta: { isNew, mealId: mealId ?? null, source: 'hydrate' },
            })
        );
    }, [dispatch, formName, isNew, mealId, mealWithCalculations]);

    useEffect(
        () => () => {
            dispatch(mealFormPickerActions.resetFormState({ formName }));
        },
        [dispatch, formName]
    );

    // ── Hydrate modifiers from loaded good modifiers ──────────────────────
    useEffect(() => {
        if (!goodModifiers || goodModifiers.length === 0) {
            setInitialModifierIds([]);
            modifierPickerApiRef.current?.restoreFromPersisted([]);
            return;
        }
        // Extract modifier IDs from the response
        // The response could be either IGoodModifier[] or IModifierItem[]
        const modifierIds = goodModifiers.map((m: any) => m.modifier_id || m.id);
        setInitialModifierIds(modifierIds);
        modifierPickerApiRef.current?.restoreFromPersisted(modifierIds);
    }, [goodModifiers]);

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
            dispatch(
                mealFormPickerActions.setFormState({
                    formName,
                    items: mapMealCalculationsToPickerItems({
                        ingredient_calculations: ingredientCalculations,
                        compound_calculations: compoundCalculations,
                    }),
                    meta: {
                        isNew,
                        mealId: mealId ?? null,
                        tab: activeTab,
                        source: 'submit',
                    },
                })
            );

            // Get current modifier IDs from the picker
            const currentModifierIds = modifierPickerApiRef.current?.getModifierIds() ?? [];

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

            let savedMealId = mealId;

            if (isNew) {
                const result = await createMealWithCalculations({
                    good: goodPayload,
                    ingredient_calculations: ingredientCalculations,
                    compound_calculations: compoundCalculations,
                });
                // Extract the saved meal ID from the result for attaching modifiers
                savedMealId = result?.good?.id || result?.id;
            } else if (mealId) {
                await updateMealWithCalculations(mealId, {
                    good: goodPayload,
                    ingredient_calculations: ingredientCalculations,
                    compound_calculations: compoundCalculations,
                });
            }

            // Sync modifiers after saving the meal
            if (savedMealId) {
                await syncModifiers(savedMealId, currentModifierIds, isNew ? [] : initialModifierIds);
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
        initialModifierIds,
        createMealWithCalculations,
        updateMealWithCalculations,
        createTranslation,
        updateTranslation,
        syncModifiers,
        router,
        t,
        dispatch,
        formName,
        activeTab,
    ]);

    const breadcrumbs = [
        { name: t('app'), href: paths.menu.root },
        { name: t('mealsProducts.title'), href: paths.menu.meals.root },
        { name: isNew ? t('mealsProducts.new') : t('mealsProducts.edit'), href: '' },
    ];

    const saveLabel = isNew ? t('save') : t('save');
    const sectionsDisabled = submitting || pageLoading;


    return (
        <Box sx={{ px: 2, m: 0, mt:2 }}>
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

       
                    {/* Tabs and content container with continuous background */}
                    <Box sx={{ bgcolor:"var(--color-surface-1)", display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap:2, borderRadius: 2, border:null }}>
                        {/* Tabs inside accordion */}
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: 'divider'}}
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

                        {/* Tab content with full height */}
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {activeTab === 0 && (
                                <Box sx={{ height: '100%' }}>
                                    <MealItemPicker
                                        apiRef={mealItemsApiRef}
                                        isVisible={isMealItemsOpen}
                                        menuPrice={price}
                                        tableHeight={tableHeight}
                                        showProfitMargin
                                    />
                                </Box>
                            )}
                        {activeTab === 1 && (
                            <Box sx={{ height: '100%' }}>
                                <MealModifiersSection
                                    apiRef={modifierPickerApiRef}
                                    isVisible={isMealItemsOpen && activeTab === 1}
                                    metaFieldsOpen={isInfoOpen}
                                    tableHeight={tableHeight}
                                    onCancel={() => {}}
                                    onSave={() => {}}
                                    cancelDisabled
                                    saveDisabled
                                    saveLabel={saveLabel}
                                />
                            </Box>
                        )}
                        {activeTab === 2 && (
                            <Box sx={{ height: '100%' }}>
                                {React.createElement(MealRelatedSection)}
                            </Box>
                        )}
                        </Box>
                    </Box>
                {/* </GeneralInformation> */}

                {/* Action buttons - outside accordion */}
                <Stack direction="row" spacing={1} justifyContent="flex-end" mt={-8.9}>
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
