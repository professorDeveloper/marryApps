import type { AxiosError } from 'axios';
import type {
  SeparationActFilters,
  SeparationActsListResponse,
  SeparationActBatchPayload,
  SeparationActBatchApiResponse,
  SeparationActActionApiResponse,
  SeparationActUpdatePayload,
  SeparationActItemsPayload,
} from 'src/types/separation-acts';

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

const normalizeListResponse = (payload: unknown): SeparationActsListResponse => {
  if (!payload || typeof payload !== 'object') {
    return {
      data: [],
      limit: 1000,
      offset: 0,
      total: 0,
      total_amount: '0',
      total_source_qty: '0',
    };
  }

  const obj = payload as Record<string, unknown>;
  return {
    data: Array.isArray(obj.data) ? (obj.data as SeparationActsListResponse['data']) : [],
    limit: typeof obj.limit === 'number' ? obj.limit : 500,
    offset: typeof obj.offset === 'number' ? obj.offset : 0,
    total: typeof obj.total === 'number' ? obj.total : 0,
    total_amount: typeof obj.total_amount === 'string' ? obj.total_amount : '0',
    total_source_qty: typeof obj.total_source_qty === 'string' ? obj.total_source_qty : '0',
  };
};

const normalizeBatchResponse = (payload: unknown): SeparationActBatchApiResponse => {
  if (!payload || typeof payload !== 'object') {
    return {
      status: 'error',
      message: 'Invalid response',
      data: { act: {} as SeparationActBatchApiResponse['data']['act'], items: [] },
      code: 500,
    };
  }

  const obj = payload as Record<string, unknown>;
  const rawData =
    obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;

  return {
    status: typeof obj.status === 'string' ? obj.status : 'success',
    message: typeof obj.message === 'string' ? obj.message : 'Separation act created',
    data: {
      act: (rawData.act || rawData.separation_act || {}) as SeparationActBatchApiResponse['data']['act'],
      items: Array.isArray(rawData.items)
        ? (rawData.items as SeparationActBatchApiResponse['data']['items'])
        : [],
    },
    code: typeof obj.code === 'number' ? obj.code : 201,
  };
};

export function useSeparationActsAPI() {
  const { t } = useTranslation('menu');

  const getSeparationActs = useCallback(
    async (filters?: SeparationActFilters): Promise<SeparationActsListResponse> => {
      try {
        const response = await fetcher<SeparationActsListResponse | unknown>([
          endpoints.separationActs.list,
          { params: filters },
        ]);
        return normalizeListResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.fetchFailed', 'Failed to fetch separation acts');
        toast.error(message);
        return {
          data: [],
          limit: 1000,
          offset: 0,
          total: 0,
          total_amount: '0',
          total_source_qty: '0',
        };
      }
    },
    [t]
  );

  const createSeparationActBatch = useCallback(
    async (payload: SeparationActBatchPayload): Promise<SeparationActBatchApiResponse> => {
      try {
        const response = await poster<SeparationActBatchApiResponse | unknown>(
          endpoints.separationActs.batch,
          payload
        );
        toast.success(t('separationActs.messages.created', 'Separation act created successfully'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.createFailed', 'Failed to create separation act');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const getSeparationActById = useCallback(
    async (id: string): Promise<SeparationActBatchApiResponse | null> => {
      try {
        const response = await fetcher<SeparationActBatchApiResponse | unknown>(
          endpoints.separationActs.details(id)
        );
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.fetchOneFailed', 'Failed to fetch separation act');
        toast.error(message);
        return null;
      }
    },
    [t]
  );

  const confirmSeparationAct = useCallback(
    async (
      id: string,
      payload?: {
        source_ingredient_id?: string;
        source_quantity?: string;
        storage_id?: string;
      }
    ): Promise<SeparationActActionApiResponse> => {
      try {
        const response = await poster<SeparationActActionApiResponse | unknown>(
          endpoints.separationActs.confirm(id),
          payload || {}
        );
        const normalized = response as SeparationActActionApiResponse;
        toast.success(normalized.message || t('separationActs.messages.confirmed', 'Separation act confirmed'));
        return normalized;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.confirmFailed', 'Failed to confirm separation act');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const cancelSeparationAct = useCallback(
    async (id: string): Promise<SeparationActActionApiResponse> => {
      try {
        const response = await poster<SeparationActActionApiResponse | unknown>(
          endpoints.separationActs.cancel(id),
          {}
        );
        const normalized = response as SeparationActActionApiResponse;
        toast.success(normalized.message || t('separationActs.messages.cancelled', 'Separation act cancelled'));
        return normalized;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.cancelFailed', 'Failed to cancel separation act');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const deleteSeparationAct = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleter(endpoints.separationActs.delete(id));
        toast.success(t('separationActs.messages.deleted', 'Separation act deleted'));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.deleteFailed', 'Failed to delete separation act');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const deleteSeparationActItem = useCallback(
    async (id: string, itemId: string): Promise<void> => {
      try {
        await deleter(endpoints.separationActs.deleteItem(id, itemId));
        toast.success(t('separationActs.messages.itemDeleted', 'Separation act item deleted'));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.itemDeleteFailed', 'Failed to delete separation act item');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const updateSeparationAct = useCallback(
    async (id: string, payload: SeparationActUpdatePayload): Promise<SeparationActBatchApiResponse> => {
      try {
        const response = await putter<SeparationActBatchApiResponse | unknown>(
          endpoints.separationActs.update(id),
          payload
        );
        toast.success(t('separationActs.messages.updated', 'Separation act updated successfully'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.updateFailed', 'Failed to update separation act');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const addSeparationActItems = useCallback(
    async (id: string, payload: SeparationActItemsPayload): Promise<SeparationActBatchApiResponse> => {
      try {
        const response = await poster<SeparationActBatchApiResponse | unknown>(
          endpoints.separationActs.items(id),
          payload
        );
        toast.success(t('separationActs.messages.itemsAdded', 'Separation act items added successfully'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('separationActs.messages.itemsAddFailed', 'Failed to add separation act items');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  return {
    getSeparationActs,
    createSeparationActBatch,
    getSeparationActById,
    confirmSeparationAct,
    cancelSeparationAct,
    deleteSeparationAct,
    deleteSeparationActItem,
    updateSeparationAct,
    addSeparationActItems,
  };
}
