export interface IIngredientStock {
    id: string;
    ingredient_id: string;
    quantity: string;
    storage_id: string;
    created_at: string;
    updated_at: string;
    // Enriched fields
    ingredient_name?: string;
    storage_name?: string;
    measurement?: string;
}

export interface IIngredientStockFormData {
    quantity: string;
}

export interface IIngredientStockResponse {
    status: string;
    message: string;
    data: IIngredientStock | IIngredientStock[];
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
    };
    code: number;
}
