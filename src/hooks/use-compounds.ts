import type { SWRConfiguration } from 'swr';
import type { ICompound } from 'src/types/compounds';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';
import { useGetDepartments } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';

// ============================================================================
// CONFIGURATION
// ============================================================================

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

// ============================================================================
// TYPES
// ============================================================================

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
 * Enrich compounds with department names
 */
function enrichCompounds(
    compoundsData: ICompound[],
    departments: any[]
): ICompound[] {
    const departmentMap = new Map(
        departments?.map((dept: any) => [dept.id, dept.name]) || []
    );

    return compoundsData.map((compound) => ({
        ...compound,
        department_name: departmentMap.get(compound.department_id) || 'Unknown',
    }));
}

/**
 * Enrich single compound with department name
 */
function enrichCompound(compoundData: ICompound, departments: any[]): ICompound {
    const departmentMap = new Map(
        departments?.map((dept: any) => [dept.id, dept.name]) || []
    );

    return {
        ...compoundData,
        department_name: departmentMap.get(compoundData.department_id) || 'Unknown',
    };
}

// ============================================================================
// COMPOUNDS HOOKS
// ============================================================================

/**
 * Get all compounds with enriched department names
 */
export function useGetCompounds() {
    const url = endpoints.compound.list;

    // Get departments for enrichment
    const { departments } = useGetDepartments();

    const { data, isLoading, error, isValidating, mutate: mutateCompounds } = useSWR<
        BackendResponse<ICompound[]> | ICompound[]
    >(url, fetcher, { ...swrOptions });

    const enrichedCompounds = useMemo(() => {
        let compoundsData: ICompound[] = [];

        if (Array.isArray(data)) {
            compoundsData = data;
        } else if (data?.data && Array.isArray(data.data)) {
            compoundsData = data.data;
        }

        return enrichCompounds(compoundsData, departments);
    }, [data, departments]);

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
 * Get single compound by ID with enriched department name
 */
export function useGetCompound(compoundId: string) {
    const url = compoundId ? endpoints.compound.details(compoundId) : null;

    // Get departments for enrichment
    const { departments } = useGetDepartments();

    const { data, isLoading, error, isValidating, mutate: mutateCompound } = useSWR<
        BackendResponse<ICompound> | ICompound
    >(url, fetcher, { ...swrOptions });

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

        return enrichCompound(compoundData, departments);
    }, [data, departments]);

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
                    description: formData.description || '',
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
                    description: formData.description || '',
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

                // Revalidate compounds list and single compound
                await mutate(endpoints.compound.list);
                await mutate(endpoints.compound.details(compoundId));

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

