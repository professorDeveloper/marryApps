import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
    useGetCashier,
    useCreateCashier,
    useUpdateCashier,
} from 'src/actions/cashbox';

interface CashierEditViewProps {
    isNew?: boolean;
}

export function CashierEditView({ isNew = false }: CashierEditViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams();

    const { cashier } = useGetCashier(!isNew && id ? id : '');
    const { onSubmit: onCreate } = useCreateCashier();
    const { onSubmit: onUpdate } = useUpdateCashier(id || '');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        defaultValues: useMemo(
            () => ({
                name: '',
                group_transaction_id: '',
            }),
            []
        ),
    });

    // Set form values when cashier data loads
    const formReset = useCallback(() => {
        if (!isNew && cashier) {
            reset({
                name: cashier.name,
                group_transaction_id: cashier.group_transaction_id,
            });
        }
    }, [cashier, isNew, reset]);

    // Reset form when cashier loads
    useEffect(() => {
        formReset();
    }, [formReset]);

    const onFormSubmit = handleSubmit(async (data) => {
        try {
            if (isNew) {
                await onCreate({ name: data.name, group_transaction_id: data.group_transaction_id });
                toast.success(t('cashbox.cashiers.createSuccess'));
            } else {
                await onUpdate({ name: data.name, group_transaction_id: data.group_transaction_id });
                toast.success(t('cashbox.cashiers.updateSuccess'));
            }
            navigate(paths.cashbox.cashiers);
        } catch (error: any) {
            toast.error(error?.message || t('cashbox.cashiers.saveFailed'));
        }
    });

    return (
        <DashboardContent>
            <CustomBreadcrumbs
                heading={isNew ? t('cashbox.cashiers.new') : t('cashbox.cashiers.edit')}
                links={[
                    { name: t('dashboard'), href: paths.dashboard.root },
                    { name: t('cashbox.sidebar.title'), href: paths.cashbox.root },
                    { name: t('cashbox.cashiers.title'), href: paths.cashbox.cashiers },
                    { name: isNew ? t('cashbox.cashiers.new') : t('cashbox.cashiers.edit') },
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
                            label={t('cashbox.cashiers.name')}
                            {...register('name', {
                                required: t('cashbox.cashiers.nameRequired'),
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
