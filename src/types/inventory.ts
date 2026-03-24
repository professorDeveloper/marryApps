export interface IInventoryItem {
    id?: string;
    inventory_item_id?: string;
    inventory_id: string;
    ingredient_id: string;
    ingredient_name: string;
    ingredient_brand_id: string;
    ingredient_picture_url: string;
    ingredient_color_code: string;
    ingredient_measurement: string;
    price_per_unit: string;
    system_quantity: number;
    counted_quantity: number;
    difference_quantity: number;
    shortage_amount: string;
    surplus_amount: string;
    remaining_amount: string;
}

export interface IInventory {
    id: string;
    number: number;
    date: string;
    storage_id: string;
    description: string;
    status: 'active' | 'completed' | 'draft' | 'cancelled' | 'deleted';
    surplus_amount: string;
    shortage_amount: string;
    remaining_amount: string;
    created_at: string;
    updated_at: string;
    _expand?: {
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

export interface IInventoryFormData {
    date: string;
    status: 'active' | 'completed' | 'draft' | 'cancelled';
    storage_id: string;
    description?: string;
}

export interface IInventoryItemInput {
    ingredient_id: string;
    counted_quantity: string;
}

export interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    pagination?: IBackendPagination;
    code: number;
}

export interface IBackendPagination {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
}

export interface IInventoryListParams {
    search?: string;
    limit?: number;
    offset?: number;
}

export interface IInventoryListResult {
    items: IInventory[];
    pagination?: IBackendPagination;
}
