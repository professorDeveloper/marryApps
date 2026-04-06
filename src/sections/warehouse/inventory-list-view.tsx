import type { GridPaginationModel } from '@mui/x-data-grid';
import type { IInventory, IInventoryItem, IBackendPagination } from 'src/types/inventory';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Table,
    Button,
    Dialog,
    useTheme,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    IconButton,
    Typography,
    DialogTitle,
    DialogActions,
    DialogContent,
    TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useInventoryAPI } from 'src/hooks/use-inventory-api';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

// Date utility functions
const toPickerDate = (dateString: string): dayjs.Dayjs | null => {
    if (!dateString) return null;
    return dayjs(dateString);
};

const getTodayUtcBoundary = (endOfDay = false): string => {
    const now = dayjs();
    const date = new Date(
        Date.UTC(
            now.year(),
            now.month(),
            now.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0
        )
    );
    return date.toISOString().replace('.000Z', 'Z');
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
    const now = dayjs().add(1, 'day');
    const date = new Date(
        Date.UTC(
            now.year(),
            now.month(),
            now.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0
        )
    );
    return date.toISOString().replace('.000Z', 'Z');
};

// Helper to convert a dayjs date to UTC boundary string
const toUtcDayBoundary = (date: dayjs.Dayjs, endOfDay = false): string => {
    const d = new Date(
        Date.UTC(
            date.year(),
            date.month(),
            date.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0,
            0
        )
    );
    return d.toISOString().replace('.000Z', 'Z');
};

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

function RenderCellStatus({ status }: { status: string }) {
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

export function InventoryListView() {
    const { t } = useTranslation('menu');
    const theme = useTheme();
    const router = useRouter();
    const { getInventories, deleteInventory, getInventoryItems } = useInventoryAPI();
    const { getStorages } = useStorageAPI();

    const [inventories, setInventories] = useState<IInventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState(getTodayUtcBoundary());
    const [dateTo, setDateTo] = useState(getTomorrowUtcBoundary(true));
    const [itemsLoading, setItemsLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);
    const [pagination, setPagination] = useState<IBackendPagination | undefined>(undefined);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 20,
    });
    const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year' | undefined>('day');
    const [storageOptions, setStorageOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [draftFilters, setDraftFilters] = useState({
    status: '',
    storage_id: '',
    date_from: getTodayUtcBoundary(),
    date_to: getTomorrowUtcBoundary(true),
  });

    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IInventory>();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Fetch storages on mount
    useEffect(() => {
        getStorages().then((storages) => {
            setStorageOptions(storages);
        });
    }, [getStorages]);

    const loadInventories = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getInventories({
                search: debouncedSearchQuery,
                limit: paginationModel.pageSize,
                offset: paginationModel.page * paginationModel.pageSize,
                ...(draftFilters.date_from ? { date_from: draftFilters.date_from } : {}),
                ...(draftFilters.date_to ? { date_to: draftFilters.date_to } : {}),
                ...(draftFilters.status ? { status: draftFilters.status } : {}),
                ...(draftFilters.storage_id ? { storage_id: draftFilters.storage_id } : {}),
            });
            setInventories(response.items);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error loading inventories:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchQuery, getInventories, paginationModel.page, paginationModel.pageSize, draftFilters]);

    useEffect(() => {
        loadInventories();
    }, [loadInventories]);

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [debouncedSearchQuery, draftFilters]);

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteInventory(id);
                await loadInventories();
                setDeleteConfirmOpen(false);
                setDeleteId(null);
            } catch (error) {
                console.error('Error deleting inventory:', error);
            }
        },
        [deleteInventory, loadInventories]
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

    const columns = useMemo(
        () => [
      
            {
                key: 'storage_id',
                label: t('inventory.storage'),
                sortable: true,
                filter: {
                    type: 'multi' as const,
                    maxSelections: 1,
                    options: storageOptions.map(s => s.id),
                    getOptionLabel: (id: string) => {
                        const storage = storageOptions.find(s => s.id === id);
                        return storage?.name || id;
                    },
                },
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: IInventory) =>
                    row?.storage_id || '-',
                renderCell: ({ row }: { row: IInventory }) => {
                    const id = row?.storage_id;
                    const storage = storageOptions.find((s) => s.id === id);
                    return storage?.name || id || '-';
                },
            },
            {
                key: 'description',
                label: t('inventory.description'),
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: IInventory) => (row as any)?.description || '-',
            },
            {
                key: 'status',
                label: t('inventory.status'),
                sortable: true,
                filter: { type: 'multi' as const, maxSelections: 1, options: ['active', 'draft', 'deleted'] },
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: IInventory) => row?.status || 'draft',
                renderCell: ({ value }: { value: unknown }) => (
                    <RenderCellStatus status={String(value ?? 'draft')} />
                ),
            },
            {
                key: 'remaining_amount',
                label: t('inventory.remainingAmount'),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                mono: true,
                getValue: (row: IInventory) => Number((row as any)?.remaining_amount ?? 0),
                renderCell: ({ value }: { value: unknown }) =>
                    formatAmount(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'shortage_amount',
                label: t('inventory.shortageAmount'),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                mono: true,
                getValue: (row: IInventory) => Number((row as any)?.shortage_amount ?? 0),
                renderCell: ({ value }: { value: unknown }) =>
                    formatAmount(value as number),
                total: { aggregation: 'sum' as const },
            },
            {
                key: 'surplus_amount',
                label: t('inventory.surplusAmount'),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                mono: true,
                getValue: (row: IInventory) => Number((row as any)?.surplus_amount ?? 0),
                renderCell: ({ value }: { value: unknown }) =>
                    formatAmount(value as number),
                total: { aggregation: 'sum' as const },
            },
                  {
                key: 'date',
                label: t('inventory.date'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: IInventory) =>
                    row?.date ? dayjs(row.date).format('DD.MM.YYYY') : '-',
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: IInventory }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={() => handleOpenItemsModal(row)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:eye-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(row.id)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                setDeleteId(row.id);
                                setDeleteConfirmOpen(true);
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, handleEdit, handleOpenItemsModal, storageOptions]
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
                    persistKey="warehouse-inventory"
                    data={inventories}
                    getRowId={(row: IInventory) => String(row?.id)}
                    columns={columns}
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    }}
                    filters={Object.keys(draftFilters).reduce((acc, key) => {
                        const value = (draftFilters as any)[key];
                        if (key === 'status' && value) {
                            acc.status = { type: 'multi', value: [value] };
                        } else if (key === 'storage_id' && value) {
                            acc.storage_id = { type: 'multi', value: [value] };
                        }
                        return acc;
                    }, {} as Record<string, { type: 'text' | 'multi'; value: string | string[] }>)}
                    onFiltersChange={(filterState: any) => {
                        // Convert DataTable filter format to API filter format
                        setDraftFilters(prev => {
                            const newStatus = Array.isArray(filterState.status?.value) ? filterState.status.value[0] : (filterState.status?.value || '');
                            const newStorageId = Array.isArray(filterState.storage_id?.value) ? filterState.storage_id.value[0] : (filterState.storage_id?.value || '');
                            
                            // If clicking the same value again, clear the filter
                            return {
                                ...prev,
                                status: newStatus === prev.status ? '' : newStatus,
                                storage_id: newStorageId === prev.storage_id ? '' : newStorageId,
                            };
                        });
                    }}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={pagination?.total || 0}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(p) => setPaginationModel((prev) => ({ ...prev, page: p }))}
                    onRowsPerPageChange={(size) => setPaginationModel({ page: 0, pageSize: size })}
                    defaultConfig={{
                        order: [ 'storage_id', 'description', 'status', 'remaining_amount', 'shortage_amount', 'surplus_amount','date', 'actions'],
                        visibility: {
                            number: true,
                            date: true,
                            storage_id: true,
                            description: true,
                            status: true,
                            remaining_amount: true,
                            shortage_amount: true,
                            surplus_amount: true,
                            actions: true,
                        },
                        widths: {
                            number: '0.8fr',
                            date: '1fr',
                            storage_id: '1.2fr',
                            description: '1.5fr',
                            status: '0.8fr',
                            remaining_amount: '1fr',
                            shortage_amount: '1fr',
                            surplus_amount: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={() => {
                    setSearchQuery('');
                    setDateFrom(getTodayUtcBoundary());
                    setDateTo(getTomorrowUtcBoundary(true));
                    setActivePeriod('day');
                    setDraftFilters({ 
                        status: '', 
                        storage_id: '',
                        date_from: getTodayUtcBoundary(),
                        date_to: getTomorrowUtcBoundary(true),
                    });
                }}
                    showPeriodPicker
                    periodPickerProps={{
                        startDate: toPickerDate(dateFrom)?.toDate() || null,
                        endDate: toPickerDate(dateTo)?.toDate() || null,
                        onStartDateChange: (date: Date | null) => {
                            setActivePeriod(undefined);
                            if (date) {
                                const pickedDate = dayjs(date);
                                setDateFrom(toUtcDayBoundary(pickedDate, false));
                            } else {
                                setDateFrom('');
                            }
                        },
                        onEndDateChange: (date: Date | null) => {
                            setActivePeriod(undefined);
                            if (date) {
                                const pickedDate = dayjs(date);
                                setDateTo(toUtcDayBoundary(pickedDate, true));
                            } else {
                                setDateTo('');
                            }
                        }
                    }}
                    showPeriodButtons
                    periodButtonProps={{
                        activePeriod,
                        onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
                            setActivePeriod(period);
                            const now = dayjs();
                            let startDate = '';
                            let endDate = '';

                            switch (period) {
                                case 'day':
                                    startDate = toUtcDayBoundary(now, false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                                case 'week':
                                    startDate = toUtcDayBoundary(now.subtract(7, 'day'), false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                                case 'month':
                                    startDate = toUtcDayBoundary(now.subtract(30, 'day'), false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                                case 'year':
                                    startDate = toUtcDayBoundary(now.subtract(365, 'day'), false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                            }

                            setDateFrom(startDate);
                            setDateTo(endDate);
                        }
                    }}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            href={paths.menu.inventory.new}
                            size="small"
                        >
                            {t('inventory.add')}
                        </Button>
                    }
                />
            </DashboardContent>

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
