import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { useDeleteCashier } from 'src/actions/cashbox';

import { toast } from 'src/components/snackbar';

export interface CashierDeleteDialogProps {
    open: boolean;
    cashierId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function CashierDeleteDialog({
    open,
    cashierId,
    onClose,
    onSuccess,
}: CashierDeleteDialogProps) {
    const { t } = useTranslation('menu');
    const { onDelete } = useDeleteCashier();

    const handleDelete = useCallback(async () => {
        if (!cashierId) return;

        try {
            await onDelete(cashierId);
            toast.success(t('cashbox.cashiers.deleteSuccess'));
            onClose();
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || t('cashbox.cashiers.deleteFailed'));
        }
    }, [cashierId, onDelete, onClose, onSuccess, t]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('cashbox.cashiers.deleteConfirmTitle')}</DialogTitle>
            <DialogContent>
                {t('cashbox.cashiers.deleteConfirmMessage')}
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
