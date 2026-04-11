import type { IDevice, DeviceModalState, IDeviceFormData } from '../types';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useGetDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from 'src/actions/devices';

export function useDevicesData() {
  const { t } = useTranslation('menu');

  const { devices, devicesLoading, devicesEmpty } = useGetDevices();
  const { createDevice } = useCreateDevice();
  const { updateDevice } = useUpdateDevice();
  const { deleteDevice } = useDeleteDevice();

  // Form dialog state
  const [modalState, setModalState] = useState<DeviceModalState>({
    open: false,
    mode: 'create',
    device: null,
  });

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<IDevice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // -- Form dialog handlers --
  const handleOpenCreate = useCallback(() => {
    setModalState({ open: true, mode: 'create', device: null });
  }, []);

  const handleOpenEdit = useCallback((device: IDevice) => {
    setModalState({ open: true, mode: 'edit', device });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, open: false, device: null }));
  }, []);

  const handleFormSubmit = useCallback(
    async (formData: IDeviceFormData) => {
      try {
        if (modalState.mode === 'create') {
          await createDevice(formData);
          toast.success(t('devices.createSuccess'));
        } else if (modalState.device) {
          await updateDevice(modalState.device.id, formData);
          toast.success(t('devices.updateSuccess'));
        }
        handleCloseModal();
      } catch (err: any) {
        toast.error(err?.message || t('devices.saveFailed'));
      }
    },
    [modalState, createDevice, updateDevice, handleCloseModal, t]
  );

  // -- Delete dialog handlers --
  const handleDeleteClick = useCallback((device: IDevice) => {
    setDeleteTarget(device);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteDevice(deleteTarget.id);
      toast.success(t('devices.deleteSuccess'));
    } catch (err: any) {
      toast.error(err?.message || t('devices.deleteFailed'));
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteDevice, t]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, []);

  return {
    devices,
    devicesLoading,
    devicesEmpty,
    modalState,
    deleteDialogOpen,
    deleteTarget,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleFormSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
}
