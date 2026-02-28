export type OrderType = 'dine_in' | 'takeaway';

export type OrderStatus =
  | 'reserved'
  | 'rescheduled'
  | 'open'
  | 'cooking'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';

export interface OrderItemPayload {
  good_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  order_type?: OrderType;
  table_id?: string;
  waiter_id?: string;
  cashier_id?: string;
  guest_count?: number;
  scheduled_at?: string;
  comment?: string;
  items?: OrderItemPayload[];
}

export interface RescheduleOrderPayload {
  scheduled_at: string;
  comment?: string;
}

export interface OrderEntity {
  id: string;
  order_type?: OrderType;
  status?: OrderStatus | string;
  table_id?: string;
  waiter_id?: string;
  cashier_id?: string;
  guest_count?: number;
  scheduled_at?: string;
  comment?: string;
  items?: OrderItemPayload[];
  created_at?: string;
  updated_at?: string;
}

export interface OrdersListResponse {
  data: OrderEntity[];
  total: number;
  limit: number;
  offset: number;
}

