import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, deleter, fetcher, endpoints } from 'src/lib/axios';

export interface Supplier {
    id: string;
    name: string;
    phone_number?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

export function useSupplierAPI() {
    const getSuppliers = useCallback(async (): Promise<Supplier[]> => {
        try {
            const response = await fetcher<BackendResponse<Supplier[]>>(endpoints.supplier.list);
            // Some endpoints return { data: [...] } and some return the array directly. Handle both.
            // @ts-ignore
            return response.data || response || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch suppliers';
            toast.error(message);
            return [];
        }
    }, []);

    const createSupplier = useCallback(async (data: Partial<Supplier>): Promise<Supplier> => {
        try {
            // The API expects name and phone_number
            const payload = { name: data.name, phone_number: data.phone_number };
            const response = await poster<BackendResponse<Supplier>>(endpoints.supplier.create, payload);
            // @ts-ignore
            toast.success('Supplier created successfully');
            // @ts-ignore
            return response.data || response;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to create supplier';
            toast.error(message);
            throw error;
        }
    }, []);

    const deleteSuppliers = useCallback(async (ids: string[]): Promise<void> => {
        try {
            // If API supports bulk delete, use appropriate endpoint; fallback to parallel deletes
            await Promise.all(ids.map((id) => deleter(endpoints.supplier.delete(id))));
            toast.success('Suppliers deleted successfully');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to delete suppliers';
            toast.error(message);
            throw error;
        }
    }, []);

    return {
        getSuppliers,
        createSupplier,
        deleteSuppliers,
    };
}
