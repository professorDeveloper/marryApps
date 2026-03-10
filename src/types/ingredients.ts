export interface IIngredientItem {
    id: string;
    name: string;
    group_id: string;
    measurement: string;
    price_per_unit?: string;
    picture_url?: string;
    color_code?: string;
    brand_id?: string;
    created_at: string;
    updated_at: string;
    group_name?: string; // Enriched from ingredient groups
    _expand?: {
        group_id?: IIngredientGroup;
        name_i18n?: {
            id: string;
            en?: string;
            ru?: string;
            uz?: string;
            'uz-Latn'?: string;
            'uz-Cyrl'?: string;
            created_at?: string;
            updated_at?: string;
        };
    };
}

export interface IIngredientFormData {
    name: string;
    group_id: string;
    measurement: string;
    price_per_unit?: string;
    picture_url?: string;
    color_code?: string;
    brand_id?: string;
}

export interface IIngredientGroup {
    id: string;
    name: string;
    picture_url?: string;
    color_code?: string;
    created_at: string;
    updated_at: string;
}

export interface IIngredientTableFilters {
    search?: string;
    group_id?: string;
}

export interface IIngredientResponse {
    status: string;
    message: string;
    data: IIngredientItem[];
    pagination?: {
        total?: number;
        limit?: number;
        offset?: number;
        total_pages?: number;
    };
    total?: number;
    limit?: number;
    offset?: number;
    code: number;
}

export interface IIngredientGroupResponse {
    status: string;
    message: string;
    data: IIngredientGroup[];
    code: number;
}
