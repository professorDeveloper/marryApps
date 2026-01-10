// ============================================================================
// CATEGORY TYPES
// ============================================================================

export type ICategory = {
    id: string;
    name: string;
    name_i18n?: string;
    picture_url?: string;
    storage_id?: string;
    department_id?: string;
    color_code?: string;
    created_at: string;
    updated_at: string;
    avatar?: string; // Avatar rasm URL yoki birinchi harf
};

export type ICategoryFormData = {
    name: string;
    name_i18n?: string;
    picture_url?: string;
    storage_id?: string;
    department_id?: string;
    color_code?: string;
};

export type ICategoryTableFilters = {
    status: string[];
};
