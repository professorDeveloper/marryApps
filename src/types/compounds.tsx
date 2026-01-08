// ============================================================================
// COMPOUNDS (SEMIFINISHED PRODUCTS) TYPES
// ============================================================================

export type ISemifinishedTableFilters = {
    status?: string[];
    name?: string;
    departmentId?: string;
};

export type ICompound = {
    id: string;
    name: string;
    name_i18n?: string;
    description?: string;
    quantity: number;
    measurement: string;
    picture_url?: string | null;
    price: string | number;
    department_id: string;
    department_name?: string; // Will be fetched from department API
    created_at: string;
    updated_at: string;
};

// Legacy type for compatibility - maps to ICompound
export type ISemifinishedItem = ICompound;
