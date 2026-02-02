import type { AxiosError } from 'axios';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';
import type {
    IInventory,
    IInventoryItem,
    IInventoryFormData,
    IInventoryItemInput,
    BackendResponse,
} from 'src/types/inventory';

// ============================================================================
// HOOK
// ============================================================================

export function useInventoryAPI() {
    /**
     * Barcha inventories'ni oladi
     */
    const getInventories = useCallback(async (): Promise<IInventory[]> => {
        try {
            const response = await fetcher<BackendResponse<IInventory[]>>(
                endpoints.inventory.list
            );
            return response.data || [];
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message = axiosError?.response?.data?.message || 'Failed to fetch inventories';
            toast.error(message);
            return [];
        }
    }, []);

    /**
     * ID orqali inventory'ni oladi
     */
    const getInventoryById = useCallback(
        async (id: string): Promise<IInventory | null> => {
            try {
                const response = await fetcher<BackendResponse<IInventory>>(
                    endpoints.inventory.details(id)
                );
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to fetch inventory';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Yangi inventory'ni yaratadi
     */
    const createInventory = useCallback(
        async (data: IInventoryFormData): Promise<IInventory | null> => {
            try {
                const response = await poster<BackendResponse<IInventory>>(
                    endpoints.inventory.create,
                    data
                );
                toast.success('Ombor menusi successfully created');
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to create inventory';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Inventory'ni yangilaydi
     */
    const updateInventory = useCallback(
        async (id: string, data: Partial<IInventoryFormData>): Promise<IInventory | null> => {
            try {
                const response = await putter<BackendResponse<IInventory>>(
                    endpoints.inventory.update(id),
                    data
                );
                toast.success('Ombor menusi successfully updated');
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to update inventory';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Inventory'ni o'chiradi
     */
    const deleteInventory = useCallback(async (id: string): Promise<void> => {
        try {
            await deleter(endpoints.inventory.delete(id));
            toast.success('Ombor menusi successfully deleted');
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const message =
                axiosError?.response?.data?.message || 'Failed to delete inventory';
            toast.error(message);
            throw error;
        }
    }, []);

    /**
     * Inventory items'ni oladi
     */
    const getInventoryItems = useCallback(
        async (inventoryId: string): Promise<IInventoryItem[]> => {
            try {
                const response = await fetcher<BackendResponse<IInventoryItem[]> | IInventoryItem[]>(
                    endpoints.inventory.items(inventoryId)
                );
                // Handle both array and wrapped response
                if (Array.isArray(response)) {
                    return response;
                }
                return (response as BackendResponse<IInventoryItem[]>).data || [];
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to fetch inventory items';
                toast.error(message);
                return [];
            }
        },
        []
    );

    /**
     * Inventory items'ni batch qo'shadi
     */
    const createInventoryItemsBatch = useCallback(
        async (
            inventoryId: string,
            items: IInventoryItemInput[]
        ): Promise<IInventoryItem[] | null> => {
            try {
                const response = await poster<BackendResponse<IInventoryItem[]>>(
                    endpoints.inventory.createItems?.(inventoryId) ||
                    `/api/v1/inventories/${inventoryId}/items`,
                    { items }
                );
                toast.success('Inventory items successfully created');
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to create inventory items';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Inventory item'ni yangilaydi
     */
    const updateInventoryItem = useCallback(
        async (inventoryId: string, itemId: string, data: Partial<IInventoryItem>) => {
            try {
                const response = await putter<BackendResponse<IInventoryItem>>(
                    endpoints.inventory.updateItem(inventoryId, itemId),
                    data
                );
                toast.success('Inventory item successfully updated');
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to update inventory item';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Inventory item'ni o'chiradi
     */
    const deleteInventoryItem = useCallback(
        async (inventoryId: string, itemId: string): Promise<void> => {
            try {
                await deleter(
                    endpoints.inventory.deleteItem(inventoryId, itemId)
                );
                toast.success('Inventory item successfully deleted');
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to delete inventory item';
                toast.error(message);
                throw error;
            }
        },
        []
    );

    return {
        getInventories,
        getInventoryById,
        createInventory,
        updateInventory,
        deleteInventory,
        getInventoryItems,
        createInventoryItemsBatch,
        updateInventoryItem,
        deleteInventoryItem,
    };
}
