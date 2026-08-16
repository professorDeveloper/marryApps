import type { IMealsItem } from 'src/types/meals';

import { useTranslation } from 'react-i18next';
import { useState, forwardRef, useImperativeHandle } from 'react';

import {
    Box, Button, Dialog, TextField,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

export interface StopMealDialogRef {
    open: (meal: IMealsItem) => void;
}

interface StopMealDialogProps {
    onConfirm: (meal: IMealsItem, reason: string, durationMinutes: string) => void | Promise<void>;
}

export const StopMealDialog = forwardRef<StopMealDialogRef, StopMealDialogProps>(({ onConfirm }, ref) => {
    const { t } = useTranslation('menu');
    const [open, setOpen] = useState(false);
    const [meal, setMeal] = useState<IMealsItem | null>(null);
    const [reason, setReason] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');

    useImperativeHandle(ref, () => ({
        open: (selectedMeal: IMealsItem) => {
            setMeal(selectedMeal);
            setReason('');
            setDurationMinutes('');
            setOpen(true);
        },
    }));

    const handleClose = () => {
        setOpen(false);
        setMeal(null);
        setReason('');
        setDurationMinutes('');
    };

    const handleConfirm = async () => {
        if (!meal) return;
        await onConfirm(meal, reason, durationMinutes);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('mealsProducts.stopList.dialogTitle')}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label={t('mealsProducts.stopList.reason')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                    />
                    <TextField
                        label={t('mealsProducts.stopList.durationMinutes')}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                        fullWidth
                        type="number"
                        slotProps={{ htmlInput: { min: 0 } }}
                        helperText={t('mealsProducts.stopList.durationHelp')}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    {t('mealsProducts.cancel')}
                </Button>
                <Button onClick={handleConfirm} color="warning" variant="contained">
                    {t('mealsProducts.stopList.confirmStop')}
                </Button>
            </DialogActions>
        </Dialog>
    );
});
