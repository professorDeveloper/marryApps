import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { useTransfersAPI } from 'src/hooks/use-transfers-api';

export interface TransferDeleteDialogProps {
    open: boolean;
    transferId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransferDeleteDialog({
    open,
    transferId,
    onClose,
    onSuccess,
}: TransferDeleteDialogProps) {
    const { t } = useTranslation('menu');
    const { deleteTransfer } = useTransfersAPI();

    const handleDelete = useCallback(async () => {
        if (!transferId) return;

        try {
            await deleteTransfer(transferId);
            toast.success(t('common.deleteSuccess', 'Successfully deleted'));
            onClose();
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || t('common.deleteFailed', 'Failed to delete'));
        }
    }, [transferId, deleteTransfer, onClose, onSuccess, t]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('common.deleteConfirmTitle', 'Confirm delete')}</DialogTitle>
            <DialogContent>
                {t('common.deleteConfirmMessage', 'Are you sure?')}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="contained"
                    color="error"
                >
                    {t('common.delete', 'Delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
