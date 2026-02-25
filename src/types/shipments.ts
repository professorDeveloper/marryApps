export interface Shipment {
  id: string;
  number: number;
  date: string;
  storage_id: string;
  supplier_id: string;
  branch_id: string;
  description: string;
  status: string;
  total_amount: string;
  paid_amount: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  ingredient_id: string;
  quantity: string;
  price_per_unit: string;
  total_amount: string;
  stock_before: string;
  stock_after: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentListResponse {
  data: Shipment[];
  limit: number;
  offset: number;
  total: number;
}

export interface ShipmentBatchItemInput {
  ingredient_id: string;
  quantity: string;
}

export interface ShipmentBatchPayload {
  date: string;
  description: string;
  items: ShipmentBatchItemInput[];
  storage_id: string;
  supplier_id: string;
}

export interface ShipmentUpdatePayload {
  date: string;
  description: string;
  storage_id: string;
  supplier_id: string;
}

export interface ShipmentItemsPayload {
  items: ShipmentBatchItemInput[];
}

export interface ShipmentBatchResponse {
  shipment: Shipment;
  items: ShipmentItem[];
}

export interface ShipmentBatchApiData {
  shipment: Shipment;
  items: ShipmentItem[];
}

export interface ShipmentBatchApiResponse {
  status: string;
  message: string;
  data: ShipmentBatchApiData;
  code: number;
}

export interface ShipmentActionApiResponse {
  status: string;
  message: string;
  data: Shipment;
  code: number;
}

export interface ShipmentFilters {
  start_date?: string;
  end_date?: string;
  storage_id?: string;
  supplier_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}
