import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
    useGetGroupTransaction,
    useCreateGroupTransaction,
    useUpdateGroupTransaction,
} from 'src/actions/cashbox';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

interface CashRegisterEditViewProps {
    isNew?: boolean;
}

export function CashRegisterEditView({ isNew = false }: CashRegisterEditViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams();

    const { groupTransaction } = useGetGroupTransaction(!isNew && id ? id : '');
    const { onSubmit: onCreate } = useCreateGroupTransaction();
    const { onSubmit: onUpdate } = useUpdateGroupTransaction(id || '');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        defaultValues: useMemo(
            () => ({
                name: '',
            }),
            []
        ),
    });

    // Set form values when transaction group data loads
    const formReset = useCallback(() => {
        if (!isNew && groupTransaction) {
            reset({
                name: groupTransaction.name,
            });
        }
    }, [groupTransaction, isNew, reset]);

    // Reset form when transaction group data loads
    useMemo(() => {
        formReset();
    }, [formReset]);

    const onFormSubmit = handleSubmit(async (data) => {
        try {
            if (isNew) {
                await onCreate({ name: data.name });
                toast.success(t('common.createSuccess', 'Created successfully'));
            } else {
                await onUpdate({ name: data.name });
                toast.success(t('common.updateSuccess', 'Updated successfully'));
            }
            navigate(paths.cashbox.transactionGroups);
        } catch (error: any) {
            toast.error(error?.message || t('common.saveFailed', 'Failed to save'));
        }
    });

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading={isNew ? t('cashbox.newTransactionGroup', 'New Transaction Group') : t('cashbox.editTransactionGroup', 'Edit Transaction Group')}
                links={[
                    { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
                    { name: t('cashbox.title', 'Cashbox'), href: paths.cashbox.root },
                    { name: t('cashbox.transactionGroups', 'Transaction Groups'), href: paths.cashbox.transactionGroups },
                    { name: isNew ? t('cashbox.newTransactionGroup', 'New') : t('cashbox.editTransactionGroup', 'Edit') },
                ]}
                sx={{ mb: { xs: 3, md: 5 } }}
            />

            <Card
                sx={{
                    p: 3,
                    maxWidth: 600,
                }}
            >
                <form onSubmit={onFormSubmit}>
                    <Stack spacing={3}>
                        <TextField
                            label={t('common.name', 'Name')}
                            {...register('name', {
                                required: t('common.nameRequired', 'Name is required'),
                            })}
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            fullWidth
                        />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                onClick={() => navigate(-1)}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                            >
                                {isNew ? t('common.create', 'Create') : t('common.update', 'Update')}
                            </Button>
                        </Stack>
                    </Stack>
                </form>
            </Card>
        </DashboardContent>
    );
}
