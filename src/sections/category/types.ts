import type { ICategory, IGoodsItem } from 'src/types/category';

// ============================================================================
// CATEGORY VIEW TYPES
// ============================================================================

export interface CategoryTableFilters {
    search?: string;
    storage_id?: string;
    department_id?: string;
    limit?: number;
    offset?: number;
}

export interface CategoryWithNames extends ICategory {
    storage_name?: string;
    department_name?: string;
}

export interface GoodsItemWithUrls extends IGoodsItem {
    imageUrl?: string | null;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface CategoryAvatarCellProps {
    category: ICategory;
}

export interface StorageNameCellProps {
    category: ICategory;
}

export interface CategoryGoodsTableProps {
    categoryId: string;
}

export interface CategoryGoodsModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: ICategory | null;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CategoryListResponse {
    items: CategoryWithNames[];
    total: number;
    limit: number;
    offset: number;
}

export interface CategoryData {
    categories: CategoryWithNames[];
    loading: boolean;
    error?: string;
    totalCount: number;
}
