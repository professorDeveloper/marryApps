import { useCallback } from 'react';
import { mutate } from 'swr';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';
import {
    useCreateCompoundWithCalculations,
    useDeleteCompound,
    useUpdateCompoundWithCalculations,
} from 'src/hooks/use-compounds';
import { useTranslationsAPI } from 'src/hooks/use-translations-api';
import type { PendingCalculation } from '../types';

interface UseCompoundFormProps {
    compoundId?: string;
    isNew: boolean;
    compound: any;
    pendingCalculationsRef: React.MutableRefObject<PendingCalculation | null>;
}

export function useCompoundForm({ 
    compoundId, 
    isNew, 
    compound, 
    pendingCalculationsRef 
}: UseCompoundFormProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');
    const { deleteCompound } = useDeleteCompound();
    const { createTranslation, updateTranslation } = useTranslationsAPI();
    const { createCompoundWithCalculations } = useCreateCompoundWithCalculations();
    const { updateCompoundWithCalculations } = useUpdateCompoundWithCalculations();

    // Handle form submission
    const handleSubmit = useCallback(
        async (submitFormData: Record<string, any>) => {
            try {
                if (isNew) {
                    let name_i18n = submitFormData.name_i18n;
                    if (!name_i18n && (submitFormData.name_en || submitFormData.name_ru)) {
                        // Create translation if provided
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '', // Primary name is always Uzbek
                        };

                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    } else if (name_i18n && (submitFormData.name_en || submitFormData.name_ru || submitFormData.name)) {
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

                    await createCompoundWithCalculations({
                        compound: {
                            ...submitFormData,
                            name_i18n,
                            description_i18n,
                        },
                        ingredient_calculations: pendingCalculations?.ingredient_calculations,
                        compound_calculations: pendingCalculations?.compound_calculations,
                    });

                    toast.success(t('success.created', 'Successfully created'));
                    router.push(paths.menu.semifinished.root);
                } else if (compoundId) {
                    // Update existing compound with translation
                    let name_i18n = submitFormData.name_i18n;
                    if (!name_i18n && (submitFormData.name_en || submitFormData.name_ru)) {
                        // Create translation if provided
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '', // Primary name is always Uzbek
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

                    await updateCompoundWithCalculations(compoundId, {
                        compound: {
                            name: submitFormData.name,
                            name_i18n,
                            description: submitFormData.description || '',
                            description_i18n,
                            price: String(submitFormData.price),
                            quantity: Number(submitFormData.quantity),
                            measurement: submitFormData.measurement,
                            ingredient_group_id: submitFormData.ingredient_group_id,
                            picture_url: submitFormData.picture_url || null,
                        },
                        ingredient_calculations: pendingCalculations?.ingredient_calculations,
                        compound_calculations: pendingCalculations?.compound_calculations,
                    });

                    toast.success(t('success.updated', 'Successfully updated'));
                    // Redirect to list
                    router.push(paths.menu.semifinished.root);
                }
            } catch {
                // console.error('Error saving compound:', err);
                toast.error(
                    isNew ? t('error.createFailed') : t('error.updateFailed')
                );
            }
        },
        [router, isNew, compoundId, t, createTranslation, updateTranslation, createCompoundWithCalculations, pendingCalculationsRef, updateCompoundWithCalculations]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!compound) return;

        try {
            await deleteCompound(compound.id);
            router.push(paths.menu.semifinished.root);
        } catch {
            // console.error('Error deleting compound:', err);
            toast.error(t('error.deleteFailed'));
        }
    }, [compound, deleteCompound, router, t]);

    return {
        handleSubmit,
        handleDelete,
    };
}
