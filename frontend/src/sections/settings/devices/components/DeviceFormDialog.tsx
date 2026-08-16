import type { IDeviceFormData, DeviceModalState } from '../types';

import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { DeviceForm } from './DeviceForm';

const FORM_ID = 'device-form';

interface DeviceFormDialogProps {
  modalState: DeviceModalState;
  onClose: () => void;
  onSubmit: (data: IDeviceFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function DeviceFormDialog({
  modalState,
  onClose,
  onSubmit,
  isSubmitting,
}: DeviceFormDialogProps) {
  const { t } = useTranslation('menu');
  const isEdit = modalState.mode === 'edit';

  return (
    <Dialog open={modalState.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t('devices.editTitle') : t('devices.createTitle')}
      </DialogTitle>

      <DialogContent>
        <DeviceForm
          formId={FORM_ID}
          defaultValues={
            isEdit && modalState.device
              ? {
                  ip: modalState.device.ip,
                  port: modalState.device.port,
                  type: modalState.device.type,
                  connected_entity_ids: modalState.device.connected_entity_ids,
                }
              : undefined
          }
          onSubmit={onSubmit}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isEdit ? t('common.update') : t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
