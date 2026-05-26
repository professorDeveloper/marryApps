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
                toast.success(t('common.createSuccess'));
            } else {
                await onUpdate({ name: data.name });
                toast.success(t('common.updateSuccess'));
            }
            navigate(paths.cashbox.transactionGroups);
        } catch (error: any) {
            toast.error(error?.message || t('common.saveFailed'));
        }
    });

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading={isNew ? t('cashbox.newTransactionGroup') : t('cashbox.editTransactionGroup')}
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t('cashbox.title'), href: paths.cashbox.root },
                    { name: t('cashbox.transactionGroups'), href: paths.cashbox.transactionGroups },
                    { name: isNew ? t('cashbox.newTransactionGroup') : t('cashbox.editTransactionGroup') },
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
                            label={t('common.name')}
                            {...register('name', {
                                required: t('common.nameRequired'),
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
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                            >
                                {isNew ? t('common.create') : t('common.update')}
                            </Button>
                        </Stack>
                    </Stack>
                </form>
            </Card>
        </DashboardContent>
    );
}
