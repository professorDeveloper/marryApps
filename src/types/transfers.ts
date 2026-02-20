export interface TransferItem {
  id: string;
  transfer_id: string;
  ingredient_id: string;
  quantity: string;
  stock_qty_before: string;
  stock_qty_after: string;
  price: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  number: number;
  from_branch_id: string;
  to_branch_id: string;
  from_storage_id: string;
  to_storage_id: string;
  act_group_id: string;
  description: string;
  status: string;
  date: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  items?: TransferItem[];
}

export interface TransferBatchItemInput {
  ingredient_id: string;
  quantity: string;
}

export interface TransferBatchPayload {
  act_group_id: string;
  description: string;
  to_branch_id: string;
  to_storage_id: string;
  from_branch_id: string;
  from_storage_id: string;
  items: TransferBatchItemInput[];
}

export interface TransferFormData {
  act_group_id: string;
  description: string;
  to_branch_id: string;
  to_storage_id: string;
  from_branch_id: string;
  from_storage_id: string;
  status: string;
  date: string;
}
