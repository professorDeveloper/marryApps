import type { CompoundEditViewProps } from './types';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Tab, Tabs, CircularProgress, Button, Stack } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

// Hooks and Actions
import { useGetCompound, useGetCompoundWithCalculations } from 'src/hooks/use-compounds';
import { useGetIngredientGroups } from 'src/actions/ingredient-group';

// Components
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { MealItemPicker, type MealItemPickerApi } from 'src/sections/meals/components/MealItemPicker';
import { GeneralInformation } from 'src/sections/warehouse/utils/components/GeneralInformation';

import { CompoundGeneralInformation } from './components/CompoundGeneralInformation';
import { useCompoundForm } from './hooks/useCompoundForm';

// Utils, Types, and Constants
import { MEASUREMENT_OPTIONS } from './constants';

// ================================================================================================

export function CompoundEditView({ compoundId, isNew = false }: CompoundEditViewProps) {
    const { t } = useTranslation('menu');
    const router = useRouter();
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

    // --- Data Fetching ─────────────────────────────────────────────────────
    const { compound, compoundLoading } = useGetCompound(isNew ? '' : compoundId || '');
    const { compoundWithCalculations } = useGetCompoundWithCalculations(isNew ? undefined : compoundId || undefined);
    const { ingredientGroups } = useGetIngredientGroups();
    const pageLoading = !isNew && compoundLoading;

    // --- Section refs ──────────────────────────────────────────────────────
    const mealItemsApiRef = useRef<MealItemPickerApi | null>(null);

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
    }, [compoundWithCalculations]);

    const handleTabChange = useCallback((_: any, newValue: number) => {
        setActiveTab(newValue);
    }, []);

    // Toggle accordion behavior - ensure at least one stays open
    const handleInfoToggle = useCallback(() => {
        setIsInfoOpen((prev) => {
            const newOpen = !prev;
            // Only close meal items if we're opening info AND meal items is currently open
            if (newOpen && isMealItemsOpen) {
                setIsMealItemsOpen(false);
            }
            // Don't allow closing both - if trying to close info and meal items is also closed, keep info open
            if (!newOpen && !isMealItemsOpen) {
                return true; // Keep info open
            }
            return newOpen;
        });
    }, [isMealItemsOpen]);

    const handleMealItemsToggle = useCallback(() => {
        setIsMealItemsOpen((prev) => {
            const newOpen = !prev;
            // Only close info if we're opening meal items AND info is currently open
            if (newOpen && isInfoOpen) {
                setIsInfoOpen(false);
            }
            // Don't allow closing both - if trying to close meal items and info is also closed, keep meal items open
            if (!newOpen && !isInfoOpen) {
                return true; // Keep meal items open
            }
            return newOpen;
        });
    }, [isInfoOpen]);

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
            await handleSubmit(compoundPayload);
        } finally {
            setSubmitting(false);
        }
    }, [name, ingredientGroupId, compoundPayload, handleSubmit]);

    const breadcrumbs = [
        { name: t('overview.menu.title', 'Menu'), href: paths.menu.root },
        { name: t('semifinishedProducts.title'), href: paths.menu.semifinished.root },
        { name: isNew ? t('semifinishedProducts.new', 'New') : compound?.name || '...', href: '' },
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
                <GeneralInformation
                    title={t('mealsProducts.title', 'Meal Items')}
                    isOpen={isMealItemsOpen}
                    onToggle={handleMealItemsToggle}
                    disabled={sectionsDisabled}
                    summaryValues={[
                        `${mealItemsSummary.ingredientCount} ${t('mealsProducts.filterIngredients', 'Ingredients')}`,
                        `${mealItemsSummary.compoundCount} ${t('mealsProducts.filterSemiFinished', 'Compounds')}`,
                        `${t('total', 'Total')}: ${mealItemsSummary.totalCost}`
                    ]}
                >
                    <Box sx={{ mx: -2, my: -2 }}>
                        <MealItemPicker
                            apiRef={mealItemsApiRef}
                            onCancel={() => {}} // No-op - handled outside
                            onSave={() => {}} // No-op - handled outside
                            cancelDisabled={true} // Disable internal buttons
                            saveDisabled={true} // Disable internal buttons
                            saveLabel={saveLabel}
                            hideActionBar={true} // Hide internal action bar
                        />
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
