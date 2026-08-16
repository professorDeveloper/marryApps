import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';

import { toast } from 'src/components/snackbar';

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
            toast.success(t('common.deleteSuccess'));
            onClose();
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || t('common.deleteFailed'));
        }
    }, [transferId, deleteTransfer, onClose, onSuccess, t]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('common.deleteConfirmTitle')}</DialogTitle>
            <DialogContent>
                {t('common.deleteConfirmMessage')}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="contained"
                    color="error"
                >
                    {t('common.delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
