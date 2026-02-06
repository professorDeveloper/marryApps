import type { SWRConfiguration } from 'swr';
import type { ICompound } from 'src/types/compounds';
import type { ITranslationItem } from 'src/types/departments.tsx';
import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetDepartments } from 'src/actions/departments';
import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export interface ICompoundCalculation {
    id: string;
    compound_id: string;
    ingredient_id: string;
    component_compound_id?: string;
    quantity: string;
    measurement_unit: string;
    price_per_unit: string;
    total_cost: string;
    created_at: string;
    updated_at: string;
}

export interface ICompoundWithCalculations {
    id: string;
    name: string;
    price: string;
    calculations: ICompoundCalculation[];
    total_cost: string;
    profit: string;
    profit_margin: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Enrich compounds with department names and translations
 */
function enrichCompounds(
    compoundsData: ICompound[],
    departments: any[],
    translations: ITranslationItem[] = [],
    currentLanguage: string = 'uz'
): any[] {
    const departmentMap = new Map(
        departments?.map((dept: any) => [dept.id, dept.name]) || []
    );

    // Create translations map for quick lookup
    const translationMap = new Map(
        translations?.map((t: ITranslationItem) => [t.id, t]) || []
    );

    // Helper function to map i18n language codes to translation fields
    const getLangKey = (lang: string): keyof ITranslationItem => {
        const langMap: Record<string, keyof ITranslationItem> = {
            'uz': 'uz',
            'uz-Latn': 'uz-Latn',
            'uz-Cyrl': 'uz-Cyrl',
            'ru': 'ru',
            'en': 'en',
        };
        return (langMap[lang] || 'uz') as keyof ITranslationItem;
    };

    return compoundsData.map((compound) => {
        // Get localized name from translation
        let localizedName = compound.name;
        let translationFields: any = {};

        if (compound.name_i18n) {
            const translation = translationMap.get(compound.name_i18n);
            if (translation) {
                // Add translation fields for editing
                translationFields = {
                    name_en: translation.en || '',
                    name_ru: translation.ru || '',
                };

                // Try to get exact language match
                const langKey = getLangKey(currentLanguage);
                if (translation[langKey]) {
                    localizedName = translation[langKey] as string;
                } else if (translation.uz) {
                    // Fallback to uz
                    localizedName = translation.uz as string;
                } else if (translation.en) {
                    // Final fallback to English
                    localizedName = translation.en as string;
                }
            }
        }

        return {
            ...compound,
            name: localizedName,
            ...translationFields,
            department_name: departmentMap.get(compound.department_id) || 'Unknown',
        };
    });
}

/**
 * Enrich single compound with department name and translations
 */
function enrichCompound(
    compoundData: ICompound,
    departments: any[],
    translations: ITranslationItem[] = [],
    currentLanguage: string = 'uz'
): any {
    const departmentMap = new Map(
        departments?.map((dept: any) => [dept.id, dept.name]) || []
    );

    // Create translations map for quick lookup
    const translationMap = new Map(
        translations?.map((t: ITranslationItem) => [t.id, t]) || []
    );

    // Helper function to map i18n language codes to translation fields
    const getLangKey = (lang: string): keyof ITranslationItem => {
        const langMap: Record<string, keyof ITranslationItem> = {
            'uz': 'uz',
            'uz-Latn': 'uz-Latn',
            'uz-Cyrl': 'uz-Cyrl',
            'ru': 'ru',
            'en': 'en',
        };
        return (langMap[lang] || 'uz') as keyof ITranslationItem;
    };

    // Get localized name from translation
    let localizedName = compoundData.name;
    let translationFields: any = {};

    if (compoundData.name_i18n) {
        const translation = translationMap.get(compoundData.name_i18n);
        if (translation) {
            // Add translation fields for editing
            translationFields = {
                name_en: translation.en || '',
                name_ru: translation.ru || '',
            };

            // Try to get exact language match
            const langKey = getLangKey(currentLanguage);
            if (translation[langKey]) {
                localizedName = translation[langKey] as string;
            } else if (translation.uz) {
                // Fallback to uz
                localizedName = translation.uz as string;
            } else if (translation.en) {
                // Final fallback to English
                localizedName = translation.en as string;
            }
        }
    }

    return {
        ...compoundData,
        name: localizedName,
        ...translationFields,
        department_name: departmentMap.get(compoundData.department_id) || 'Unknown',
    };
}

// ============================================================================
// COMPOUNDS HOOKS
// ============================================================================

/**
 * Get all compounds with enriched department names and translations
 */
export function useGetCompounds() {
    const url = endpoints.compound.list;
    const { i18n } = useTranslation();

    // Get departments for enrichment
    const { departments } = useGetDepartments();

    // Fetch translations
    const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
        endpoints.translations.list,
        fetcher,
        { ...swrOptions }
    );

    const { data, isLoading, error, isValidating, mutate: mutateCompounds } = useSWR<
        BackendResponse<ICompound[]> | ICompound[]
    >(url, fetcher, { ...swrOptions });

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    const enrichedCompounds = useMemo(() => {
        let compoundsData: ICompound[] = [];

        if (Array.isArray(data)) {
            compoundsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
            compoundsData = data.data;
        }

        return enrichCompounds(compoundsData, departments, translations, i18n.resolvedLanguage);
    }, [data, departments, translations, i18n.resolvedLanguage]);

    const memoizedValue = useMemo(
        () => ({
            compounds: enrichedCompounds,
            compoundsLoading: isLoading,
            compoundsError: error,
            compoundsValidating: isValidating,
            compoundsEmpty: !isLoading && !isValidating && enrichedCompounds.length === 0,
            mutate: mutateCompounds,
        }),
        [enrichedCompounds, error, isLoading, isValidating, mutateCompounds]
    );

    return memoizedValue;
}

/**
 * Get single compound by ID with enriched department name and translations
 */
export function useGetCompound(compoundId: string) {
    const url = compoundId ? endpoints.compound.details(compoundId) : null;
    const { i18n } = useTranslation();

    // Get departments for enrichment
    const { departments } = useGetDepartments();

    // Fetch translations
    const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
        endpoints.translations.list,
        fetcher,
        { ...swrOptions }
    );

    const { data, isLoading, error, isValidating, mutate: mutateCompound } = useSWR<
        BackendResponse<ICompound> | ICompound
    >(url, fetcher, { ...swrOptions });

    const translations = useMemo(() => {
        if (!translationsData) return [];
        if (Array.isArray(translationsData)) return translationsData;
        return translationsData?.data || [];
    }, [translationsData]);

    const enrichedCompound = useMemo(() => {
        if (!data) return undefined;

        let compoundData: ICompound | null = null;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            if ('id' in data && 'name' in data) {
                compoundData = data as ICompound;
            } else if ('data' in data) {
                compoundData = (data as BackendResponse<ICompound>).data;
            }
        }

        if (!compoundData) return undefined;

        return enrichCompound(compoundData, departments, translations, i18n.resolvedLanguage);
    }, [data, departments, translations, i18n.resolvedLanguage]);

    const memoizedValue = useMemo(
        () => ({
            compound: enrichedCompound,
            compoundLoading: isLoading,
            compoundError: error,
            compoundValidating: isValidating,
            mutate: mutateCompound,
        }),
        [enrichedCompound, error, isLoading, isValidating, mutateCompound]
    );

    return memoizedValue;
}

/**
 * Create new compound
 */
export function useCreateCompound() {
    const createCompound = useCallback(
        async (formData: Partial<ICompound>): Promise<ICompound> => {
            try {
                const payload = {
                    name: formData.name,
                    name_i18n: (formData as any).name_i18n || undefined,
                    description: formData.description || '',
                    description_i18n: (formData as any).description_i18n || undefined,
                    price: String(formData.price),
                    quantity: Number(formData.quantity),
                    measurement: formData.measurement,
                    department_id: formData.department_id,
                    picture_url: formData.picture_url || null,
                };

                const response = await poster<BackendResponse<ICompound>>(
                    endpoints.compound.create,
                    payload
                );

                // Revalidate compounds list
                await mutate(endpoints.compound.list);

                toast.success('Compound created successfully');
                return response.data || (response as unknown as ICompound);
            } catch (error) {
                console.error('Error creating compound:', error);
                toast.error('Failed to create compound');
                throw error;
            }
        },
        []
    );

    return { createCompound };
}

/**
 * Update compound
 */
export function useUpdateCompound() {
    const updateCompound = useCallback(
        async (compoundId: string, formData: Partial<ICompound>): Promise<ICompound> => {
            try {
                const payload = {
                    name: formData.name,
                    name_i18n: (formData as any).name_i18n || undefined,
                    description: formData.description || '',
                    description_i18n: (formData as any).description_i18n || undefined,
                    price: String(formData.price),
                    quantity: Number(formData.quantity),
                    measurement: formData.measurement,
                    department_id: formData.department_id,
                    picture_url: formData.picture_url || null,
                };

                const response = await putter<BackendResponse<ICompound>>(
                    endpoints.compound.update(compoundId),
                    payload
                );

                // Note: Mutations are now handled by the caller (edit-view) to ensure proper cache ordering
                // await mutate(endpoints.compound.list);
                // await mutate(endpoints.compound.details(compoundId));

                toast.success('Compound updated successfully');
                return response.data || (response as unknown as ICompound);
            } catch (error) {
                console.error('Error updating compound:', error);
                toast.error('Failed to update compound');
                throw error;
            }
        },
        []
    );

    return { updateCompound };
}

/**
 * Delete compound
 */
export function useDeleteCompound() {
    const deleteCompound = useCallback(
        async (compoundId: string): Promise<void> => {
            try {
                await deleter(endpoints.compound.delete(compoundId));

                // Revalidate compounds list
                await mutate(endpoints.compound.list);

                toast.success('Compound deleted successfully');
            } catch (error) {
                console.error('Error deleting compound:', error);
                toast.error('Failed to delete compound');
                throw error;
            }
        },
        []
    );

    return { deleteCompound };
}

/**
 * Delete multiple compounds
 */
export function useDeleteCompounds() {
    const deleteCompounds = useCallback(
        async (ids: string[]): Promise<void> => {
            try {
                await Promise.all(ids.map((id) => deleter(endpoints.compound.delete(id))));

                // Revalidate compounds list
                await mutate(endpoints.compound.list);

                toast.success('Compounds deleted successfully');
            } catch (error) {
                console.error('Error deleting compounds:', error);
                toast.error('Failed to delete compounds');
                throw error;
            }
        },
        []
    );

    return { deleteCompounds };
}

// ============================================================================
// COMPOUND CALCULATIONS HOOKS
// ============================================================================

/**
 * Get compound calculations by compound_id
 */
export function useGetCompoundCalculations(compoundId: string | undefined) {
    const url = compoundId ? endpoints.compound.calculations(compoundId) : null;

    const { data, isLoading, error, isValidating, mutate: mutateCalculations } = useSWR<
        BackendResponse<ICompoundCalculation[]> | ICompoundCalculation[]
    >(url, fetcher, { ...swrOptions });

    const calculations = useMemo(() => {
        if (!data) return [];

        if (Array.isArray(data)) {
            return data;
        } else if (data?.data && Array.isArray(data.data)) {
            return data.data;
        }

        return [];
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            calculations,
            calculationsLoading: isLoading,
            calculationsError: error,
            calculationsValidating: isValidating,
            mutate: mutateCalculations,
        }),
        [calculations, error, isLoading, isValidating, mutateCalculations]
    );

    return memoizedValue;
}

/**
 * Create compound calculation
 */
export function useCreateCompoundCalculation() {
    const createCalculation = useCallback(
        async (payload: {
            compound_id: string;
            ingredient_id?: string;
            compound_to_add_id?: string;
            quantity: string;
        }): Promise<ICompoundCalculation> => {
            try {
                const response = await poster<BackendResponse<ICompoundCalculation>>(
                    endpoints.compound.createCalculation,
                    payload
                );

                // Revalidate calculations for the compound
                if (payload.compound_id) {
                    await mutate(endpoints.compound.calculations(payload.compound_id));
                }

                toast.success('Calculation created successfully');
                return response.data || (response as unknown as ICompoundCalculation);
            } catch (error) {
                console.error('Error creating calculation:', error);
                toast.error('Failed to create calculation');
                throw error;
            }
        },
        []
    );

    return { createCalculation };
}

/**
 * Delete compound calculation
 */
export function useDeleteCompoundCalculation() {
    const deleteCalculation = useCallback(
        async (calculationId: string, compoundId: string): Promise<void> => {
            try {
                await deleter(endpoints.compound.deleteCalculation(calculationId));

                // Revalidate calculations for the compound
                if (compoundId) {
                    await mutate(endpoints.compound.calculations(compoundId));
                }

                toast.success('Calculation deleted successfully');
            } catch (error) {
                console.error('Error deleting calculation:', error);
                toast.error('Failed to delete calculation');
                throw error;
            }
        },
        []
    );

    return { deleteCalculation };
}

/**
 * Get compound with calculations (includes total_cost, profit, profit_margin)
 */
export function useGetCompoundWithCalculations(compoundId: string | undefined) {
    const url = compoundId ? endpoints.compound.withCalculations(compoundId) : null;

    const { data, isLoading, error, isValidating, mutate: mutateCompound } = useSWR<
        BackendResponse<ICompoundWithCalculations> | ICompoundWithCalculations
    >(url, fetcher, { ...swrOptions });

    const compoundWithCalculations = useMemo(() => {
        if (!data) return undefined;

        if ('id' in data && 'calculations' in data) {
            return data as ICompoundWithCalculations;
        } else if (data?.data && 'calculations' in data.data) {
            return data.data as ICompoundWithCalculations;
        }

        return undefined;
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            compoundWithCalculations,
            loading: isLoading,
            error,
            isValidating,
            mutate: mutateCompound,
        }),
        [compoundWithCalculations, error, isLoading, isValidating, mutateCompound]
    );

    return memoizedValue;
}

/**
 * Create compound with calculations (yangi qulayroq API - bitta request orqali)
 */
export function useCreateCompoundWithCalculations() {
    const createCompoundWithCalculations = useCallback(
        async (payload: {
            compound: any;
            ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
            compound_calculations?: Array<{ compound_id: string; quantity: string }>;
        }): Promise<any> => {
            try {
                const payloadToSend = {
                    compound: {
                        name: payload.compound.name,
                        name_i18n: payload.compound.name_i18n || undefined,
                        description: payload.compound.description || '',
                        description_i18n: payload.compound.description_i18n || undefined,
                        price: String(payload.compound.price),
                        quantity: Number(payload.compound.quantity),
                        measurement: payload.compound.measurement,
                        department_id: payload.compound.department_id,
                        picture_url: payload.compound.picture_url || null,
                    },
                    ingredient_calculations: payload.ingredient_calculations || [],
                    compound_calculations: payload.compound_calculations || [],
                };

                const response = await poster<BackendResponse<any>>(
                    endpoints.compound.createWithCalculations,
                    payloadToSend
                );

                // Extract data from wrapped response
                let data: any;
                if ('compound' in response && 'calculations' in response) {
                    data = response;
                } else if (response?.data) {
                    data = response.data;
                } else {
                    throw new Error('Invalid response format');
                }

                // Revalidate compounds list
                await mutate(endpoints.compound.list);

                toast.success('Compound with calculations created successfully');
                return data;
            } catch (error) {
                toast.error('Failed to create compound with calculations');
                console.error('Failed to create compound with calculations:', error);
                throw error;
            }
        },
        []
    );

    return { createCompoundWithCalculations };
}

