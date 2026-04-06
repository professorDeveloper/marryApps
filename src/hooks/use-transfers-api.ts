import type { AxiosError } from 'axios';
import type { Transfer, TransferBatchPayload, TransferBatchItemInput } from 'src/types/transfers';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

interface BackendPagination {
  limit: number;
  offset: number;
  total: number;
  total_pages: number;
}

interface TransferListParams {
  limit?: number;
  offset?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  from_storage_id?: string;
  to_storage_id?: string;
  act_group_id?: string;
  ingredient_id?: string;
  expand?: string;
}

interface TransferListResult {
  items: Transfer[];
  pagination?: BackendPagination;
  totalAmount?: string;
}

interface UpdateTransferItemsBatchPayload {
  act_group_id: string;
  date: string;
  description: string;
  from_storage_id: string;
  to_storage_id: string;
  status: string;
  items: TransferBatchItemInput[];
}

const formatTransferCreateError = (error: unknown): string => {
  const fallbackMessage = 'Failed to create transfer';
  const rawMessage = error instanceof Error ? error.message : fallbackMessage;

  if (/insufficient stock/i.test(rawMessage)) {
    const available = rawMessage.match(/available:\s*([0-9.]+)/i)?.[1];
    const requested = rawMessage.match(/requested:\s*([0-9.]+)/i)?.[1];

    if (available && requested) {
      return `Ingredient qoldig'i yetarli emas (omborda: ${available}, kerak: ${requested}).`;
    }

    return "Ingredient qoldig'i yetarli emas. Odatda bu ingredient ombordagi qoldig'i 0 bo'lganda chiqadi.";
  }

  return rawMessage || fallbackMessage;
};

export interface ActGroup {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useTransfersAPI() {
  const isBackendResponse = <T,>(value: unknown): value is BackendResponse<T> =>
    !!value && typeof value === 'object' && 'data' in (value as Record<string, unknown>);

  const getTransfers = useCallback(async (params?: TransferListParams): Promise<TransferListResult> => {
    try {
      const response = await fetcher<unknown>([
        endpoints.transfers.list,
        {
          params: {
            limit: typeof params?.limit === 'number' ? params.limit : 20,
            offset: typeof params?.offset === 'number' ? params.offset : 0,
            status: params?.status || undefined,
            date_from: params?.date_from || undefined,
            date_to: params?.date_to || undefined,
            from_storage_id: params?.from_storage_id || undefined,
            to_storage_id: params?.to_storage_id || undefined,
            act_group_id: params?.act_group_id || undefined,
            ingredient_id: params?.ingredient_id || undefined,
            expand: params?.expand || undefined,
          },
        },
      ]);
      const envelope = response as Record<string, unknown>;
      const rootData =
        envelope.data && typeof envelope.data === 'object'
          ? (envelope.data as Record<string, unknown>)
          : envelope;

      const items = Array.isArray(rootData.data) ? (rootData.data as Transfer[]) : [];
      const pagination =
        rootData.pagination && typeof rootData.pagination === 'object'
          ? (rootData.pagination as BackendPagination)
          : undefined;
      const totalAmount =
        typeof rootData.total_amount === 'string' || typeof rootData.total_amount === 'number'
          ? String(rootData.total_amount)
          : undefined;

      return {
        items,
        pagination,
        totalAmount,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to fetch transfers';
      toast.error(message);
      return { items: [] };
    }
  }, []);

  const getTransferById = useCallback(async (id: string): Promise<Transfer | null> => {
    try {
      const response = await fetcher<BackendResponse<Transfer>>(endpoints.transfers.details(id));
      return response.data || null;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to fetch transfer';
      toast.error(message);
      return null;
    }
  }, []);

  const createTransfer = useCallback(async (payload: Partial<Transfer>): Promise<Transfer> => {
    try {
      const response = await poster<BackendResponse<Transfer>>(endpoints.transfers.create, payload);
      toast.success('Transfer created successfully');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to create transfer';
      toast.error(message);
      throw error;
    }
  }, []);

  const createTransferBatch = useCallback(
    async (payload: TransferBatchPayload): Promise<Transfer> => {
      try {
        const response = await poster<BackendResponse<Transfer>>(endpoints.transfers.batch, payload);
        toast.success('Transfer created successfully');
        return response.data;
      } catch (error) {
        const message = formatTransferCreateError(error);
        toast.error(message);
        throw new Error(message);
      }
    },
    []
  );

  const updateTransfer = useCallback(async (id: string, payload: Partial<Transfer>): Promise<Transfer> => {
    try {
      const response = await putter<BackendResponse<Transfer>>(endpoints.transfers.update(id), payload);
      toast.success('Transfer updated successfully');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to update transfer';
      toast.error(message);
      throw error;
    }
  }, []);

  const updateTransferItemsBatch = useCallback(
    async (id: string, payload: UpdateTransferItemsBatchPayload): Promise<Transfer> => {
      try {
        const response = await putter<BackendResponse<Transfer> | Transfer>(
          endpoints.transfers.updateItemsBatch(id),
          payload
        );
        const transfer = isBackendResponse<Transfer>(response) ? response.data : response;
        toast.success('Transfer items updated successfully');
        return transfer;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message || 'Failed to update transfer items';
        toast.error(message);
        throw error;
      }
    },
    []
  );

  const deleteTransfer = useCallback(async (id: string): Promise<void> => {
    try {
      await deleter(endpoints.transfers.delete(id));
      toast.success('Transfer deleted successfully');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to delete transfer';
      toast.error(message);
      throw error;
    }
  }, []);

  const getTransferGroups = useCallback(async (): Promise<ActGroup[]> => {
    try {
      const response = await fetcher<BackendResponse<ActGroup[]>>(endpoints.deductions.groups);
      return response.data || [];
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to fetch transfer groups';
      toast.error(message);
      return [];
    }
  }, []);

  return {
    getTransfers,
    getTransferById,
    createTransfer,
    createTransferBatch,
    updateTransfer,
    updateTransferItemsBatch,
    deleteTransfer,
    getTransferGroups,
  };
}
