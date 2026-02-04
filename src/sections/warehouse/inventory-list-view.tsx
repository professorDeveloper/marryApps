import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, useTheme } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { toast } from 'src/components/snackbar';
import { useInventoryAPI } from 'src/hooks/use-inventory-api';
import { useGetStorages } from 'src/actions/departments';
import dayjs from 'dayjs';
import type { IInventory } from 'src/types/inventory';

// ============================================================================
// RENDER CELLS
// ============================================================================

function RenderCellStatus({ params }: { params: any }) {
    const { row } = params;
    const status = row.status || 'draft';

    const statusConfig: Record<string, { label: string; color: string }> = {
        active: { label: 'Active', color: '#22c55e' },
        completed: { label: 'Completed', color: '#3b82f6' },
        draft: { label: 'Draft', color: '#6b7280' },
        cancelled: { label: 'Cancelled', color: '#ef4444' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <Box
            sx={{
                px: 2,
                py: 0.75,
                borderRadius: 0.75,
                backgroundColor: `${config.color}20`,
                color: config.color,
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
            }}
        >
            {config.label}
        </Box>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InventoryListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();
    const { getInventories, deleteInventory } = useInventoryAPI();
    const { storages } = useGetStorages();

    const [inventories, setInventories] = useState<IInventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Create storage name map
    const storageNameById = useMemo(
        () => new Map(Array.isArray(storages) ? storages.map((s: any) => [s.id, s.name]) : []),
        [storages]
    );

    const loadInventories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getInventories();
            setInventories(data);
        } catch (error) {
            console.error('Error loading inventories:', error);
        } finally {
            setLoading(false);
        }
    }, [getInventories]);

    useEffect(() => {
        loadInventories();
    }, [loadInventories]);

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteInventory(id);
                setInventories((prev) => prev.filter((inv) => inv.id !== id));
                setDeleteConfirmOpen(false);
                setDeleteId(null);
            } catch (error) {
                console.error('Error deleting inventory:', error);
            }
        },
        [deleteInventory]
    );

    const handleEdit = useCallback(
        (id: string) => {
            router.push(paths.menu.inventory.edit(id));
        },
        [router]
    );

    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'number',
                headerName: t('inventory.number'),
                width: 120,
                renderCell: (params) => <Box sx={{ mt: 1.5, mb: 1.5 }}>{params.row.number}</Box>,
            },
            {
                field: 'date',
                headerName: t('inventory.date'),
                width: 150,
                valueGetter: (_value, row) =>
                    row.date ? dayjs(row.date).format('DD.MM.YYYY') : '-',
            },
            {
                field: 'storage_id',
                headerName: t('inventory.storage'),
                width: 170,
                flex: 1,
                valueGetter: (_value, row) =>
                    row.storage_id ? storageNameById.get(row.storage_id) || row.storage_id : '-',
            },
            // {
            //     field: 'description',
            //     headerName: t('inventory.description'),
            //     flex: 1,
            //     minWidth: 200,
            //     valueGetter: (_value, row) => row.description || '-',
            // },
            {
                field: 'status',
                headerName: t('inventory.status'),
                width: 120,
                renderCell: (params) => <RenderCellStatus params={params} />,
            },
            {
                field: 'remaining_amount',
                headerName: t('inventory.remainingAmount'),
                width: 180,
                align: 'right',
                headerAlign: 'right',
                valueGetter: (_value, row) =>
                    row.remaining_amount
                        ? parseFloat(row.remaining_amount).toLocaleString('uz-UZ', {
                            minimumFractionDigits: 2,
                        })
                        : '0.00',
            },
            {
                field: 'shortage_amount',
                headerName: t('inventory.shortageAmount'),
                width: 180,
                align: 'right',
                headerAlign: 'right',
                valueGetter: (_value, row) =>
                    row.shortage_amount
                        ? parseFloat(row.shortage_amount).toLocaleString('uz-UZ', {
                            minimumFractionDigits: 2,
                        })
                        : '0.00',
            },
            {
                field: 'surplus_amount',
                headerName: t('inventory.surplusAmount'),
                width: 150,
                align: 'right',
                headerAlign: 'right',
                valueGetter: (_value, row) =>
                    row.surplus_amount
                        ? parseFloat(row.surplus_amount).toLocaleString('uz-UZ', {
                            minimumFractionDigits: 2,
                        })
                        : '0.00',
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
                    <CustomGridActionsCellItem
                        key="edit"
                        showInMenu
                        label={t('common.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        onClick={() => handleEdit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        showInMenu
                        label={t('common.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        style={{ color: theme.vars.palette.error.main }}
                        onClick={() => {
                            setDeleteId(params.row.id);
                            setDeleteConfirmOpen(true);
                        }}
                    />,
                ],
            },
        ],
        [t, handleEdit, storageNameById, theme]
    );

    return (
        <>
            <GenericTableView
                data={inventories}
                loading={loading}
                columns={columns}
                breadcrumbs={{
                    heading: t('inventory.list'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('inventory.title'), href: paths.menu.inventory.root },
                        { name: t('inventory.list') },
                    ],
                }}
                addButton={{
                    label: t('inventory.add'),
                    href: paths.menu.inventory.new,
                }}
                onDeleteRow={(id) => {
                    setDeleteId(id);
                    setDeleteConfirmOpen(true);
                }}
            />

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('common.deleteConfirmTitle')}</DialogTitle>
                <DialogContent>{t('common.deleteConfirmMessage')}</DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" onClick={() => setDeleteConfirmOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteId && handleDelete(deleteId)}
                        autoFocus
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default InventoryListView;
