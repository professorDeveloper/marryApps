import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
    useGetCashRegister,
    useCreateCashRegister,
    useUpdateCashRegister,
} from 'src/actions/cashbox';

interface CashRegisterEditViewProps {
    isNew?: boolean;
}

export function CashRegisterEditView({ isNew = false }: CashRegisterEditViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams();

    const { cashRegister, cashRegisterLoading } = useGetCashRegister(!isNew && id ? id : '');
    const { onSubmit: onCreate } = useCreateCashRegister();
    const { onSubmit: onUpdate } = useUpdateCashRegister(id || '');

    const {
        control,
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

    // Set form values when cash register data loads
    const formReset = useCallback(() => {
        if (!isNew && cashRegister) {
            reset({
                name: cashRegister.name,
            });
        }
    }, [cashRegister, isNew, reset]);

    // Reset form when cash register loads
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
