import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IProductFilters = {
  rating: string;
  gender: string[];
  category: string;
  colors: string[];
  priceRange: number[];
};

export type IProductTableFilters = {
  stock: string[];
  publish: string[];
};

export type IProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  helpful: number;
  avatarUrl: string;
  postedAt: IDateValue;
  isPurchased: boolean;
  attachments?: string[];
};

export type IProductItem = {
  id: string;
  sku: string;
  name: string;
  code: string;
  price: number;
  taxes: number;
  tags: string[];
  sizes: string[];
  publish: string;
  gender: string[];
  coverUrl: string;
  images: string[];
  colors: string[];
  color?: string;
  quantity: number;
  category: string;
  available: number;
  totalSold: number;
  description: string;
  totalRatings: number;
  totalReviews: number;
  createdAt: IDateValue;
  inventoryType: string;
  subDescription: string;
  priceSale: number | null;
  reviews: IProductReview[];
  newLabel: {
    content: string;
    enabled: boolean;
  };
  saleLabel: {
    content: string;
    enabled: boolean;
  };
  ratings: {
    name: string;
    starCount: number;
    reviewCount: number;
  }[];
};

// ============================================================================
// DEPARTMENT TYPES
// ============================================================================

export type IDepartmentItem = {
  id: string;
  name: string;
  name_i18n?: string; // Translation ID
  color_code: string;
  storage_id: string;
  picture_url?: string;
  created_at: string;
  updated_at: string;
  storage_name?: string; // Enriched from storage
  _expand?: {
    name_i18n?: ITranslationItem;
    storage_id?: IStorageItem;
  };
};

export type IDepartmentFormData = {
  name: string;
  name_i18n?: string; // Translation ID
  color_code: string;
  storage_id: string;
  picture_url?: string;
};

export type ITranslationItem = {
  id: string;
  en: string;
  ru: string;
  uz?: string; // Uzbek (default)
  'uz-Latn'?: string; // Uzbek Latin
  'uz-Cyrl'?: string; // Uzbek Cyrillic
  created_at?: string;
  updated_at?: string;
};

export type ITranslationFormData = {
  en: string;
  ru: string;
  uz?: string; // Uzbek (default)
  'uz-Latn'?: string; // Uzbek Latin
  'uz-Cyrl'?: string; // Uzbek Cyrillic
};

export type IStorageItem = {
  id: string;
  name: string;
  name_i18n?: string; // Translation ID (optional)
  branch_id: string;
  color_code?: string;
  picture_url: string;
  created_at: string;
  updated_at: string;
  _expand?: {
    name_i18n?: ITranslationItem;
    branch_id?: {
      id: string;
      name?: string;
      name_i18n?: string | null;
      address?: string;
      phone?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
};

export type IStorageFormData = {
  name: string;
  name_i18n?: string; // Translation ID (optional)
  name_en?: string; // English translation (for form input)
  name_ru?: string; // Russian translation (for form input)
  branch_id?: string;
  color_code?: string;
  picture_url?: string;
};

export type IDepartmentTableFilters = {
  search?: string;
  status?: string[];
};

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export type ICategoryItem = {
  id: string;
  name: string;
  picture_url: string;
  color_code: string;
  department_id: string;
  storage_id: string;
  created_at: string;
  updated_at: string;
};

export type ICategoryFormData = {
  name: string;
  picture_url?: string;
  color_code: string;
  department_id: string;
};

