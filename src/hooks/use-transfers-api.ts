import type { AxiosError } from 'axios';
import type { Transfer, TransferBatchPayload, TransferBatchItemInput } from 'src/types/transfers';

import { useCallback } from 'react';
import { toast } from 'sonner';

import { deleter, endpoints, fetcher, poster, putter } from 'src/lib/axios';

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
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

  const getTransfers = useCallback(async (): Promise<Transfer[]> => {
    try {
      const response = await fetcher<BackendResponse<Transfer[]>>(endpoints.transfers.list);
      return response.data || [];
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || 'Failed to fetch transfers';
      toast.error(message);
      return [];
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
    async (id: string, items: TransferBatchItemInput[]): Promise<Transfer> => {
      try {
        const response = await putter<BackendResponse<Transfer> | Transfer>(
          endpoints.transfers.updateItemsBatch(id),
          { items }
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
