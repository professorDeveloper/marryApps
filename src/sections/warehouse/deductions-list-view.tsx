import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    useTheme,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { useDeductionsAPI, Deduction, DeductionGroup } from 'src/hooks/use-deductions-api';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { fetcher, endpoints } from 'src/lib/axios';

interface Storage {
    id: string;
    name: string;
}

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
}

export function DeductionsListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();
    const { getDeductions, deleteDeduction, getDeductionGroups } = useDeductionsAPI();
    const [deductions, setDeductions] = useState<Deduction[]>([]);
    const [groups, setGroups] = useState<DeductionGroup[]>([]);
    const [storages, setStorages] = useState<Storage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Fetch deductions and groups
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Load groups and storages FIRST (in parallel)
            const [groupsData, storagesData] = await Promise.all([
                getDeductionGroups(),
                fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(() => ({
                    data: [],
                })),
            ]);

            // Update state - handle both empty and valid responses
            const finalGroups = Array.isArray(groupsData) ? groupsData : [];
            const finalStorages = Array.isArray(storagesData?.data) ? storagesData.data : [];

            setGroups(finalGroups);
            setStorages(finalStorages);

            // Then load deductions
            const deductionsData = await getDeductions();

            // Enrich deductions with storage_name and group_name if not present
            const enrichedDeductions = deductionsData.map(d => {
                const storage = finalStorages.find(s => s.id === d.storage_id);
                const group = finalGroups.find(g => g.id === d.act_group_id);

                return {
                    ...d,
                    storage_name: d.storage_name || storage?.name,
                    group_name: d.group_name || group?.name,
                };
            });

            setDeductions(enrichedDeductions);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Continue anyway - deduction object may have storage_name and group_name
        } finally {
            setLoading(false);
        }
    }, [getDeductions, getDeductionGroups]);

    // Load data on mount
    const [mounted, setMounted] = useState(false);
    if (!mounted) {
        setMounted(true);
        fetchData();
    }

    // Get group name by ID
    const getGroupName = (row: Deduction): string => {
        // Try to use backend-provided group_name first
        if (row.group_name) {
            return row.group_name;
        }
        // Fallback: search in groups array
        const group = groups.find((g) => g.id === row.act_group_id);
        return group?.name || `[Group: ${row.act_group_id}]`;
    };

    // Get storage name by ID
    const getStorageName = (row: Deduction): string => {
        // Try to use backend-provided storage_name first
        if (row.storage_name) {
            return row.storage_name;
        }
        // Fallback: search in storages array
        const storage = storages.find((s) => s.id === row.storage_id);
        return storage?.name || `[Storage: ${row.storage_id}]`;
    };

    // Handle delete deduction
    const handleDeleteClick = (id: string) => {
        setSelectedDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDeleteId) return;

        try {
            await deleteDeduction(selectedDeleteId);
            setDeductions(deductions.filter((d) => d.id !== selectedDeleteId));
            setDeleteDialogOpen(false);
            setSelectedDeleteId(null);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
    };

    // Format date
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('uz-UZ');
    };

    // Format price
    const formatPrice = (price: string | number): string => {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const columns = useMemo<GridColDef[]>(
        () => [
            // {
            //     field: 'number',
            //     headerName: t('deductions.number', 'Act Number'),
            //     // flex: 0.8,
            //     minWidth: 80,
            // },
            {
                field: 'storage_id',
                headerName: t('deductions.storage', 'Storage'),
                flex: 1,
                minWidth: 180,
                renderCell: (params) => getStorageName(params.row),
            },
            {
                field: 'act_group_id',
                headerName: t('deductions.group', 'Group'),
                flex: 1,
                minWidth: 150,
                renderCell: (params) => getGroupName(params.row),
            },
            {
                field: 'description',
                headerName: t('deductions.description', 'Description'),
                flex: 2,
                minWidth: 200,
            },
            {
                field: 'balance',
                headerName: t('deductions.balance', 'Balance'),
                flex: 0.6,
                minWidth: 120,
                // align: 'center',
                renderCell: (params) => formatPrice(params.row.balance),
            },
            {
                field: 'status',
                headerName: t('deductions.status', 'Status'),
                flex: 0.8,
                align: 'center',
                minWidth: 100,
                renderCell: (params) => (
                    <Box
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            mt: 1.5,
                            mb: 1.5,
                            borderRadius: 0.75,
                            backgroundColor:
                                params.row.status === 'active'
                                    ? theme.vars.palette.success.lighter
                                    : theme.vars.palette.warning.lighter,
                            color:
                                params.row.status === 'active'
                                    ? theme.vars.palette.success.dark
                                    : theme.vars.palette.warning.dark,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        {params.row.status}
                    </Box>
                ),
            },
            {
                field: 'date',
                headerName: t('deductions.date', 'Date'),
                // flex: 1,
                minWidth: 100,
                renderCell: (params) => formatDate(params.row.date),
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: ' ',
                width: 64,
                align: 'right',
                headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    // <CustomGridActionsCellItem
                    //     showInMenu
                    //     label={t('common.view', 'View')}
                    //     icon={<Iconify icon="solar:eye-bold" />}
                    //     onClick={() => router.push(paths.warehouse.deductions.details(String(params.id)))}
                    // />,
                    <CustomGridActionsCellItem
                        showInMenu
                        label={t('common.edit', 'Edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        onClick={() => router.push(paths.warehouse.deductions.details(String(params.id)))}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        showInMenu
                        label={t('common.delete', 'Delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(String(params.id))}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [t, theme]
    );

    return (
        <>
            <GenericTableView
                data={deductions}
                columns={columns}
                loading={loading}
                breadcrumbs={{
                    heading: t('deductions.title', 'Deductions'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                        { name: t('deductions.title', 'Deductions'), href: paths.warehouse.deductions.root },
                    ],
                }}
                addButton={{
                    label: t('deductions.addNew', 'Add New Deduction'),
                    href: paths.warehouse.deductions.new,
                }}
                onDeleteRow={handleDeleteClick}
            // onRowClick={(id: string) => {
            //     router.push(paths.warehouse.deductions.details(id));
            // }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>{t('common.confirmDelete', 'Confirm Delete')}</DialogTitle>
                <DialogContent>
                    {t('common.deleteMessage', 'Are you sure you want to delete this deduction?')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
