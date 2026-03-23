import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal } from 'src/components/generic-view-view';
import { toast } from 'src/components/snackbar';
import { useInventoryAPI } from 'src/hooks/use-inventory-api';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';
import { useGetStorages } from 'src/actions/departments';
import dayjs from 'dayjs';
import type { IInventory, IInventoryItem } from 'src/types/inventory';

// ============================================================================
// RENDER CELLS
// ============================================================================

function RenderCellStatus({ params }: { params: any }) {
    const { row } = params;
    const status = row.status || 'draft';

    const statusConfig: Record<string, { label: string; color: string }> = {
        active: { label: 'Active', color: '#22c55e' },
        draft: { label: 'Draft', color: '#f59e0b' },
        deleted: { label: 'Deleted', color: '#ef4444' },
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

const formatAmount = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InventoryListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();
    const { getInventories, deleteInventory, getInventoryItems } = useInventoryAPI();
    const { storages } = useGetStorages();

    const [inventories, setInventories] = useState<IInventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [itemsLoading, setItemsLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);

    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IInventory>();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Create storage name map
    const storageNameById = useMemo(
        () => new Map(Array.isArray(storages) ? storages.map((s: any) => [s.id, s.name]) : []),
        [storages]
    );

    const loadInventories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getInventories(debouncedSearchQuery);
            setInventories(data);
        } catch (error) {
            console.error('Error loading inventories:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchQuery, getInventories]);

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

    const handleOpenItemsModal = useCallback(
        async (inventory: IInventory) => {
            openModal(inventory);
            setItemsLoading(true);
            try {
                const items = await getInventoryItems(inventory.id);
                setInventoryItems(items);
            } catch (error) {
                console.error('Error loading inventory items:', error);
                toast.error(t('error.loadFailed'));
            } finally {
                setItemsLoading(false);
            }
        },
        [getInventoryItems, openModal, t]
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
                width: 200,
                flex: 0.5,
                valueGetter: (_value, row) =>
                    row.storage_id ? storageNameById.get(row.storage_id) || row.storage_id : '-',
            },
            {
                field: 'description',
                headerName: t('inventory.description'),
                flex: 1,
                minWidth: 200,
                valueGetter: (_value, row) => row.description || '-',
            },
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
                headerName: t('actions'),
                width: 130,
                // align: 'right',
                // headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        key="edit"
                        // showInMenu
                        label={t('common.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        onClick={() => handleEdit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        // showInMenu
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
                onRowClick={(id) => {
                    const inventory = inventories.find((inv) => inv.id === id);
                    if (inventory) {
                        handleOpenItemsModal(inventory);
                    }
                }}
                onQuickFilterChange={setSearchQuery}
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

            <GenericViewModal
                isOpen={isOpen}
                onClose={() => {
                    closeModal();
                    setInventoryItems([]);
                }}
                title={
                    selectedData
                        ? `${t('inventory.items')} #${selectedData.number || ''}`
                        : t('inventory.items')
                }
                data={selectedData}
                loading={itemsLoading}
                position="right"
                slideDirection="left"
                maxWidth="lg"
                renderContent={() => {
                    if (inventoryItems.length === 0) {
                        return (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('common.noData')}
                                </Typography>
                            </Box>
                        );
                    }

                    return (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>{t('calculation.productName', 'Product')}</TableCell>
                                        <TableCell>{t('calculation.unit', 'Unit')}</TableCell>
                                        <TableCell align="right">{t('calculation.systemQty', 'System Qty')}</TableCell>
                                        <TableCell align="right">{t('calculation.countedQty', 'Counted Qty')}</TableCell>
                                        <TableCell align="right">{t('calculation.difference', 'Difference')}</TableCell>
                                        <TableCell align="right">{t('calculation.pricePerUnit', 'Price/Unit')}</TableCell>
                                        <TableCell align="right">{t('calculation.surplus', 'Surplus')}</TableCell>
                                        <TableCell align="right">{t('calculation.shortage', 'Shortage')}</TableCell>
                                        <TableCell align="right">{t('calculation.remaining', 'Remaining')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inventoryItems.map((item, index) => (
                                        <TableRow key={item.inventory_item_id || `${item.ingredient_id}-${index}`}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.ingredient_name || '-'}</TableCell>
                                            <TableCell>{item.ingredient_measurement || '-'}</TableCell>
                                            <TableCell align="right">{item.system_quantity ?? '-'}</TableCell>
                                            <TableCell align="right">{item.counted_quantity ?? '-'}</TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color:
                                                            item.difference_quantity > 0
                                                                ? 'success.main'
                                                                : item.difference_quantity < 0
                                                                    ? 'error.main'
                                                                    : 'text.secondary',
                                                    }}
                                                >
                                                    {item.difference_quantity ?? '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatAmount(item.price_per_unit)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                {formatAmount(item.surplus_amount)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                                                {formatAmount(item.shortage_amount)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatAmount(item.remaining_amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    );
                }}
            />
        </>
    );
}

export default InventoryListView;
