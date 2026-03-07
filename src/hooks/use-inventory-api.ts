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

interface IInventoryBatchCreatePayload extends IInventoryFormData {
    items: IInventoryItemInput[];
    description_i18n?: string;
}

interface IInventoryBatchCreateResult {
    inventory: IInventory;
    items: IInventoryItem[];
}

const normalizeInventoryItemsResponse = (
    response: BackendResponse<IInventoryItem[]> | IInventoryItem[] | null | undefined
): IInventoryItem[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    return response.data || [];
};

const buildFallbackInventory = (
    inventoryId: string,
    formData: IInventoryFormData
): IInventory => ({
    id: inventoryId,
    number: 0,
    date: formData.date,
    storage_id: formData.storage_id,
    description: formData.description || '',
    status: formData.status,
    surplus_amount: '0',
    shortage_amount: '0',
    remaining_amount: '0',
    created_at: '',
    updated_at: '',
});

const normalizeInventoryBatchCreateResponse = (
    response: unknown,
    formData: IInventoryFormData
): IInventoryBatchCreateResult | null => {
    if (Array.isArray(response)) {
        const items = response as IInventoryItem[];
        const inferredId = items[0]?.inventory_id;
        if (!inferredId) return null;
        return {
            inventory: buildFallbackInventory(inferredId, formData),
            items,
        };
    }

    if (!response || typeof response !== 'object') return null;

    const envelope = response as Record<string, unknown>;
    const rawData =
        envelope.data && typeof envelope.data === 'object'
            ? (envelope.data as Record<string, unknown>)
            : envelope;

    const items = Array.isArray(rawData.items)
        ? (rawData.items as IInventoryItem[])
        : Array.isArray(rawData.inventory_items)
            ? (rawData.inventory_items as IInventoryItem[])
            : [];

    const inventoryFromPayload =
        rawData.inventory && typeof rawData.inventory === 'object'
            ? (rawData.inventory as IInventory)
            : rawData.id && typeof rawData.id === 'string'
                ? (rawData as unknown as IInventory)
                : null;

    if (inventoryFromPayload) {
        return { inventory: inventoryFromPayload, items };
    }

    const inferredId =
        (typeof rawData.inventory_id === 'string' ? rawData.inventory_id : null) ||
        items[0]?.inventory_id;

    if (!inferredId) return null;

    return {
        inventory: buildFallbackInventory(inferredId, formData),
        items,
    };
};

export function useInventoryAPI() {
    const MAX_LIST_ITEMS = 500;

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
     * Barcha inventories'ni oladi
     */
    const getInventories = useCallback(async (): Promise<IInventory[]> => {
        try {
            const result: IInventory[] = [];
            let offset = 0;

            while (result.length < MAX_LIST_ITEMS) {
                const response = await fetcher<unknown>([
                    endpoints.inventory.list,
                    { params: { limit: MAX_LIST_ITEMS, offset } },
                ]);

                const { items, total } = extractListAndMeta<IInventory>(response);
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
            const message = axiosError?.response?.data?.message || 'Failed to fetch inventories';
            toast.error(message);
            return [];
        }
    }, [MAX_LIST_ITEMS]);

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
                const response = await poster<BackendResponse<IInventoryItem[]> | IInventoryItem[]>(
                    endpoints.inventory.createItems?.(inventoryId) ||
                    `/api/v1/inventories/${inventoryId}/items`,
                    { items }
                );
                toast.success('Inventory items successfully created');
                return normalizeInventoryItemsResponse(response);
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
     * Inventory va item'larni bitta so'rovda yaratadi
     */
    const createInventoryBatch = useCallback(
        async (data: IInventoryBatchCreatePayload): Promise<IInventoryBatchCreateResult | null> => {
            try {
                const response = await poster<unknown>(
                    endpoints.inventory.batch,
                    data
                );

                const normalized = normalizeInventoryBatchCreateResponse(response, data);
                if (!normalized) {
                    toast.error('Failed to parse inventory batch response');
                    return null;
                }

                toast.success('Inventory successfully created');
                return normalized;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to create inventory batch';
                toast.error(message);
                return null;
            }
        },
        []
    );

    /**
     * Inventory items'ni batch yangilaydi
     */
    const updateInventoryItemsBatch = useCallback(
        async (
            inventoryId: string,
            items: IInventoryItemInput[]
        ): Promise<IInventoryItem[] | null> => {
            try {
                const response = await putter<BackendResponse<IInventoryItem[]> | IInventoryItem[]>(
                    endpoints.inventory.updateItemsBatch(inventoryId),
                    { items }
                );
                toast.success('Inventory items successfully updated');
                return normalizeInventoryItemsResponse(response);
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message ||
                    'Failed to update inventory items';
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

    /**
     * Inventory'ni apply qiladi (calculation saqlaydi)
     */
    const applyInventory = useCallback(
        async (inventoryId: string): Promise<IInventory | null> => {
            try {
                const response = await poster<BackendResponse<IInventory>>(
                    endpoints.inventory.apply(inventoryId),
                    {} // Empty body
                );
                toast.success('Inventory successfully applied');
                return response.data || null;
            } catch (error) {
                const axiosError = error as AxiosError<any>;
                const message =
                    axiosError?.response?.data?.message || 'Failed to apply inventory';
                toast.error(message);
                return null;
            }
        },
        []
    );

    return {
        getInventories,
        getInventoryById,
        createInventory,
        createInventoryBatch,
        updateInventory,
        deleteInventory,
        getInventoryItems,
        createInventoryItemsBatch,
        updateInventoryItemsBatch,
        updateInventoryItem,
        deleteInventoryItem,
        applyInventory,
    };
}
