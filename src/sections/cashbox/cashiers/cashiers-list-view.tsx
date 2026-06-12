import type { ICashier } from 'src/types/cashbox';
import type { DataTableColumn } from 'src/sections/common/data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Button, IconButton } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetCashiers } from 'src/actions/cashbox';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { CELL_SX } from 'src/sections/common/data-table/utils/constants';
import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

import { CashierDeleteDialog } from './components/CashierDeleteDialog';
import { INITIAL_CASHIER_FILTERS, CASHIERS_TABLE_PERSIST_KEY } from './constants';

export function CashiersListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { cashiers } = useGetCashiers();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [filters, setFilters] = useState(INITIAL_CASHIER_FILTERS);
    const [draftFilters, setDraftFilters] = useState(INITIAL_CASHIER_FILTERS);


    const handleResetFilters = useCallback(() => {
        setDraftFilters(INITIAL_CASHIER_FILTERS);
    }, []);

    // Update filters when draft filters change
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            ...draftFilters,
        }));
    }, [draftFilters]);

    // Filter cashiers based on search
    const filteredCashiers = useMemo(() => {
        let filtered = cashiers;

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(cashier =>
                cashier.name.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [cashiers, filters]);

    const columns: DataTableColumn<ICashier>[] = useMemo(
        () => [
            {
                key: 'name',
                label: t('cashbox.cashiers.name'),
                sortable: true,
                filterable: true,
                width: '1.5fr',
                align: 'left',
                getValue: (row: ICashier) => row?.name || '',
                renderCell: ({ row }: { row: ICashier }) => (
                    <Box sx={CELL_SX}>
                        {row?.name || '-'}
                    </Box>
                ),
            },
            {
                key: 'created_at',
                label: t('cashbox.cashiers.created_at'),
                sortable: true,
                filterable: true,
                width: '1fr',
                align: 'left',
                getValue: (row: ICashier) =>
                    row?.created_at ? new Date(row.created_at).toLocaleDateString() : '',
                renderCell: ({ row }: { row: ICashier }) => {
                    const dateValue = row?.created_at ? new Date(row.created_at).toLocaleDateString() : '-';
                    return (
                        <Box sx={CELL_SX}>
                            {dateValue}
                        </Box>
                    );
                },
            },
            {
                key: 'actions',
                label: t('common.actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center',
                renderCell: ({ row }: { row: ICashier }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1
                    }}>
                        <IconButton
                            size="small"
                            onClick={() => router.push(`${paths.cashbox.cashiers}/${row.id}/edit`)}
                            sx={{ 
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setDeleteId(row.id);
                                setOpenDeleteDialog(true);
                            }}
                            sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                    backgroundColor: 'error.lighter',
                                    color: 'error.dark'
                                }
                            }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, router]
    );


    return (
        <>
            <DashboardContent
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '100vh',
                    '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
                    '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
                }}
            >
                <DeductionUtilityDataTable
                    persistKey={CASHIERS_TABLE_PERSIST_KEY}
                    data={filteredCashiers}
                    getRowId={(row: ICashier) => String(row?.id)}
                    columns={columns}
                    defaultConfig={{
                        order: ['name', 'created_at', 'actions'],
                        visibility: {
                            name: true,
                            created_at: true,
                            actions: true,
                        },
                        widths: {
                            name: '1.5fr',
                            created_at: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={handleResetFilters}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            href={`${paths.cashbox.cashiers}/new`}
                            size="small"
                        >
                            {t('common.add')}
                        </Button>
                    }
                />
            </DashboardContent>

            <CashierDeleteDialog
                open={openDeleteDialog}
                cashierId={deleteId}
                onClose={() => {
                    setOpenDeleteDialog(false);
                    setDeleteId(null);
                }}
                onSuccess={() => {
                    setDeleteId(null);
                }}
            />
        </>
    );
}
