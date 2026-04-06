import type { RowAction, DataTableColumn, DataTableDefaultConfig } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetGroupTransactions, useDeleteGroupTransaction } from 'src/actions/cashbox';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';

// Types for transaction groups
interface TransactionGroup {
  id: string;
  name: string;
  created_at: string | Date;
}

export function CashRegistersListView() {
    const { t } = useTranslation('menu');
    const { groupTransactions, groupTransactionsLoading } = useGetGroupTransactions();
    const { onDelete } = useDeleteGroupTransaction();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [searchValue, setSearchValue] = useState('');

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

    const columns: DataTableColumn<TransactionGroup>[] = useMemo(
        () => [
            {
                key: 'name',
                label: t('common.name', 'Name'),
                width: '1fr',
                sortable: true,
                filterable: true,
                align: 'left',
            },
            {
                key: 'created_at',
                label: t('common.created_at', 'Created At'),
                width: 180,
                sortable: true,
                filterable: true,
                align: 'center',
                mono: true,
                getValue: (row) => row.created_at,
                renderCell: ({ value }) => {
                    if (!value) return '';
                    const date = typeof value === 'string' ? new Date(value) : value as Date;
                    return date.toLocaleDateString();
                },
            },
        ],
        [t]
    );

    const rowActions: RowAction<TransactionGroup>[] = useMemo(
        () => [
            {
                label: t('common.edit', 'Edit'),
                icon: <Iconify icon="solar:pen-bold" />,
                onClick: (row) => {
                    window.location.href = `/menu/cashbox/transaction-groups/${row.id}/edit`;
                },
            },
            {
                label: t('common.delete', 'Delete'),
                icon: <Iconify icon="solar:trash-bin-trash-bold" />,
                onClick: (row) => {
                    setDeleteId(row.id);
                    setOpenConfirm(true);
                },
            },
        ],
        [t]
    );

    const defaultConfig: DataTableDefaultConfig = useMemo(
        () => ({
            order: ['name', 'created_at'],
            visibility: {
                name: true,
                created_at: true,
            },
            widths: {
                name: '1fr',
                created_at: 180,
            },
        }),
        []
    );

    const handleReset = useCallback(() => {
        setSearchValue('');
    }, []);

    const getRowId = useCallback((row: TransactionGroup) => row.id, []);

    return (
        <>
            <DashboardContent>
                {groupTransactionsLoading ? (
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        minHeight={400}
                    >
                        <Typography variant="h6">Loading...</Typography>
                    </Box>
                ) : (
                    <DataTable<TransactionGroup>
                        persistKey="cashbox-transaction-groups"
                        data={groupTransactions || []}
                        columns={columns}
                        defaultConfig={defaultConfig}
                        onReset={handleReset}
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        rowActions={rowActions}
                        getRowId={getRowId}
                        emptyTitle={t('common.noData', 'No data')}
                        emptySubtitle={t('common.noDataSubtitle', 'Try adjusting filters or columns.')}
                    />
                )}
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
