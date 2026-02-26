export interface OutgoingInvoice {
  id: string;
  number: number;
  date: string;
  storage_id: string;
  group_id: string;
  branch_id: string;
  description: string;
  status: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
}

export interface OutgoingInvoiceItem {
  id: string;
  outgoing_invoice_id: string;
  ingredient_id: string;
  quantity: string;
  price_per_unit: string;
  total_amount: string;
  stock_before: string;
  stock_after: string;
  created_at: string;
  updated_at: string;
}

export interface OutgoingInvoiceListResponse {
  data: OutgoingInvoice[];
  total_sum: string;
  limit: number;
  offset: number;
  total: number;
}

export interface OutgoingInvoiceBatchItemInput {
  ingredient_id: string;
  quantity: string;
}

export interface OutgoingInvoiceBatchPayload {
  date: string;
  description: string;
  items: OutgoingInvoiceBatchItemInput[];
  storage_id: string;
  group_id: string;
}

export interface OutgoingInvoiceUpdatePayload {
  date: string;
  description: string;
  storage_id: string;
  group_id: string;
}

export interface OutgoingInvoiceItemsPayload {
  items: OutgoingInvoiceBatchItemInput[];
}

export interface OutgoingInvoiceBatchApiData {
  invoice: OutgoingInvoice;
  items: OutgoingInvoiceItem[];
}

export interface OutgoingInvoiceBatchApiResponse {
  status: string;
  message: string;
  data: OutgoingInvoiceBatchApiData;
  code: number;
}

export interface OutgoingInvoiceActionApiResponse {
  status: string;
  message: string;
  data: OutgoingInvoice;
  code: number;
}

export interface OutgoingInvoiceFilters {
  start_date?: string;
  end_date?: string;
  storage_id?: string;
  group_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}
