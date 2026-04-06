import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

export interface Supplier {
    id: string;
    name: string;
    phone_number?: string | null;
    email?: string | null;
    address?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

function extractSupplierList(payload: unknown): Supplier[] {
    if (Array.isArray(payload)) return payload as Supplier[];
    if (!payload || typeof payload !== 'object') return [];

    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) return obj.data as Supplier[];

    if (obj.data && typeof obj.data === 'object') {
        const nestedData = (obj.data as Record<string, unknown>).data;
        if (Array.isArray(nestedData)) return nestedData as Supplier[];
    }

    return [];
}

export function useSupplierAPI() {
    const getSuppliers = useCallback(async (): Promise<Supplier[]> => {
        try {
            const response = await fetcher<BackendResponse<Supplier[]>>(endpoints.supplier.list);
            return extractSupplierList(response);
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch suppliers';
            toast.error(message);
            return [];
        }
    }, []);

    const getSupplierById = useCallback(async (id: string): Promise<Supplier | null> => {
        try {
            const response = await fetcher<BackendResponse<Supplier>>(endpoints.supplier.details(id));
            // @ts-ignore
            return response.data || response || null;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch supplier';
            console.error('Error fetching supplier:', error);
            return null;
        }
    }, []);

    const createSupplier = useCallback(async (data: Partial<Supplier>): Promise<Supplier> => {
        try {
            // The API expects name and phone_number
            const payload = {
                name: data.name,
                phone_number: data.phone_number || null,
                email: data.email || null,
                address: data.address || null,
            };
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

    const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
        try {
            const payload = {
                name: data.name,
                phone_number: data.phone_number || null,
                email: data.email || null,
                address: data.address || null,
            };
            const response = await putter<BackendResponse<Supplier>>(endpoints.supplier.update(id), payload);
            // @ts-ignore
            toast.success('Supplier updated successfully');
            // @ts-ignore
            return response.data || response;
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to update supplier';
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
        getSupplierById,
        createSupplier,
        updateSupplier,
        deleteSuppliers,
    };
}
