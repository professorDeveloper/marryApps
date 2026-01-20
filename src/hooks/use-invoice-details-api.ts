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
    quantity: number;
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

export interface UseInvoiceDetailsAPIReturn {
    getInvoiceDetails: () => Promise<InvoiceDetail[]>;
    getInvoiceDetailById: (id: string) => Promise<InvoiceDetail | null>;
    createInvoiceDetail: (data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    updateInvoiceDetail: (id: string, data: Partial<InvoiceDetail>) => Promise<InvoiceDetail>;
    deleteInvoiceDetail: (id: string) => Promise<void>;
    deleteInvoiceDetails: (ids: string[]) => Promise<void>;
    getIngredients: () => Promise<any[]>;
    getInvoices: () => Promise<any[]>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useInvoiceDetailsAPI(): UseInvoiceDetailsAPIReturn {
    /**
     * Barcha invoice details'ni oladi
     */
    const getInvoiceDetails = useCallback(async (): Promise<InvoiceDetail[]> => {
        try {
            const response = await fetcher<BackendResponse<InvoiceDetail[]>>(endpoints.invoice.detailsList);
            return response.data || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoice details';
            toast.error(message);
            return [];
        }
    }, []);

    /**
     * ID orqali invoice detail'ni oladi
     */
    const getInvoiceDetailById = useCallback(async (id: string): Promise<InvoiceDetail | null> => {
        try {
            const details = await getInvoiceDetails();
            return details.find((d) => d.id === id) || null;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoice detail';
            toast.error(message);
            return null;
        }
    }, [getInvoiceDetails]);

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
    const getInvoices = useCallback(async (): Promise<any[]> => {
        try {
            const response = await fetcher<BackendResponse<any[]>>(endpoints.invoice.list);
            return response.data || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch invoices';
            toast.error(message);
            return [];
        }
    }, []);

    return {
        getInvoiceDetails,
        getInvoiceDetailById,
        createInvoiceDetail,
        updateInvoiceDetail,
        deleteInvoiceDetail,
        deleteInvoiceDetails,
        getIngredients,
        getInvoices,
    };
}
