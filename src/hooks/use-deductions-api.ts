import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface DeductionItem {
    ingredient_id: string;
    quantity: string;
}

export interface DeductionBatchItemInput {
    compound_id?: string;
    good_id?: string;
    ingredient_id?: string;
    quantity: string;
}

export interface Deduction {
    id: string;
    number: number;
    date: string;
    act_group_id: string;
    storage_id: string;
    description: string;
    status: string;
    balance: string;
    created_at: string;
    updated_at: string;
    storage_name?: string;  // Optional field from backend
    group_name?: string;    // Optional field from backend
    items?: DeductionItem[]; // Optional items array
    warnings?: string[];
    _expand?: {
        act_group_id?: DeductionGroup;
        storage_id?: {
            id: string;
            name: string;
            branch_id?: string;
            color_code?: string;
            picture_url?: string | null;
            created_at?: string;
            updated_at?: string;
            deleted_at?: number;
            name_i18n?: string;
        };
    };
}

export interface DeductionGroup {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export interface BackendPagination {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
}

export interface DeductionListParams {
    expand?: string;
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    storage_id?: string;
    act_group_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface DeductionListResult {
    items: Deduction[];
    pagination?: BackendPagination;
}

export interface UseDeductionsAPIReturn {
    getDeductions: (params?: DeductionListParams) => Promise<DeductionListResult>;
    getDeductionById: (id: string) => Promise<Deduction | null>;
    createDeduction: (data: {
        act_group_id: string;
        date: string;
        description: string;
        items: DeductionItem[];
        status: string;
        storage_id: string;
    }) => Promise<Deduction>;
    updateDeduction: (
        id: string,
        data: Partial<Deduction>
    ) => Promise<Deduction>;
    updateDeductionItemsBatch: (
        id: string,
        items: DeductionBatchItemInput[]
    ) => Promise<Deduction | null>;
    deleteDeduction: (id: string) => Promise<void>;
    getDeductionGroups: () => Promise<DeductionGroup[]>;
    createDeductionGroup: (data: { name: string }) => Promise<DeductionGroup>;
    updateDeductionGroup: (id: string, data: { name: string }) => Promise<DeductionGroup>;
    deleteDeductionGroup: (id: string) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDeductionsAPI(): UseDeductionsAPIReturn {
    const isBackendResponse = <T,>(value: unknown): value is BackendResponse<T> =>
        !!value && typeof value === 'object' && 'data' in (value as Record<string, unknown>);
    const normalizeDeductionBatchItems = (items: DeductionBatchItemInput[]): DeductionBatchItemInput[] =>
        items.map((item) => {
            const ingredientId = item.ingredient_id;
            return {
                compound_id: item.compound_id,
                good_id: item.good_id,
                ingredient_id: ingredientId,
                quantity: String(item.quantity),
            };
        });

    const extractListAndPagination = <T,>(
        payload: unknown
    ): { items: T[]; pagination?: BackendPagination } => {
        if (!payload || typeof payload !== 'object') return { items: [] };

        const obj = payload as Record<string, unknown>;

        if (obj.data && typeof obj.data === 'object') {
            const nested = obj.data as Record<string, unknown>;

            if (Array.isArray(nested.data)) {
                return {
                    items: nested.data as T[],
                    pagination:
                        nested.pagination && typeof nested.pagination === 'object'
                            ? (nested.pagination as BackendPagination)
                            : undefined,
                };
            }
        }

        if (Array.isArray(obj.data)) {
            return {
                items: obj.data as T[],
                pagination:
                    obj.pagination && typeof obj.pagination === 'object'
                        ? (obj.pagination as BackendPagination)
                        : undefined,
            };
        }

        return { items: [] };
    };

    /**
     * Barcha deductions'ni oladi
     */
    const getDeductions = useCallback(async (params?: DeductionListParams): Promise<DeductionListResult> => {
        try {
            const queryParams: Record<string, unknown> = {
                expand: params?.expand || 'act_group_id,storage_id',
                limit: typeof params?.limit === 'number' ? params.limit : 20,
                offset: typeof params?.offset === 'number' ? params.offset : 0,
            };
            if (params?.search) {
                queryParams.search = params.search;
            }
            if (params?.status) {
                queryParams.status = params.status;
            }
            if (params?.date_from) {
                queryParams.date_from = params.date_from;
            }
            if (params?.date_to) {
                queryParams.date_to = params.date_to;
            }
            if (params?.storage_id) {
                queryParams.storage_id = params.storage_id;
            }
            if (params?.act_group_id) {
                queryParams.act_group_id = params.act_group_id;
            }
            if (params?.sort_by) {
                queryParams.sort_by = params.sort_by;
            }
            if (params?.sort_order) {
                queryParams.sort_order = params.sort_order;
            }
            const response = await fetcher<unknown>([
                endpoints.deductions.list,
                { params: queryParams },
            ]);
            return extractListAndPagination<Deduction>(response);
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message =
                axiosError?.response?.data?.message ||
                'Failed to fetch deductions';
            toast.error(message);
            return { items: [] };
        }
    }, []);

    /**
     * ID orqali deduction'ni oladi
     */
    const getDeductionById = useCallback(
        async (id: string): Promise<Deduction | null> => {
            try {
                const endpoint = `${endpoints.deductions.list}/${id}`;
                const response = await fetcher<BackendResponse<Deduction>>(endpoint);
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to fetch deduction';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Yangi deduction yaratadi
     */
    const createDeduction = useCallback(
        async (data: {
            act_group_id: string;
            date: string;
            description: string;
            items: DeductionItem[];
            status: string;
            storage_id: string;
        }): Promise<Deduction> => {
            try {
                const response = await poster<BackendResponse<Deduction>>(
                    endpoints.deductions.create,
                    data
                );
                toast.success('Deduction successfully created');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to create deduction';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Deduction'ni yangilaydi
     */
    const updateDeduction = useCallback(
        async (
            id: string,
            data: Partial<Deduction>
        ): Promise<Deduction> => {
            try {
                const response = await putter<BackendResponse<Deduction>>(
                    endpoints.deductions.update(id),
                    data
                );
                toast.success('Deduction successfully updated');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to update deduction';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Deduction item'larini batch yangilaydi
     */
    const updateDeductionItemsBatch = useCallback(
        async (
            id: string,
            items: DeductionBatchItemInput[]
        ): Promise<Deduction | null> => {
            try {
                const normalizedItems = normalizeDeductionBatchItems(items);
                const response = await putter<BackendResponse<Deduction> | Deduction>(
                    endpoints.deductions.updateItemsBatch(id),
                    { items: normalizedItems }
                );
                const deduction = isBackendResponse<Deduction>(response)
                    ? response.data
                    : response;

                toast.success('Deduction items successfully updated');
                if (Array.isArray(deduction?.warnings) && deduction.warnings.length > 0) {
                    deduction.warnings.forEach((warning) => toast.warning(warning));
                }

                return deduction || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to update deduction items';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Deduction'ni o'chiradi
     */
    const deleteDeduction = useCallback(async (id: string): Promise<void> => {
        try {
            await deleter(endpoints.deductions.delete(id));
            toast.success('Deduction successfully deleted');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message =
                axiosError?.response?.data?.message ||
                'Failed to delete deduction';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Barcha deduction groups'ni oladi
     */
    const getDeductionGroups = useCallback(
        async (): Promise<DeductionGroup[]> => {
            try {
                const response = await fetcher<BackendResponse<DeductionGroup[]>>(
                    endpoints.deductions.groups
                );
                return response.data || [];
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to fetch deduction groups';
                toast.error(message);
                return [];
            }
        },
        []
    );

    /**
     * Yangi deduction group yaratadi
     */
    const createDeductionGroup = useCallback(
        async (data: { name: string }): Promise<DeductionGroup> => {
            try {
                const response = await poster<BackendResponse<DeductionGroup>>(
                    endpoints.deductions.createGroup,
                    data
                );
                toast.success('Deduction group successfully created');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to create deduction group';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Deduction group'ni o'chiradi
     */
    const deleteDeductionGroup = useCallback(
        async (id: string): Promise<void> => {
            try {
                await deleter(endpoints.deductions.deleteGroup(id));
                toast.success('Deduction group successfully deleted');
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to delete deduction group';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Deduction group'ni yangilaydi
     */
    const updateDeductionGroup = useCallback(
        async (id: string, data: { name: string }): Promise<DeductionGroup> => {
            try {
                const response = await putter<BackendResponse<DeductionGroup>>(
                    endpoints.deductions.updateGroup(id),
                    data
                );
                toast.success('Deduction group successfully updated');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to update deduction group';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return {
        getDeductions,
        getDeductionById,
        createDeduction,
        updateDeduction,
        updateDeductionItemsBatch,
        deleteDeduction,
        getDeductionGroups,
        createDeductionGroup,
        updateDeductionGroup,
        deleteDeductionGroup,
    };
}
