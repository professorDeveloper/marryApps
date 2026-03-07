import type { AxiosError } from 'axios';
import type {
  OutgoingInvoiceFilters,
  OutgoingInvoiceListResponse,
  OutgoingInvoiceBatchPayload,
  OutgoingInvoiceBatchApiResponse,
  OutgoingInvoiceActionApiResponse,
  OutgoingInvoiceUpdatePayload,
  OutgoingInvoiceItemsPayload,
} from 'src/types/outgoing-invoices';

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

const normalizeListResponse = (payload: unknown): OutgoingInvoiceListResponse => {
  if (!payload || typeof payload !== 'object') {
    return { data: [], total_sum: '0', limit: 500, offset: 0, total: 0 };
  }

  const obj = payload as Record<string, unknown>;
  return {
    data: Array.isArray(obj.data) ? (obj.data as OutgoingInvoiceListResponse['data']) : [],
    total_sum: typeof obj.total_sum === 'string' ? obj.total_sum : '0',
    limit: typeof obj.limit === 'number' ? obj.limit : 500,
    offset: typeof obj.offset === 'number' ? obj.offset : 0,
    total: typeof obj.total === 'number' ? obj.total : 0,
  };
};

const normalizeBatchResponse = (payload: unknown): OutgoingInvoiceBatchApiResponse => {
  if (!payload || typeof payload !== 'object') {
    return {
      status: 'error',
      message: 'Invalid response',
      data: { invoice: {} as OutgoingInvoiceBatchApiResponse['data']['invoice'], items: [] },
      code: 500,
    };
  }

  const obj = payload as Record<string, unknown>;
  const rawData =
    obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;

  return {
    status: typeof obj.status === 'string' ? obj.status : 'success',
    message: typeof obj.message === 'string' ? obj.message : 'Outgoing invoice created',
    data: {
      invoice: (rawData.invoice || rawData.outgoing_invoice || {}) as OutgoingInvoiceBatchApiResponse['data']['invoice'],
      items: Array.isArray(rawData.items)
        ? (rawData.items as OutgoingInvoiceBatchApiResponse['data']['items'])
        : [],
    },
    code: typeof obj.code === 'number' ? obj.code : 201,
  };
};

export function useOutgoingInvoicesAPI() {
  const { t } = useTranslation('menu');

  const getOutgoingInvoices = useCallback(
    async (filters?: OutgoingInvoiceFilters): Promise<OutgoingInvoiceListResponse> => {
      try {
        const response = await fetcher<OutgoingInvoiceListResponse | unknown>([
          endpoints.outgoingInvoices.list,
          { params: filters },
        ]);
        return normalizeListResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.fetchFailed', 'Failed to fetch outgoing invoices');
        toast.error(message);
        return { data: [], total_sum: '0', limit: 500, offset: 0, total: 0 };
      }
    },
    [t]
  );

  const createOutgoingInvoiceBatch = useCallback(
    async (payload: OutgoingInvoiceBatchPayload): Promise<OutgoingInvoiceBatchApiResponse> => {
      try {
        const response = await poster<OutgoingInvoiceBatchApiResponse | unknown>(
          endpoints.outgoingInvoices.batch,
          payload
        );
        toast.success(t('outgoingInvoices.messages.created', 'Outgoing invoice created successfully'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.createFailed', 'Failed to create outgoing invoice');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const getOutgoingInvoiceById = useCallback(
    async (id: string): Promise<OutgoingInvoiceBatchApiResponse | null> => {
      try {
        const response = await fetcher<OutgoingInvoiceBatchApiResponse | unknown>(
          endpoints.outgoingInvoices.details(id)
        );
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.fetchOneFailed', 'Failed to fetch outgoing invoice');
        toast.error(message);
        return null;
      }
    },
    [t]
  );

  const confirmOutgoingInvoice = useCallback(
    async (id: string): Promise<OutgoingInvoiceActionApiResponse> => {
      try {
        const response = await poster<OutgoingInvoiceActionApiResponse | unknown>(
          endpoints.outgoingInvoices.confirm(id),
          {}
        );
        const normalized = response as OutgoingInvoiceActionApiResponse;
        toast.success(normalized.message || t('outgoingInvoices.messages.confirmed', 'Outgoing invoice confirmed'));
        return normalized;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.confirmFailed', 'Failed to confirm outgoing invoice');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const cancelOutgoingInvoice = useCallback(
    async (id: string): Promise<OutgoingInvoiceActionApiResponse> => {
      try {
        const response = await poster<OutgoingInvoiceActionApiResponse | unknown>(
          endpoints.outgoingInvoices.cancel(id),
          {}
        );
        const normalized = response as OutgoingInvoiceActionApiResponse;
        toast.success(normalized.message || t('outgoingInvoices.messages.cancelled', 'Outgoing invoice cancelled'));
        return normalized;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.cancelFailed', 'Failed to cancel outgoing invoice');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const deleteOutgoingInvoice = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleter(endpoints.outgoingInvoices.delete(id));
        toast.success(t('outgoingInvoices.messages.deleted', 'Outgoing invoice deleted'));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.deleteFailed', 'Failed to delete outgoing invoice');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const deleteOutgoingInvoiceItem = useCallback(
    async (id: string, itemId: string): Promise<void> => {
      try {
        await deleter(endpoints.outgoingInvoices.deleteItem(id, itemId));
        toast.success(t('outgoingInvoices.messages.itemDeleted', 'Outgoing invoice item deleted'));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.itemDeleteFailed', 'Failed to delete outgoing invoice item');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const updateOutgoingInvoice = useCallback(
    async (id: string, payload: OutgoingInvoiceUpdatePayload): Promise<OutgoingInvoiceBatchApiResponse> => {
      try {
        const response = await putter<OutgoingInvoiceBatchApiResponse | unknown>(
          endpoints.outgoingInvoices.update(id),
          payload
        );
        toast.success(t('outgoingInvoices.messages.updated', 'Outgoing invoice updated successfully'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.updateFailed', 'Failed to update outgoing invoice');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const addOutgoingInvoiceItems = useCallback(
    async (id: string, payload: OutgoingInvoiceItemsPayload): Promise<OutgoingInvoiceBatchApiResponse> => {
      try {
        const response = await poster<OutgoingInvoiceBatchApiResponse | unknown>(
          endpoints.outgoingInvoices.items(id),
          payload
        );
        toast.success(t('outgoingInvoices.messages.itemsAdded', 'Outgoing invoice items added successfully'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message =
          axiosError?.response?.data?.message
          || t('outgoingInvoices.messages.itemsAddFailed', 'Failed to add outgoing invoice items');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  return {
    getOutgoingInvoices,
    createOutgoingInvoiceBatch,
    getOutgoingInvoiceById,
    confirmOutgoingInvoice,
    cancelOutgoingInvoice,
    deleteOutgoingInvoice,
    deleteOutgoingInvoiceItem,
    updateOutgoingInvoice,
    addOutgoingInvoiceItems,
  };
}
