import type { GridColDef } from '@mui/x-data-grid';
import type { ICashier } from 'src/types/cashbox';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { useGetCashiers, useDeleteCashier } from 'src/actions/cashbox';

export function CashiersListView() {
    const { t } = useTranslation('menu');
    const { cashiers, cashiersLoading } = useGetCashiers();
    const { onDelete } = useDeleteCashier();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!deleteId) return;

        try {
            await onDelete(deleteId);
            toast.success(t('cashbox.cashiers.deleteSuccess'));
            setOpenConfirm(false);
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error?.message || t('cashbox.cashiers.deleteFailed'));
        }
    }, [deleteId, onDelete, t]);

    const columns: GridColDef[] = useMemo(
        () => [
            {
                field: 'name',
                headerName: t('cashbox.cashiers.name'),
                flex: 1,
                minWidth: 200,
            },
            {
                field: 'created_at',
                headerName: t('cashbox.cashiers.created_at'),
                flex: 1,
                minWidth: 180,
                type: 'dateTime',
                valueFormatter: (value: any) => {
                    if (!value) return '';
                    return new Date(value).toLocaleDateString();
                },
            },
            {
                field: 'actions',
                type: 'actions',
                headerName: t('common.actions'),
                width: 120,
                sortable: false,
                filterable: false,
                getActions: (params: any) => [
                    <CustomGridActionsCellItem
                        key="edit"
                        icon={<Iconify icon="solar:pen-bold" />}
                        label={t('common.edit')}
                        href={`${paths.cashbox.cashiers}/${params.row.id}/edit`}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        label={t('common.delete')}
                        style={{ color: '#FB6633' }}
                        onClick={() => {
                            setDeleteId(params.row.id);
                            setOpenConfirm(true);
                        }}
                    />,
                ],
            },
        ],
        [t]
    );

    return (
        <>
            <GenericTableView
                data={cashiers}
                columns={columns}
                loading={cashiersLoading}
                breadcrumbs={{
                    heading: t('cashbox.cashiers.title'),
                    links: [
                        { name: t('dashboard'), href: paths.dashboard.root },
                        { name: t('cashbox.sidebar.title'), href: paths.cashbox.root },
                        { name: t('cashbox.cashiers.title') },
                    ],
                }}
                addButton={{
                    label: t('common.add'),
                    href: `${paths.cashbox.cashiers}/new`,
                }}
            />

            <Dialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{t('cashbox.cashiers.deleteConfirmTitle')}</DialogTitle>
                <DialogContent>
                    {t('cashbox.cashiers.deleteConfirmMessage')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)}>
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
        </>
    );
}
