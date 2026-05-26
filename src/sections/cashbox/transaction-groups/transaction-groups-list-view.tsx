import type { RowAction, DataTableColumn, DataTableDefaultConfig } from 'src/sections/common/data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetGroupTransactions } from 'src/actions/cashbox';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/common/data-table/components/DataTable';
import type { TransactionGroup } from './types';
import { TRANSACTION_GROUPS_TABLE_PERSIST_KEY } from './constants';
import { TransactionGroupDeleteDialog } from './components/TransactionGroupDeleteDialog';

export function CashRegistersListView() {
    const { t } = useTranslation('menu');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortState, setSortState] = useState<{ key: string | null; dir: string | null }>({ key: null, dir: null });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchValue), 400);
        return () => clearTimeout(t);
    }, [searchValue]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch]);

    const { groupTransactions, groupTransactionsLoading, total } = useGetGroupTransactions({
        search: debouncedSearch || undefined,
        sort_by: sortState.key || undefined,
        sort_order: (sortState.dir === 'asc' || sortState.dir === 'desc') ? sortState.dir : undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
    });

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [openConfirm, setOpenConfirm] = useState(false);

    const columns: DataTableColumn<TransactionGroup>[] = useMemo(
        () => [
            {
                key: 'name',
                label: t('common.name'),
                width: '1fr',
                sortable: true,
                filterable: true,
                align: 'left',
            },
            {
                key: 'created_at',
                label: t('common.created_at'),
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
                label: t('common.edit'),
                icon: <Iconify icon="solar:pen-bold" />,
                onClick: (row) => {
                    window.location.href = `/menu/cashbox/transaction-groups/${row.id}/edit`;
                },
            },
            {
                label: t('common.delete'),
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
        setDebouncedSearch('');
        setPage(0);
        setRowsPerPage(20);
        setSortState({ key: null, dir: null });
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
                        search={{ value: searchValue, onChange: setSearchValue }}
                        onSortChange={(sort) => {
                            setSortState({ key: sort.key, dir: sort.dir });
                            setPage(0);
                        }}
                        pagination={{
                            page,
                            rowsPerPage,
                            totalCount: total,
                            rowsPerPageOptions: [20, 50, 100],
                            onPageChange: setPage,
                            onRowsPerPageChange: (newRowsPerPage) => {
                                setRowsPerPage(newRowsPerPage);
                                setPage(0);
                            },
                        }}
                        rowActions={rowActions}
                        getRowId={getRowId}
                        emptyTitle={t('common.noData')}
                        emptySubtitle={t('common.noDataSubtitle')}
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
