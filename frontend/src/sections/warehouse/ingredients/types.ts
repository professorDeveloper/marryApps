import type { IIngredientItem } from 'src/types/ingredients';

export type Ingredient = IIngredientItem;

export interface IngredientGroup {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IngredientFilters {
  search?: string;
  group?: string[];
  measurement?: string[];
}

export interface IngredientSpecifications {
  picture_url?: string;
  description?: string;
  measurement?: string;
  price_per_unit?: string;
  color_code?: string;
}
