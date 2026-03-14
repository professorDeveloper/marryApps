// ============================================================================
// COMPOUNDS (SEMIFINISHED PRODUCTS) TYPES
// ============================================================================

export type ISemifinishedTableFilters = {
    status?: string[];
    name?: string;
    ingredientGroupId?: string;
};

export type ICompound = {
    id: string;
    name: string;
    name_i18n?: string;
    description?: string;
    description_i18n?: string;
    description_en?: string;
    description_ru?: string;
    description_uz?: string;
    quantity: number;
    measurement: string;
    picture_url?: string | null;
    price: string | number;
    ingredient_group_id: string;
    ingredient_group_name?: string; // Will be fetched from ingredient groups API
    created_at: string;
    updated_at: string;
};

// Legacy type for compatibility - maps to ICompound
export type ISemifinishedItem = ICompound;
