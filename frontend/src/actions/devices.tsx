import type { SWRConfiguration } from 'swr';
import type { BackendResponse } from 'src/types/inventory';
import type { IDevice, IDeviceFormData } from 'src/sections/settings/devices/types';

import useSWR from 'swr';
import { useCallback } from 'react';

import { mutate } from 'src/lib/swr';
import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetDevices() {
  const { data, isLoading, error, isValidating } =
    useSWR<BackendResponse<IDevice[]>>(endpoints.printerSettings.list, fetcher, swrOptions);

  return {
    devices: data?.data ?? [],
    devicesLoading: isLoading,
    devicesError: error,
    devicesValidating: isValidating,
    devicesEmpty: !isLoading && !isValidating && !(data?.data?.length),
  };
}

export function useCreateDevice() {
  const createDevice = useCallback(async (formData: IDeviceFormData) => {
    const response = await poster<IDevice>(endpoints.printerSettings.create, formData);
    await mutate(endpoints.printerSettings.list);
    return response;
  }, []);

  return { createDevice };
}

export function useUpdateDevice() {
  const updateDevice = useCallback(async (id: number, formData: IDeviceFormData) => {
    const response = await putter<IDevice>(endpoints.printerSettings.update(id), formData);
    await mutate(endpoints.printerSettings.list);
    return response;
  }, []);

  return { updateDevice };
}

export function useDeleteDevice() {
  const deleteDevice = useCallback(async (id: number) => {
    await deleter(endpoints.printerSettings.delete(id));
    await mutate(endpoints.printerSettings.list);
  }, []);

  return { deleteDevice };
}
