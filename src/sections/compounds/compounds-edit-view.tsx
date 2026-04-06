import type { PendingCalculation, CompoundEditViewProps } from './types';
import type { GenericEditViewConfig } from '../../components/generic-edit-view/types';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Tab, Tabs, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

// Hooks and Actions
import { useGetCompound, useGetCompoundWithCalculations } from 'src/hooks/use-compounds';

import { useGetIngredientGroups } from 'src/actions/ingredient-group';

// Components
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import ProductCalculator from 'src/components/generic-edit-view/edit-calculation';

import { translateSection } from './utilities';
import { TabPanel } from './components/TabPanel';
import { useCompoundForm } from './hooks/useCompoundForm';
import { GenericEditView } from '../../components/generic-edit-view/GenericEditView';
// Utils, Types, and Constants
import { IMAGE_SECTION, PRICING_SECTION, BASIC_INFO_SECTION, MEASUREMENT_OPTIONS } from './constants';

// ================================================================================================

const mapCalculationsToPending = (
    calculations?: Array<{
        ingredient_id: string;
        component_compound_id?: string;
        quantity: string;
    }>
): PendingCalculation => ({
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

export function CompoundEditView({ compoundId, isNew = false }: CompoundEditViewProps) {
    const { t } = useTranslation('menu');
    const [activeTab, setActiveTab] = useState(0);

    // This state holds form data and preserves it across tab changes.
    // It's initialized to null to prevent rendering form until data is ready.
    const [formData, setFormData] = useState<Record<string, any> | null>(null);
    const pendingCalculationsRef = useRef<PendingCalculation | null>(null);

    // --- Data Fetching ---
    const { compound, compoundLoading } = useGetCompound(isNew ? '' : compoundId || '');
    const { compoundWithCalculations } = useGetCompoundWithCalculations(isNew ? undefined : compoundId || undefined);
    const { ingredientGroups } = useGetIngredientGroups();
    const isDataLoading = !isNew && compoundLoading;

    // --- Memoize expensive translations ---
    const translatedSections = useMemo(() => ({
        IMAGE_SECTION_T: translateSection(IMAGE_SECTION, t),
        BASIC_INFO_SECTION_T: translateSection(BASIC_INFO_SECTION, t),
        PRICING_SECTION_T: translateSection(PRICING_SECTION, t),
    }), [t]);

    // --- Memoize ingredient group options ---
    const ingredientGroupOptions = useMemo(() =>
        ingredientGroups.map((group: any) => ({ value: group.id, label: group.name })),
        [ingredientGroups]
    );

    // --- Memoize measurement options ---
    const measurementOptions = useMemo(() => 
        MEASUREMENT_OPTIONS.map((m) => ({
            value: m,
            label: t(`semifinishedProducts.${m}`),
        })),
        [t]
    );

    // --- State Initialization ---
    // This effect runs ONCE to populate form state when data is loaded or for a new entry.
    useEffect(() => {
        // Do not run if data is still loading
        if (isDataLoading) return;

        // If we have an existing compound, populate form
        if (compound) {
            setFormData({
                name_en: '', name_ru: '', description_en: '', description_ru: '', // Ensure translation fields exist
                ...compound,
            });
        }
        // If it's a new compound, initialize with empty/default values
        else if (isNew) {
            setFormData({
                name: '', name_en: '', name_ru: '', description: '', description_en: '', description_ru: '',
                ingredient_group_id: '', price: '', quantity: '', measurement: 'kg', picture_url: '',
            });
        }
    }, [compound, isNew, isDataLoading]);

    useEffect(() => {
        if (!compoundWithCalculations?.calculations) return;

        pendingCalculationsRef.current = mapCalculationsToPending(
            compoundWithCalculations.calculations.map((calculation) => ({
                ingredient_id: calculation.ingredient_id,
                component_compound_id: calculation.component_compound_id,
                quantity: calculation.quantity,
            }))
        );
    }, [compoundWithCalculations]);

    // --- Form Handlers ---
    // These handlers are memoized within the custom hook
    const { handleSubmit, handleDelete } = useCompoundForm({
        compoundId,
        isNew,
        compound,
        pendingCalculationsRef,
    });

    // --- PERFORMANCE BOTTLENECK FIX ---
    // Memoize sections with transformed fields
    const basicInfoWithDeps = useMemo(() => ({
        ...translatedSections.BASIC_INFO_SECTION_T,
        fields: translatedSections.BASIC_INFO_SECTION_T.fields?.map((field) =>
            field.key === 'ingredient_group_id'
                ? {
                    ...field,
                    type: 'select' as const,
                    options: ingredientGroupOptions,
                }
                : field
        ),
    }), [translatedSections.BASIC_INFO_SECTION_T, ingredientGroupOptions]);

    const pricingWithMeasurements = useMemo(() => ({
        ...translatedSections.PRICING_SECTION_T,
        fields: translatedSections.PRICING_SECTION_T.fields?.map((field) =>
            field.key === 'measurement'
                ? {
                    ...field,
                    type: 'select' as const,
                    options: measurementOptions,
                }
                : field
        ),
    }), [translatedSections.PRICING_SECTION_T, measurementOptions]);

    // Memoize the entire config object
    const memoizedConfig = useMemo((): GenericEditViewConfig => ({
        title: isNew ? t('semifinishedProducts.newTitle') : t('semifinishedProducts.editTitle'),
        entityName: 'compound',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('overview.menu.title', 'Menu'), href: paths.menu.root },
            { name: t('semifinishedProducts.title'), href: paths.menu.semifinished.root },
            { name: isNew ? t('semifinishedProducts.new', 'New') : compound?.name || '...', href: '' },
        ],
        leftSidecard: translatedSections.IMAGE_SECTION_T,
        sections: [basicInfoWithDeps, pricingWithMeasurements],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew
    }), [t, isNew, compound, translatedSections.IMAGE_SECTION_T, basicInfoWithDeps, pricingWithMeasurements, handleSubmit, handleDelete]);


    // --- Memoize tab change handler ---
    const handleTabChange = useCallback((e: any, newValue: number) => {
        setActiveTab(newValue);
    }, []);

    // --- Render Logic ---
    // Prevent rendering the form until the initial data is loaded and set.
    if (!formData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                <CustomBreadcrumbs
                    heading={memoizedConfig.title}
                    links={memoizedConfig.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                    <Tab label={t('semifinishedProducts.basicInfo', 'Basic Info')} />
                    <Tab label={t('semifinishedProducts.composition', 'Composition')} />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                    <GenericEditView
                        config={memoizedConfig}
                        data={formData} // Pass the stable state as the initial data
                        onFormDataChange={setFormData} // Used to update state after submission
                        isNew={isNew}
                        loading={isDataLoading}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <ProductCalculator
                        compoundId={compoundId || compound?.id}
                        onCalculationsReady={(calculations) => {
                            pendingCalculationsRef.current = calculations;
                        }}
                    />
                </TabPanel>
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
