import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceDetail {
    id: string;
    invoice_id: string;
    ingredient_id: string;
    quantity: string | number;
    price: string;
    price_per_unit: string;
    created_at: string;
    updated_at: string;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export interface InvoiceListFilters {
    date_from?: string;
    date_to?: string;
    storage_id?: string;
    supplier_id?: string;
    ingredient_id?: string;
    status?: string;
    expand?: string;
    search?: string;
    ingredient_ids?: string[];
    general_search?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface InvoiceListResponse<T = any> {
    items: T[];
    total: number;
    limit?: number;
    offset?: number;
}

export interface UseInvoiceDetailsAPIReturn {
    getInvoiceDetails: () => Promise<InvoiceDetail[]>;
    getInvoiceDetailById: (id: string) => Promise<InvoiceDetail | null>;
    createInvoiceDetail: (data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    updateInvoiceDetail: (id: string, data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    deleteInvoiceDetail: (id: string) => Promise<void>;
    deleteInvoiceDetails: (ids: string[]) => Promise<void>;
    createInvoiceDetailsBatch: (data: Array<Partial<InvoiceDetail>>) => Promise<InvoiceDetail[]>;
    createInvoiceBatch: (data: any) => Promise<any>;
    getIngredients: () => Promise<any[]>;
    getInvoices: (filters?: InvoiceListFilters) => Promise<any[]>;
    getInvoicesPage: (filters?: InvoiceListFilters) => Promise<InvoiceListResponse>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useInvoiceDetailsAPI(): UseInvoiceDetailsAPIReturn {
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
        assignIfPresent('search', filters.search);
        assignIfPresent('limit', filters.limit);
        assignIfPresent('offset', filters.offset);
        assignIfPresent('sort_by', filters.sort_by);
        assignIfPresent('sort_order', filters.sort_order);

        if (filters.ingredient_ids && Array.isArray(filters.ingredient_ids) && filters.ingredient_ids.length > 0) {
            params.ingredient_ids = filters.ingredient_ids.join(',');
        }

        assignIfPresent('general_search', filters.general_search);

        return params;
    };

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

    const extractListAndPagination = <T,>(
        payload: unknown
    ): { items: T[]; total: number; limit?: number; offset?: number } => {
        const { items, total } = extractListAndMeta<T>(payload);
        if (!payload || typeof payload !== 'object') {
            return { items, total: typeof total === 'number' ? total : items.length };
        }

        const obj = payload as Record<string, unknown>;
        const pagination =
            obj.pagination && typeof obj.pagination === 'object'
                ? (obj.pagination as Record<string, unknown>)
                : undefined;

        const totalFromPagination =
            pagination && typeof pagination.total === 'number' ? pagination.total : undefined;
        const limitFromPagination =
            pagination && typeof pagination.limit === 'number' ? pagination.limit : undefined;
        const offsetFromPagination =
            pagination && typeof pagination.offset === 'number' ? pagination.offset : undefined;

        return {
            items,
            total:
                typeof totalFromPagination === 'number'
                    ? totalFromPagination
                    : typeof total === 'number'
                        ? total
                        : items.length,
            limit: limitFromPagination,
            offset: offsetFromPagination,
        };
    };

    /**
     * Barcha invoice details'ni oladi
     */
    const getInvoiceDetails = useCallback(async (): Promise<InvoiceDetail[]> => {
        try {
            const result: InvoiceDetail[] = [];
            let offset = 0;

            while (result.length < MAX_LIST_ITEMS) {
                const response = await fetcher<unknown>([
                    endpoints.invoice.detailsList,
                    { params: { limit: MAX_LIST_ITEMS, offset } },
                ]);

                const { items, total } = extractListAndMeta<InvoiceDetail>(response);
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
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoice details';
            toast.error(message);
            return [];
        }
    }, [MAX_LIST_ITEMS]);

    /**
     * ID orqali invoice detail'ni oladi
     */
    const getInvoiceDetailById = useCallback(async (id: string): Promise<InvoiceDetail | null> => {
        try {
            // Agar endpoint bo'lsa uni ishlatamiz
            const endpoint = `${endpoints.invoice.detailsList}/${id}`;
            const response = await fetcher<BackendResponse<InvoiceDetail>>(endpoint);
            return response.data || null;
        } catch (error) {
            // Agar GET /id endpoint bo'lmasa, barcha details'ni olip id'si orqali qidiramiz
            try {
                const response = await fetcher<BackendResponse<InvoiceDetail[]>>(
                    endpoints.invoice.detailsList
                );
                const details = response.data || [];
                return details.find((d) => d.id === id) || null;
            } catch (fallbackError) {
                const axiosError = fallbackError as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to fetch invoice detail';
                toast.error(message);
                return null;
            }
        }
    }, []);

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
                toast.success('Kirim successfully created');
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
                toast.success('Kirim successfully updated');
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
            toast.success('Kirim successfully deleted');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete invoice detail';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Bir nechta invoice details'ni o'chiradi
     */
    const deleteInvoiceDetails = useCallback(async (ids: string[]): Promise<void> => {
        try {
            await Promise.all(ids.map((id) => deleter(endpoints.invoice.detailsDelete(id))));
            toast.success('Kirimlar successfully deleted');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete invoice details';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Batch shaklida invoice details'ni yaratadi
     */
    const createInvoiceDetailsBatch = useCallback(
        async (data: Array<Partial<InvoiceDetail>>): Promise<InvoiceDetail[]> => {
            try {
                const response = await poster<BackendResponse<InvoiceDetail[]>>(
                    endpoints.invoice.detailsBatch,
                    data
                );
                toast.success('Invoice details batch created successfully');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to create invoice details batch';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    /**
     * Invoice va details batch shaklida yaratadi
     */
    const createInvoiceBatch = useCallback(
        async (data: any): Promise<any> => {
            try {
                const response = await poster<BackendResponse<any>>(
                    endpoints.invoice.batch,
                    data
                );
                toast.success('Invoice batch created successfully');
                return response.data;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to create invoice batch';
                toast.error(message);
                throw error;
            }
        },
        []
    );

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
     * Barcha invoices'ni oladi
     */
    const getInvoices = useCallback(async (filters?: InvoiceListFilters): Promise<any[]> => {
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
                const { items } = extractListAndMeta<any>(response);
                return items.slice(0, MAX_LIST_ITEMS);
            }

            if (typeof params.limit === 'number') {
                const response = await fetcher<unknown>([
                    endpoints.invoice.list,
                    { params },
                ]);

                const { items } = extractListAndMeta<any>(response);
                return items.slice(0, MAX_LIST_ITEMS);
            }

            const result: any[] = [];
            let offset = typeof params.offset === 'number' ? params.offset : 0;

            while (result.length < MAX_LIST_ITEMS) {
                const response = await fetcher<unknown>([
                    endpoints.invoice.list,
                    { params: { ...params, limit: MAX_LIST_ITEMS, offset } },
                ]);

                const { items, total } = extractListAndMeta<any>(response);
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
     * Server-side pagination bilan invoices'ni oladi
     */
    const getInvoicesPage = useCallback(
        async (filters?: InvoiceListFilters): Promise<InvoiceListResponse> => {
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
                                limit: typeof params.limit === 'number' ? params.limit : 20,
                                offset: typeof params.offset === 'number' ? params.offset : 0,
                            },
                        },
                    ]);

                    return extractListAndPagination<any>(response);
                }

                const response = await fetcher<unknown>([
                    endpoints.invoice.list,
                    {
                        params: {
                            ...params,
                            limit: typeof params.limit === 'number' ? params.limit : 20,
                            offset: typeof params.offset === 'number' ? params.offset : 0,
                        },
                    },
                ]);

                return extractListAndPagination<any>(response);
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message = axiosError?.response?.data?.message || 'Failed to fetch invoices';
                toast.error(message);
                return { items: [], total: 0 };
            }
        },
        []
    );

    return {
        getInvoiceDetails,
        getInvoiceDetailById,
        createInvoiceDetail,
        updateInvoiceDetail,
        deleteInvoiceDetail,
        deleteInvoiceDetails,
        createInvoiceDetailsBatch,
        createInvoiceBatch,
        getIngredients,
        getInvoices,
        getInvoicesPage,
    };
}

// ============================================================================
// STANDALONE HELPERS — usable outside the hook (e.g. as SWR fetchers)
// ============================================================================

const DETAILS_PAGE_SIZE = 500;
// Hard stop so a wrong `total` from the backend can never loop forever
const DETAILS_MAX_PAGES = 8;

function extractDetailsPage(payload: unknown): { items: any[]; total?: number } {
    if (Array.isArray(payload)) return { items: payload };
    if (!payload || typeof payload !== 'object') return { items: [] };

    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
        return { items: obj.data, total: typeof obj.total === 'number' ? obj.total : undefined };
    }

    if (obj.data && typeof obj.data === 'object') {
        const nested = obj.data as Record<string, unknown>;
        if (Array.isArray(nested.data)) {
            return {
                items: nested.data,
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
}

/**
 * Fetches every detail row of a single invoice in pages, replacing the old
 * one-shot `limit=2000` request: small invoices transfer only what they have,
 * and large payloads are parsed in bounded slices instead of one main-thread spike.
 */
export async function fetchInvoiceDetailsByInvoiceId(invoiceId: string): Promise<any[]> {
    const all: any[] = [];

    for (let page = 0; page < DETAILS_MAX_PAGES; page += 1) {
        const response = await fetcher<unknown>([
            `/api/v1/invoice-details/invoice/${invoiceId}`,
            { params: { limit: DETAILS_PAGE_SIZE, offset: all.length } },
        ]);

        const { items, total } = extractDetailsPage(response);
        all.push(...items);

        if (items.length < DETAILS_PAGE_SIZE) break;
        if (typeof total === 'number' && all.length >= total) break;
    }

    return all;
}

/** SWR key for one invoice's details; null disables fetching. */
export const invoiceDetailsByInvoiceKey = (invoiceId: string | null | undefined) =>
    invoiceId ? (['invoice-details/by-invoice', invoiceId] as const) : null;
