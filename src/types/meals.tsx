// ============================================================================
// MEALS TYPES
// ============================================================================

export type IMealsTableFilters = {
    status?: string[];
};

/**
 * Backend API response uchun type
 */
export type IMealAPIResponse = {
    id: string;
    name: string;
    name_i18n?: string;
    name_en?: string;
    name_ru?: string;
    name_uz?: string;
    description: string;
    category_id: string;
    department_id: string;
    picture_url: string | null;
    price: string;
    cook_time: number;
    created_at: string;
    updated_at: string;
};

/**
 * Frontend'da ishlatiladigan enriched meal type
 */
export type IMealsItem = {
    id: string;
    name: string;
    name_i18n?: string;
    name_en?: string;
    name_ru?: string;
    name_uz?: string;
    description: string;
    category_id: string;
    category?: {
        id: string;
        name: string;
    };
    department_id: string;
    department?: {
        id: string;
        name: string;
    };
    picture_url: string | null;
    price: number;
    cook_time: number;
    created_at: string;
    updated_at: string;
    // UI uchun qo'shimcha fieldlar
    coverUrl?: string;
    avatar?: string; // Agar rasm bo'lmasa harflar
};
