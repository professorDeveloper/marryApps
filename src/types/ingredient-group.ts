export interface IIngredientGroupItem {
  id: string;
  name: string;
  picture_url: string;
  color_code: string;
  created_at: string;
  updated_at: string;
}

export interface IIngredientGroupFormData {
  name: string;
  picture_url?: string;
  color_code?: string;
}

export interface IIngredientGroupTableFilters {
  search?: string;
}

export interface IIngredientGroupResponse {
  status: string;
  message: string;
  data: IIngredientGroupItem[];
  code: number;
}
