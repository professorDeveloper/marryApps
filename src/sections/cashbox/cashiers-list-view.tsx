import type { GridColDef } from '@mui/x-data-grid';
import type { ICashier } from 'src/types/cashbox';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { useGetCashiers, useDeleteCashier } from 'src/actions/cashbox';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

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
            toast.success(t('common.deleteSuccess', 'Successfully deleted'));
            setOpenConfirm(false);
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error?.message || t('common.deleteFailed', 'Failed to delete'));
        }
    }, [deleteId, onDelete, t]);

    const columns: GridColDef[] = useMemo(
        () => [
            {
                field: 'name',
                headerName: t('common.name', 'Name'),
                flex: 1,
                minWidth: 200,
            },
            {
                field: 'created_at',
                headerName: t('common.createdAt', 'Created At'),
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
                headerName: t('common.actions', 'Actions'),
                width: 80,
                sortable: false,
                filterable: false,
                getActions: (params: any) => [
                    <CustomGridActionsCellItem
                        key="edit"
                        icon={<Iconify icon="solar:pen-bold" />}
                        label={t('common.edit', 'Edit')}
                        href={`/menu/cashbox/cashiers/${params.row.id}/edit`}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        label={t('common.delete', 'Delete')}
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
            <DashboardContent>
                <CustomBreadcrumbs
                    heading={t('cashbox.cashiers', 'Cashiers')}
                    links={[
                        { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
                        { name: t('cashbox.title', 'Cashbox'), href: paths.cashbox.root },
                        { name: t('cashbox.cashiers', 'Cashiers') },
                    ]}
                    action={
                        <Button
                            component={RouterLink}
                            href={`/menu/cashbox/cashiers/new`}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                        >
                            {t('common.add', 'Add')}
                        </Button>
                    }
                    // sx={{ mb: { xs: 3, md: 5 } }}
                />

                <GenericTableView
                    data={cashiers}
                    columns={columns}
                    loading={cashiersLoading}
                    breadcrumbs={{
                        heading: '',
                        links: [],
                    }}
                />
            </DashboardContent>

            <Dialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{t('common.confirmDelete', 'Confirm Delete')}</DialogTitle>
                <DialogContent>
                    {t('common.deleteConfirmation', 'Are you sure you want to delete this item?')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)}>
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
        </>
    );
}
