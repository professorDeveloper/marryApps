export interface SeparationAct {
  id: string;
  number: number;
  date: string;
  storage_id: string;
  group_id: string;
  branch_id: string;
  description: string;
  status: string;
  total_amount: string;
  source_ingredient_id: string;
  source_quantity: string;
  source_stock_before: string;
  source_stock_after: string;
  waste_quantity: string;
  created_at: string;
  updated_at: string;
}

export interface SeparationActItem {
  id: string;
  separation_act_id: string;
  ingredient_id: string;
  quantity: string;
  price_per_unit: string;
  total_amount: string;
  stock_before: string;
  stock_after: string;
  storage_id: string;
  created_at: string;
  updated_at: string;
}

export interface SeparationActsListResponse {
  data: SeparationAct[];
  limit: number;
  offset: number;
  total: number;
  total_amount: string;
  total_source_qty: string;
}

export interface SeparationActCalculationItemInput {
  ingredient_id: string;
  quantity: string;
}

export interface SeparationActBatchItemInput {
  ingredient_id: string;
  price: string;
  quantity: string;
  storage_id: string;
}

export interface SeparationActBatchPayload {
  date: string;
  description: string;
  group_id: string;
  items: SeparationActBatchItemInput[];
  source_ingredient_id: string;
  source_quantity: string;
  storage_id: string;
}

export interface SeparationActUpdatePayload {
  date: string;
  description: string;
  group_id: string;
  source_ingredient_id: string;
  source_quantity: string;
  storage_id: string;
}

export interface SeparationActItemsPayload {
  items: SeparationActBatchItemInput[];
}

export interface SeparationActBatchApiData {
  act: SeparationAct;
  items: SeparationActItem[];
}

export interface SeparationActBatchApiResponse {
  status: string;
  message: string;
  data: SeparationActBatchApiData;
  code: number;
}

export interface SeparationActActionApiResponse {
  status: string;
  message: string;
  data: SeparationAct;
  code: number;
}

export interface SeparationActFilters {
  start_date?: string;
  end_date?: string;
  storage_id?: string;
  group_id?: string;
  ingredient_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
