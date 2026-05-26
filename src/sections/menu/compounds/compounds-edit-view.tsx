import type { CompoundEditViewProps } from './types';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Stack, Button, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    compoundFormPickerActions,
    mapMealCalculationsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

// Hooks and Actions
import { useGetCompound, useGetCompoundWithCalculations } from 'src/hooks/use-compounds';

import { useGetIngredientGroups } from 'src/actions/ingredient-group';

// Components
import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';
import { MealItemPicker, type MealItemPickerApi } from 'src/sections/meals/components/MealItemPicker';
import { MealItemPickerCache } from 'src/sections/meals/components/MealItemPicker/MealItemPickerCache';

// Utils, Types, and Constants
import { MEASUREMENT_OPTIONS } from './constants';
import { useCompoundForm } from './hooks/useCompoundForm';
import { CompoundGeneralInformation } from './components/CompoundGeneralInformation';

// ================================================================================================

export function CompoundEditView({ compoundId, isNew = false }: CompoundEditViewProps) {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.compoundEditForm;
    const [activeTab, setActiveTab] = useState(0);

    // --- General info state ────────────────────────────────────────────────
    const [name, setName] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [nameRu, setNameRu] = useState('');
    const [description, setDescription] = useState('');
    const [ingredientGroupId, setIngredientGroupId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [measurement, setMeasurement] = useState('kg');

    // --- UI state ──────────────────────────────────────────────────────────
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [isMealItemsOpen, setIsMealItemsOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tableHeight, setTableHeight] = useState(730);

    // --- Data Fetching ─────────────────────────────────────────────────────
    const { compound, compoundLoading } = useGetCompound(isNew ? '' : compoundId || '');
    const { compoundWithCalculations } = useGetCompoundWithCalculations(isNew ? undefined : compoundId || undefined);
    const { ingredientGroups } = useGetIngredientGroups();
    const pageLoading = !isNew && compoundLoading;

    // --- Section refs ──────────────────────────────────────────────────────
    const mealItemsApiRef = useRef<MealItemPickerApi | null>(null);

    // --- Cache key for MealItemPicker ──────────────────────────────────────
    const mealItemPickerCacheKey = isNew ? 'compound_new' : `compound_${compoundId}`;

    // --- Calculate table height based on viewport ───────────────────────────
    useEffect(() => {
        const calculateHeight = () => {
            const viewportHeight = window.innerHeight;
            const reservedSpace = isInfoOpen ? 460 : 220;
            const calculatedHeight = Math.max(300, viewportHeight - reservedSpace);
            setTableHeight(calculatedHeight);
        };

        calculateHeight();
        window.addEventListener('resize', calculateHeight);
        return () => window.removeEventListener('resize', calculateHeight);
    }, [isInfoOpen]);

    // --- Clear cache on unmount (when navigating away from this view) ───────
    useEffect(() => () => {
        MealItemPickerCache.clear(mealItemPickerCacheKey);
    }, [mealItemPickerCacheKey]);

    // --- Memoize measurement options ---
    const measurementOptions = useMemo(() =>
        MEASUREMENT_OPTIONS.map((m) => ({
            value: m,
            label: t(`semifinishedProducts.${m}`),
        })),
        [t]
    );

    // --- Hydrate general info from loaded compound ─────────────────────────
    useEffect(() => {
        if (!compound) return;
        setName(compound.name || '');
        setNameEn((compound as any).name_en || '');
        setNameRu((compound as any).name_ru || '');
        setDescription(compound.description || '');
        setIngredientGroupId(compound.ingredient_group_id || '');
        setQuantity(compound.quantity != null ? String(compound.quantity) : '');
        setMeasurement(compound.measurement || 'kg');
    }, [compound]);

    // --- Hydrate ingredient/compound sections from loaded calculations ─────
    useEffect(() => {
        if (!compoundWithCalculations?.calculations || !mealItemsApiRef.current) return;

        const ingredientCalcs = compoundWithCalculations.calculations
            .filter((c) => c.ingredient_id && !c.component_compound_id)
            .map((c) => ({
                ingredient_id: c.ingredient_id,
                quantity: String(c.quantity),
            }));

        const compoundCalcs = compoundWithCalculations.calculations
            .filter((c) => c.component_compound_id)
            .map((c) => ({
                compound_id: c.component_compound_id as string,
                quantity: String(c.quantity),
            }));

        mealItemsApiRef.current.restoreFromPersisted(ingredientCalcs, compoundCalcs);
        dispatch(
            compoundFormPickerActions.setFormState({
                formName,
                items: mapMealCalculationsToPickerItems({
                    ingredient_calculations: ingredientCalcs,
                    compound_calculations: compoundCalcs,
                }),
                meta: { isNew, compoundId: compoundId ?? null, source: 'hydrate' },
            })
        );
    }, [compoundWithCalculations, compoundId, dispatch, formName, isNew]);

    useEffect(
        () => () => {
            dispatch(compoundFormPickerActions.resetFormState({ formName }));
        },
        [dispatch, formName]
    );

    const handleTabChange = useCallback((_: any, newValue: number) => {
        setActiveTab(newValue);
    }, []);

    const handleInfoToggle = useCallback(() => {
        setIsInfoOpen((prev) => !prev);
    }, []);

    const handleMealItemsToggle = useCallback(() => {
        setIsMealItemsOpen((prev) => !prev);
    }, []);

    const handleCancel = useCallback(() => {
        router.push(paths.menu.semifinished.root);
    }, [router]);

    // --- Form Handlers ---
    const { handleSubmit } = useCompoundForm({
        compoundId,
        isNew,
        compound,
        mealItemsApiRef,
    });

    const compoundPayload = {
        name,
        name_en: nameEn,
        name_ru: nameRu,
        description,
        ingredient_group_id: ingredientGroupId,
        quantity,
        measurement,
    };

    const handleFormSubmit = useCallback(async () => {
        if (!name.trim()) {
            return;
        }
        if (!ingredientGroupId) {
            return;
        }

        setSubmitting(true);
        try {
            const calculations = mealItemsApiRef.current?.getCalculations() ?? {
                ingredient_calculations: [],
                compound_calculations: [],
            };
            dispatch(
                compoundFormPickerActions.setFormState({
                    formName,
                    items: mapMealCalculationsToPickerItems(calculations),
                    meta: { isNew, compoundId: compoundId ?? null, source: 'submit' },
                })
            );
            await handleSubmit(compoundPayload);
        } finally {
            setSubmitting(false);
        }
    }, [name, ingredientGroupId, compoundPayload, handleSubmit, dispatch, formName, isNew, compoundId]);

    const breadcrumbs = [
        { name: t('overview.menu.title'), href: paths.menu.root },
        { name: t('semifinishedProducts.title'), href: paths.menu.semifinished.root },
        { name: isNew ? t('semifinishedProducts.new') : compound?.name || '...', href: '' },
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
        <Box sx={{ px: 4, m: 0, mt:2 }}>
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

                <CompoundGeneralInformation
                    name={name}
                    nameEn={nameEn}
                    nameRu={nameRu}
                    description={description}
                    ingredientGroupId={ingredientGroupId}
                    quantity={quantity}
                    measurement={measurement}
                    ingredientGroups={Array.isArray(ingredientGroups) ? ingredientGroups : []}
                    measurementOptions={measurementOptions}
                    onNameChange={setName}
                    onNameEnChange={setNameEn}
                    onNameRuChange={setNameRu}
                    onDescriptionChange={setDescription}
                    onIngredientGroupChange={setIngredientGroupId}
                    onQuantityChange={setQuantity}
                    onMeasurementChange={setMeasurement}
                    disabled={sectionsDisabled}
                    isOpen={isInfoOpen}
                    onToggle={handleInfoToggle}
                />

                {/* Meal Items Accordion */}
                <MealItemPicker
                    apiRef={mealItemsApiRef}
                    isVisible={isMealItemsOpen}
                    tableHeight={tableHeight}
                    cacheKey={mealItemPickerCacheKey}
                />

                {/* Action buttons - outside accordion */}
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: -7 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancel}
                        disabled={sectionsDisabled}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={sectionsDisabled}
                    >
                        {saveLabel}
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}

// ================================================================================================

// This wrapper component remains unchanged. It's responsible for getting the ID from the URL.
export function CompoundEditViewWrapper({ isNew = false }: { isNew?: boolean }) {
    const { id } = useParams<{ id?: string }>();
    return <CompoundEditView compoundId={id} isNew={isNew} />;
}
