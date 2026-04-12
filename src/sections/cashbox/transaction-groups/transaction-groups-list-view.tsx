import type { RowAction, DataTableColumn, DataTableDefaultConfig } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetGroupTransactions } from 'src/actions/cashbox';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';
import type { TransactionGroup } from './types';
import { TRANSACTION_GROUPS_TABLE_PERSIST_KEY } from './constants';
import { TransactionGroupDeleteDialog } from './components/TransactionGroupDeleteDialog';

export function CashRegistersListView() {
    const { t } = useTranslation('menu');
    const { groupTransactions, groupTransactionsLoading } = useGetGroupTransactions();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [searchValue, setSearchValue] = useState('');

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
                        persistKey={TRANSACTION_GROUPS_TABLE_PERSIST_KEY}
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

            <TransactionGroupDeleteDialog
                open={openConfirm}
                groupId={deleteId}
                onClose={() => {
                    setOpenConfirm(false);
                    setDeleteId(null);
                }}
                onSuccess={() => {
                    setDeleteId(null);
                }}
            />
        </>
    );
}
