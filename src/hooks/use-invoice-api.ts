import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface Invoice {
    id: string;
    supplier_id: string;
    storage_id?: string;
    total_amount: string;
    status: string;
    date: string;
    created_at?: string;
    updated_at?: string;
}

export interface InvoiceDetail {
    id?: string;
    invoice_id: string;
    ingredient_id: string;
    quantity: string | number;
    price: string;
    price_per_unit: string;
    created_at?: string;
    updated_at?: string;
    ingredient_name?: string; // Enriched field
}

export interface InvoiceListFilters {
    date_from?: string;
    date_to?: string;
    storage_id?: string;
    supplier_id?: string;
    ingredient_id?: string;
    status?: string;
    expand?: string;
    q?: string;
    limit?: number;
    offset?: number;
}

export interface InvoiceBatchPayload {
    invoice: Partial<Invoice>;
    details: Partial<InvoiceDetail>[];
}

export interface InvoiceDetailsBatchItemInput {
    ingredient_id: string;
    quantity: string;
    price_per_unit: string;
    price: string;
}

export interface InvoiceDetailsBatchUpdateResponse {
    details: InvoiceDetail[];
    success?: number;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

interface InvoiceBatchDeletePayload {
    ids?: string[];
}

export interface UseInvoiceAPIReturn {
    getInvoices: (filters?: InvoiceListFilters) => Promise<Invoice[]>;
    getInvoiceById: (id: string) => Promise<Invoice | null>;
    createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
    updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice>;
    deleteInvoice: (id: string) => Promise<void>;
    deleteInvoices: (ids: string[]) => Promise<void>;
    createInvoiceDetail: (data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    updateInvoiceDetail: (id: string, data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    deleteInvoiceDetail: (id: string) => Promise<void>;
    createInvoiceBatch: (payload: InvoiceBatchPayload) => Promise<Invoice>;
    updateInvoiceDetailsBatch: (
        id: string,
        details: InvoiceDetailsBatchItemInput[]
    ) => Promise<InvoiceDetailsBatchUpdateResponse>;
    getIngredients: () => Promise<any[]>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useInvoiceAPI(): UseInvoiceAPIReturn {
    const MAX_LIST_ITEMS = 500;

    const buildListParams = (filters?: InvoiceListFilters): Record<string, string | number> => {
        if (!filters) return {};

        const params: Record<string, string | number> = {};

        const assignIfPresent = (key: keyof InvoiceListFilters, value?: string | number) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'string' && value.trim() === '') return;
            params[key] = value;
        };

        assignIfPresent('date_from', filters.date_from);
        assignIfPresent('date_to', filters.date_to);
        assignIfPresent('storage_id', filters.storage_id);
        assignIfPresent('supplier_id', filters.supplier_id);
        assignIfPresent('ingredient_id', filters.ingredient_id);
        assignIfPresent('status', filters.status);
        assignIfPresent('expand', filters.expand);
        assignIfPresent('q', filters.q);
        assignIfPresent('limit', filters.limit);
        assignIfPresent('offset', filters.offset);

        return params;
    };

    const isBackendResponse = <T,>(value: unknown): value is BackendResponse<T> =>
        !!value && typeof value === 'object' && 'data' in (value as Record<string, unknown>);

    const extractListAndMeta = <T,>(payload: unknown): { items: T[]; total?: number } => {
        if (!payload || typeof payload !== 'object') return { items: [] };

        const obj = payload as Record<string, unknown>;

        if (Array.isArray(obj.data)) {
            return {
                items: obj.data as T[],
                total: typeof obj.total === 'number' ? obj.total : undefined,
            };
        }

        if (obj.data && typeof obj.data === 'object') {
            const nested = obj.data as Record<string, unknown>;
            if (Array.isArray(nested.data)) {
                return {
                    items: nested.data as T[],
                    total:
                        typeof nested.total === 'number'
                            ? nested.total
                            : typeof obj.total === 'number'
                                ? obj.total
                                : undefined,
                };
            }
        }

        return { items: [] };
    };

    /**
     * Barcha invoices'ni oladi
     */
    const getInvoices = useCallback(async (filters?: InvoiceListFilters): Promise<Invoice[]> => {
        try {
            const params = buildListParams(filters);
            const searchQuery = typeof params.q === 'string' ? params.q.trim() : '';
            if (searchQuery) {
                delete params.q;
                const response = await fetcher<unknown>([
                    endpoints.invoice.search,
                    {
                        params: {
                            ...params,
                            q: searchQuery,
                            limit: typeof params.limit === 'number' ? params.limit : MAX_LIST_ITEMS,
                            offset: typeof params.offset === 'number' ? params.offset : 0,
                        },
                    },
                ]);

                const { items } = extractListAndMeta<Invoice>(response);
                return items.slice(0, MAX_LIST_ITEMS);
            }

            if (typeof params.limit === 'number') {
                const response = await fetcher<unknown>([
                    endpoints.invoice.list,
                    { params },
                ]);

                const { items } = extractListAndMeta<Invoice>(response);
                return items.slice(0, MAX_LIST_ITEMS);
            }

            const result: Invoice[] = [];
            let offset = typeof params.offset === 'number' ? params.offset : 0;

            while (result.length < MAX_LIST_ITEMS) {
                const response = await fetcher<unknown>([
                    endpoints.invoice.list,
                    { params: { ...params, limit: MAX_LIST_ITEMS, offset } },
                ]);

                const { items, total } = extractListAndMeta<Invoice>(response);
                if (!items.length) break;

                result.push(...items);

                const reachedTotal =
                    typeof total === 'number' ? offset + items.length >= total : false;

                if (reachedTotal || items.length >= MAX_LIST_ITEMS || result.length >= MAX_LIST_ITEMS) {
                    break;
                }

                offset += items.length;
            }

            return result.slice(0, MAX_LIST_ITEMS);
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoices';
            toast.error(message);
            return [];
        }
    }, [MAX_LIST_ITEMS]);

    /**
     * ID orqali invoice'ni oladi
     */
    const getInvoiceById = useCallback(async (id: string): Promise<Invoice | null> => {
        try {
            const response = await fetcher<BackendResponse<Invoice>>(endpoints.invoice.details(id));
            return response.data || null;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoice';
            toast.error(message);
            return null;
        }
    }, []);

    /**
     * Yangi invoice'ni yaratadi
     */
    const createInvoice = useCallback(async (data: Partial<Invoice>): Promise<Invoice> => {
        try {
            const response = await poster<BackendResponse<Invoice>>(endpoints.invoice.create, data);
            toast.success('Invoice created successfully');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to create invoice';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Invoice'ni yangilaydi
     */
    const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
        try {
            const response = await putter<BackendResponse<Invoice>>(endpoints.invoice.update(id), data);
            toast.success('Invoice updated successfully');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to update invoice';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Bir yoki bir nechta invoice'ni batch endpoint orqali o'chiradi / bekor qiladi
     */
    const deleteInvoices = useCallback(async (ids: string[]): Promise<void> => {
        const normalizedIds = ids.filter(Boolean);

        if (!normalizedIds.length) {
            return;
        }

        try {
            await deleter(endpoints.invoice.batch, { data: { ids: normalizedIds } as InvoiceBatchDeletePayload });
            toast.success(
                normalizedIds.length === 1
                    ? 'Invoice deleted successfully'
                    : 'Invoices deleted successfully'
            );
            return;
        } catch (error) {
        const axiosError = error as AxiosError<any>;
        const message = axiosError?.response?.data?.message || 'Failed to delete invoices';
        toast.error(message);
        throw error;
        }
    }, []);

    const deleteInvoice = useCallback(async (id: string): Promise<void> => {
        await deleteInvoices([id]);
    }, [deleteInvoices]);

    /**
     * Yangi invoice detail'ni yaratadi
     */
    const createInvoiceDetail = useCallback(
        async (data: Partial<InvoiceDetail>): Promise<InvoiceDetail> => {
            try {
                const response = await poster<BackendResponse<InvoiceDetail>>(
                    endpoints.invoice.detailsCreate,
                    data
                );
                toast.success('Invoice detail created successfully');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to create invoice detail';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Invoice detail'ni yangilaydi
     */
    const updateInvoiceDetail = useCallback(
        async (id: string, data: Partial<InvoiceDetail>): Promise<InvoiceDetail> => {
            try {
                const response = await putter<BackendResponse<InvoiceDetail>>(
                    endpoints.invoice.detailsUpdate(id),
                    data
                );
                toast.success('Invoice detail updated successfully');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to update invoice detail';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Invoice detail'ni o'chiradi
     */
    const deleteInvoiceDetail = useCallback(async (id: string): Promise<void> => {
        try {
            await deleter(endpoints.invoice.detailsDelete(id));
            toast.success('Invoice detail deleted successfully');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete invoice detail';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Barcha ingredients'ni oladi
     */
    const getIngredients = useCallback(async (): Promise<any[]> => {
        try {
            const response = await fetcher<BackendResponse<any[]>>(endpoints.ingredient.list);
            return response.data || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch ingredients';
            toast.error(message);
            return [];
        }
    }, []);

    /**
     * Invoice va details'ni batch qilib yaratadi
     */
    const createInvoiceBatch = useCallback(async (payload: InvoiceBatchPayload): Promise<Invoice> => {
        try {
            const response = await poster<BackendResponse<Invoice>>(endpoints.invoice.batch, payload);
            toast.success('Invoice created successfully');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to create invoice batch';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Mavjud invoice detail'larini batch yangilaydi
     */
    const updateInvoiceDetailsBatch = useCallback(
        async (
            id: string,
            details: InvoiceDetailsBatchItemInput[]
        ): Promise<InvoiceDetailsBatchUpdateResponse> => {
            try {
                const response = await putter<
                    BackendResponse<InvoiceDetailsBatchUpdateResponse> | InvoiceDetailsBatchUpdateResponse
                >(endpoints.invoice.updateDetailsBatch(id), { details });

                const normalized = isBackendResponse<InvoiceDetailsBatchUpdateResponse>(response)
                    ? response.data
                    : response;

                toast.success('Invoice details updated successfully');
                return normalized;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to update invoice details batch';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return {
        getInvoices,
        getInvoiceById,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        deleteInvoices,
        createInvoiceDetail,
        updateInvoiceDetail,
        deleteInvoiceDetail,
        createInvoiceBatch,
        updateInvoiceDetailsBatch,
        getIngredients,
    };
}
