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
import { useDeleteGroupTransaction } from 'src/actions/cashbox';

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
            toast.success(t('common.deleteSuccess', 'Successfully deleted'));
            onClose();
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || t('common.deleteFailed', 'Failed to delete'));
        }
    }, [groupId, onDelete, onClose, onSuccess, t]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('common.confirmDelete', 'Confirm Delete')}</DialogTitle>
            <DialogContent>
                {t('common.deleteConfirmation', 'Are you sure you want to delete this item?')}
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
