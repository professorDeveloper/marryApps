import type { IBranchFormData } from 'src/types/branches';

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

const FORM_ID = 'branch-form';

interface BranchFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IBranchFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function BranchFormDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: BranchFormDialogProps) {
  const { t } = useTranslation('menu');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IBranchFormData>({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      color_code: '',
      picture_url: '',
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('branches.createTitle')}</DialogTitle>

      <DialogContent>
        <Box
          component="form"
          id={FORM_ID}
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <TextField
            label={t('branches.name')}
            {...register('name', { required: t('validation.required') })}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            autoFocus
          />

          <TextField
            label={t('branches.address')}
            {...register('address')}
            error={!!errors.address}
            helperText={errors.address?.message}
            fullWidth
          />

          <TextField
            label={t('branches.phone')}
            {...register('phone')}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
          />

          <TextField
            label={t('branches.colorCode')}
            {...register('color_code')}
            error={!!errors.color_code}
            helperText={errors.color_code?.message}
            fullWidth
            placeholder="#000000"
          />

          <TextField
            label={t('branches.pictureUrl')}
            {...register('picture_url')}
            error={!!errors.picture_url}
            helperText={errors.picture_url?.message}
            fullWidth
            placeholder="https://example.com/image.png"
          />
        </Box>
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
          {t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
