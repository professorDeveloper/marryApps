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
    quantity: number;
    price: string;
    price_per_unit: string;
    created_at?: string;
    updated_at?: string;
    ingredient_name?: string; // Enriched field
}

export interface InvoiceBatchPayload {
    invoice: Partial<Invoice>;
    details: Partial<InvoiceDetail>[];
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export interface UseInvoiceAPIReturn {
    getInvoices: () => Promise<Invoice[]>;
    getInvoiceById: (id: string) => Promise<Invoice | null>;
    createInvoice: (data: Partial<Invoice>) => Promise<Invoice>;
    updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice>;
    deleteInvoice: (id: string) => Promise<void>;
    deleteInvoices: (ids: string[]) => Promise<void>;
    createInvoiceDetail: (data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    updateInvoiceDetail: (id: string, data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    deleteInvoiceDetail: (id: string) => Promise<void>;
    createInvoiceBatch: (payload: InvoiceBatchPayload) => Promise<Invoice>;
    getIngredients: () => Promise<any[]>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useInvoiceAPI(): UseInvoiceAPIReturn {
    /**
     * Barcha invoices'ni oladi
     */
    const getInvoices = useCallback(async (): Promise<Invoice[]> => {
        try {
            const response = await fetcher<BackendResponse<Invoice[]>>(endpoints.invoice.list);
            return response.data || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoices';
            toast.error(message);
            return [];
        }
    }, []);

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
     * Invoice'ni o'chiradi
     */
    const deleteInvoice = useCallback(async (id: string): Promise<void> => {
        try {
            await deleter(endpoints.invoice.delete(id));
            toast.success('Invoice deleted successfully');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete invoice';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Bir nechta invoices'ni o'chiradi
     */
    const deleteInvoices = useCallback(async (ids: string[]): Promise<void> => {
        try {
            await Promise.all(ids.map((id) => deleter(endpoints.invoice.delete(id))));
            toast.success('Invoices deleted successfully');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete invoices';
            toast.error(message);
            throw error;
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
        getIngredients,
    };
}
