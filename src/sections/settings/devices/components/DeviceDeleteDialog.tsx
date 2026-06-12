import type { IDevice } from '../types';

import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

interface DeviceDeleteDialogProps {
  open: boolean;
  device: IDevice | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeviceDeleteDialog({
  open,
  device,
  onConfirm,
  onCancel,
}: DeviceDeleteDialogProps) {
  const { t } = useTranslation('menu');

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{t('devices.deleteTitle')}</DialogTitle>
      <DialogContent>
        <Typography>
          {t('devices.deleteMessage', { ip: device?.ip ?? '' })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">
          {t('common.cancel')}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
