import type { AxiosError } from 'axios';
import type {
  OrderEntity,
  CreateOrderPayload,
  OrdersListResponse,
} from 'src/types/orders';

import { useCallback } from 'react';

import { poster, fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

interface BackendResponse<T> {
  data?: T;
  message?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface OrderListParams {
  order_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

const emptyListResponse: OrdersListResponse = {
  data: [],
  total: 0,
  limit: 1000,
  offset: 0,
};

const normalizeOrder = (payload: unknown): OrderEntity | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const obj = payload as Record<string, unknown>;

  if (obj.data && typeof obj.data === 'object') {
    return normalizeOrder(obj.data);
  }

  if (typeof obj.id !== 'string') {
    return null;
  }

  return {
    id: obj.id,
    order_type: typeof obj.order_type === 'string' ? (obj.order_type as OrderEntity['order_type']) : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
    table_id: typeof obj.table_id === 'string' ? obj.table_id : undefined,
    waiter_id: typeof obj.waiter_id === 'string' ? obj.waiter_id : undefined,
    cashier_id: typeof obj.cashier_id === 'string' ? obj.cashier_id : undefined,
    guest_count: typeof obj.guest_count === 'number' ? obj.guest_count : undefined,
    scheduled_at: typeof obj.scheduled_at === 'string' ? obj.scheduled_at : undefined,
    comment: typeof obj.comment === 'string' ? obj.comment : undefined,
    items: Array.isArray(obj.items) ? (obj.items as OrderEntity['items']) : [],
    created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
    updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
  };
};

const normalizeListResponse = (payload: unknown): OrdersListResponse => {
  if (!payload || typeof payload !== 'object') {
    return emptyListResponse;
  }

  const obj = payload as BackendResponse<unknown> & Record<string, unknown>;
  const sourceData = obj.data ?? payload;

  if (Array.isArray(sourceData)) {
    return {
      data: sourceData
        .map((item) => normalizeOrder(item))
        .filter((item): item is OrderEntity => Boolean(item)),
      total: sourceData.length,
      limit: sourceData.length,
      offset: 0,
    };
  }

  if (sourceData && typeof sourceData === 'object') {
    const nested = sourceData as Record<string, unknown>;
    const rows = Array.isArray(nested.data) ? nested.data : [];

    return {
      data: rows.map((item) => normalizeOrder(item)).filter((item): item is OrderEntity => Boolean(item)),
      total: typeof nested.total === 'number' ? nested.total : typeof obj.total === 'number' ? obj.total : rows.length,
      limit: typeof nested.limit === 'number' ? nested.limit : typeof obj.limit === 'number' ? obj.limit : rows.length,
      offset: typeof nested.offset === 'number' ? nested.offset : typeof obj.offset === 'number' ? obj.offset : 0,
    };
  }

  return emptyListResponse;
};

export function useOrdersAPI() {
  const getOrders = useCallback(async (params?: OrderListParams): Promise<OrdersListResponse> => {
    try {
      const queryParams: Record<string, unknown> = {};
      if (params?.order_type) queryParams.order_type = params.order_type;
      if (params?.status) queryParams.status = params.status;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;
      if (params?.sort_by) queryParams.sort_by = params.sort_by;
      if (params?.sort_order) queryParams.sort_order = params.sort_order;
      if (typeof params?.limit === 'number') queryParams.limit = params.limit;
      if (typeof params?.offset === 'number') queryParams.offset = params.offset;

      const response = await fetcher<unknown>(
        Object.keys(queryParams).length > 0
          ? [endpoints.orders.list, { params: queryParams }]
          : endpoints.orders.list
      );
      return normalizeListResponse(response);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError?.response?.data?.message || 'Failed to fetch orders');
      return emptyListResponse;
    }
  }, []);

  const createOrder = useCallback(async (payload: CreateOrderPayload): Promise<OrderEntity | null> => {
    try {
      const response = await poster<unknown>(endpoints.orders.create, payload);
      const created = normalizeOrder(response);
      toast.success('Order created');
      return created;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError?.response?.data?.message || 'Failed to create order');
      return null;
    }
  }, []);

  return {
    getOrders,
    createOrder,
  };
}
