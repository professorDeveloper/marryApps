import type { AxiosError } from 'axios';
import type {
  ShipmentFilters,
  ShipmentListResponse,
  ShipmentBatchPayload,
  ShipmentItemsPayload,
  ShipmentUpdatePayload,
  ShipmentBatchApiResponse,
  ShipmentActionApiResponse,
} from 'src/types/shipments';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';

const normalizeListResponse = (payload: unknown): ShipmentListResponse => {
  if (!payload || typeof payload !== 'object') {
    return { data: [], limit: 1000, offset: 0, total: 0 };
  }

  const obj = payload as Record<string, unknown>;
  return {
    data: Array.isArray(obj.data) ? (obj.data as ShipmentListResponse['data']) : [],
    limit: typeof obj.limit === 'number' ? obj.limit : 500,
    offset: typeof obj.offset === 'number' ? obj.offset : 0,
    total: typeof obj.total === 'number' ? obj.total : 0,
  };
};

const normalizeBatchResponse = (payload: unknown): ShipmentBatchApiResponse => {
  if (!payload || typeof payload !== 'object') {
    return {
      status: 'error',
      message: 'Invalid response',
      data: { shipment: {} as ShipmentBatchApiResponse['data']['shipment'], items: [] },
      code: 500,
    };
  }

  const obj = payload as Record<string, unknown>;
  const rawData =
    obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;

  return {
    status: typeof obj.status === 'string' ? obj.status : 'success',
    message: typeof obj.message === 'string' ? obj.message : 'Shipment created',
    data: {
      shipment: (rawData.shipment || {}) as ShipmentBatchApiResponse['data']['shipment'],
      items: Array.isArray(rawData.items)
        ? (rawData.items as ShipmentBatchApiResponse['data']['items'])
        : [],
    },
    code: typeof obj.code === 'number' ? obj.code : 201,
  };
};

export function useShipmentsAPI() {
  const { t } = useTranslation('menu');

  const getShipments = useCallback(
    async (filters?: ShipmentFilters): Promise<ShipmentListResponse> => {
      try {
        const response = await fetcher<ShipmentListResponse | unknown>([
          endpoints.shipments.list,
          { params: filters },
        ]);
        return normalizeListResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.fetchFailed');
        toast.error(message);
        return { data: [], limit: 1000, offset: 0, total: 0 };
      }
    },
    [t]
  );

  const createShipmentBatch = useCallback(
    async (payload: ShipmentBatchPayload): Promise<ShipmentBatchApiResponse> => {
      try {
        const response = await poster<ShipmentBatchApiResponse | unknown>(
          endpoints.shipments.batch,
          payload
        );
        toast.success(t('shipments.messages.created'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.createFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const getShipmentById = useCallback(
    async (id: string): Promise<ShipmentBatchApiResponse | null> => {
      try {
        const response = await fetcher<ShipmentBatchApiResponse | unknown>(
          endpoints.shipments.details(id)
        );
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.fetchOneFailed');
        toast.error(message);
        return null;
      }
    },
    [t]
  );

  const confirmShipment = useCallback(
    async (id: string): Promise<ShipmentActionApiResponse> => {
      try {
        const response = await poster<ShipmentActionApiResponse | unknown>(
          endpoints.shipments.confirm(id),
          {}
        );
        const normalized = response as ShipmentActionApiResponse;
        toast.success(normalized.message || t('shipments.messages.confirmed'));
        return normalized;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.confirmFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const cancelShipment = useCallback(
    async (id: string): Promise<ShipmentActionApiResponse> => {
      try {
        const response = await poster<ShipmentActionApiResponse | unknown>(
          endpoints.shipments.cancel(id),
          {}
        );
        const normalized = response as ShipmentActionApiResponse;
        toast.success(normalized.message || t('shipments.messages.cancelled'));
        return normalized;
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.cancelFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const deleteShipment = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleter(endpoints.shipments.delete(id));
        toast.success(t('shipments.messages.deleted'));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.deleteFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const deleteShipmentItem = useCallback(
    async (id: string, itemId: string): Promise<void> => {
      try {
        await deleter(endpoints.shipments.deleteItem(id, itemId));
        toast.success(t('shipments.messages.itemDeleted'));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.itemDeleteFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const updateShipment = useCallback(
    async (id: string, payload: ShipmentUpdatePayload): Promise<ShipmentBatchApiResponse> => {
      try {
        const response = await putter<ShipmentBatchApiResponse | unknown>(
          endpoints.shipments.update(id),
          payload
        );
        toast.success(t('shipments.messages.updated'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.updateFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  const addShipmentItems = useCallback(
    async (id: string, payload: ShipmentItemsPayload): Promise<ShipmentBatchApiResponse> => {
      try {
        const response = await poster<ShipmentBatchApiResponse | unknown>(
          endpoints.shipments.items(id),
          payload
        );
        toast.success(t('shipments.messages.itemsAdded'));
        return normalizeBatchResponse(response);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError?.response?.data?.message || t('shipments.messages.itemsAddFailed');
        toast.error(message);
        throw error;
      }
    },
    [t]
  );

  return {
    getShipments,
    createShipmentBatch,
    getShipmentById,
    confirmShipment,
    cancelShipment,
    deleteShipment,
    deleteShipmentItem,
    updateShipment,
    addShipmentItems,
  };
}
