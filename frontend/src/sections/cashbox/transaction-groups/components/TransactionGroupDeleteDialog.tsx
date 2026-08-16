import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { useDeleteGroupTransaction } from 'src/actions/cashbox';

import { toast } from 'src/components/snackbar';

export interface TransactionGroupDeleteDialogProps {
    open: boolean;
    groupId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function TransactionGroupDeleteDialog({
    open,
    groupId,
    onClose,
    onSuccess,
}: TransactionGroupDeleteDialogProps) {
    const { t } = useTranslation('menu');
    const { onDelete } = useDeleteGroupTransaction();

    const handleDelete = useCallback(async () => {
        if (!groupId) return;

        try {
            await onDelete(groupId);
            toast.success(t('common.deleteSuccess'));
            onClose();
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || t('common.deleteFailed'));
        }
    }, [groupId, onDelete, onClose, onSuccess, t]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
            <DialogContent>
                {t('common.deleteConfirmation')}
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
