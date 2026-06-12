import type { GridPaginationModel } from '@mui/x-data-grid';
import type { IInventory, IInventoryItem, IBackendPagination } from 'src/types/inventory';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Chip,
    Table,
    Button,
    Dialog,
    MenuItem,
    TableRow,
    useTheme,
    TableBody,
    TableCell,
    TableHead,
    TextField,
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

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';

// Date utility functions
const toPickerDate = (dateString: string): dayjs.Dayjs | null => {
    if (!dateString) return null;
    return dayjs(dateString);
};

const getTodayUtcBoundary = (endOfDay = false): string => {
  const now = dayjs();
  const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const getTomorrowUtcBoundary = (endOfDay = false): string => {
  const now = dayjs().add(1, 'day');
  const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const getYearAgoUtcBoundary = (endOfDay = false): string => {
  const now = dayjs().subtract(365, 'day');
  const boundary = endOfDay ? now.endOf('day') : now.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

// Helper to convert a dayjs date to UTC boundary string
const toUtcDayBoundary = (date: dayjs.Dayjs, endOfDay = false): string => {
    const boundary = endOfDay ? date.endOf('day') : date.startOf('day');
    return boundary.toISOString().replace('.000Z', 'Z');
};

import { RouterLink } from 'src/routes/components';

import { usePaginationRows } from 'src/hooks/use-pagination-rows';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

const filterSelectSx = {
    minWidth: 140,
    '& .MuiInputBase-root': { height: 36, fontSize: 13.5, backgroundColor: 'var(--bg2)', borderRadius: '6px', fontFamily: 'var(--font-sans)' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border2)' },
    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--brand)', boxShadow: '0 0 0 2px var(--accent-soft)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

function RenderCellStatus({ status }: { status: string }) {
    return (
        <Chip
            size="small"
            label={formatStatusLabel(status)}
            color={getStatusColor(status)}
            sx={{ textTransform: 'capitalize' }}
        />
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
    const [dateFrom, setDateFrom] = useState(getYearAgoUtcBoundary());
    const [dateTo, setDateTo] = useState(getTodayUtcBoundary(true));
    const [itemsLoading, setItemsLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);
    const [pagination, setPagination] = useState<IBackendPagination | undefined>(undefined);
    const { rowsPerPage } = usePaginationRows();
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: rowsPerPage,
    });

    // Sync paginationModel with rowsPerPage when it changes externally
    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, pageSize: rowsPerPage }));
    }, [rowsPerPage]);
    const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year' | undefined>('year');
    const [storageOptions, setStorageOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [sort, setSort] = useState({ by: 'date', order: 'desc' as 'asc' | 'desc' });
    const [draftFilters, setDraftFilters] = useState({
        status: '',
        storage_id: '',
        date_from: getYearAgoUtcBoundary(),
        date_to: getTodayUtcBoundary(true),
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

    const loadInventories = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
        try {
            if (!silent) setLoading(true);
            const response = await getInventories({
                search: debouncedSearchQuery,
                limit: paginationModel.pageSize,
                offset: paginationModel.page * paginationModel.pageSize,
                ...(draftFilters.date_from ? { date_from: draftFilters.date_from } : {}),
                ...(draftFilters.date_to ? { date_to: draftFilters.date_to } : {}),
                ...(draftFilters.status ? { status: draftFilters.status } : {}),
                ...(draftFilters.storage_id ? { storage_id: draftFilters.storage_id } : {}),
                sort_by: sort.by,
                sort_order: sort.order,
            });
            setInventories(response.items);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error loading inventories:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [debouncedSearchQuery, getInventories, paginationModel.page, paginationModel.pageSize, draftFilters, sort]);

    useEffect(() => {
        loadInventories();
    }, [loadInventories]);

    // Update draftFilters when dateFrom or dateTo changes
    useEffect(() => {
        setDraftFilters(prev => ({
            ...prev,
            date_from: dateFrom,
            date_to: dateTo,
        }));
    }, [dateFrom, dateTo]);

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [debouncedSearchQuery, draftFilters]);

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteInventory(id);
                setDeleteConfirmOpen(false);
                setDeleteId(null);
                await loadInventories({ silent: true });
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

    const handleSortChange = useCallback(
        (sortState: { key: string | null; dir: 'asc' | 'desc' | null }) => {
            if (sortState.key && sortState.dir) {
                setSort({ by: sortState.key, order: sortState.dir });
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }
        },
        []
    );

    const columns = useMemo(
        () => [
      
            {
                key: 'storage_id',
                label: t('inventory.storage'),
                sortable: true,
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: IInventory) =>
                    row?.storage_id || '-',
                renderCell: ({ row }: { row: IInventory }) => {
                    // Try to get storage name from expanded data first, then from storageOptions
                    const expandedStorage = row._expand?.storage_id;
                    const value = expandedStorage?.name || storageOptions.find((s) => s.id === row?.storage_id)?.name || row?.storage_id || '-';
                    return (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 1.5,
                            px: 1,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            fontWeight: 400
                        }}>
                            {value}
                        </Box>
                    );
                },
            },
            {
                key: 'description',
                label: t('inventory.description'),
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: IInventory) => (row as any)?.description || '-',
                renderCell: ({ row }: { row: IInventory }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1,
                        color: 'text.primary',
                        fontSize: '0.875rem',
                        fontWeight: 400
                    }}>
                        {(row as any)?.description || '-'}
                    </Box>
                ),
            },
            {
                key: 'status',
                label: t('inventory.status'),
                sortable: true,
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
                renderCell: ({ value }: { value: unknown }) => {
                    const amountValue = formatAmount(value as number);
                    return (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            py: 1.5, 
                            px: 1,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            fontWeight: 400
                        }}>
                            {amountValue}
                        </Box>
                    );
                },
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
                renderCell: ({ value }: { value: unknown }) => {
                    const amountValue = formatAmount(value as number);
                    return (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            py: 1.5, 
                            px: 1,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            fontWeight: 400
                        }}>
                            {amountValue}
                        </Box>
                    );
                },
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
                renderCell: ({ value }: { value: unknown }) => {
                    const amountValue = formatAmount(value as number);
                    return (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            py: 1.5, 
                            px: 1,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            fontWeight: 400
                        }}>
                            {amountValue}
                        </Box>
                    );
                },
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
                renderCell: ({ row }: { row: IInventory }) => {
                    const dateValue = row?.date ? dayjs(row.date).format('DD.MM.YYYY') : '-';
                    return (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            py: 1.5, 
                            px: 1,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                            fontWeight: 400
                        }}>
                            {dateValue}
                        </Box>
                    );
                },
            },
            {
                key: 'actions',
                label: t('actions'),
                sortable: false,
                filterable: false,
                width: '0.7fr',
                align: 'center' as const,
                renderCell: ({ row }: { row: IInventory }) => (
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        alignItems: 'center', 
                        py: 1.5, 
                        px: 1
                    }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row.id);
                            }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(row.id);
                                setDeleteConfirmOpen(true);
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
                    search={{ value: searchQuery, onChange: (value) => { setSearchQuery(value); setPaginationModel((prev) => ({ ...prev, page: 0 })); } }}
                    toolbarActions={
                        <>
                            <TextField
                                select size="small" label={t('inventory.storage')}
                                value={draftFilters.storage_id}
                                onChange={(e) => setDraftFilters((p) => ({ ...p, storage_id: e.target.value }))}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {storageOptions.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('inventory.status')}
                                value={draftFilters.status}
                                onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {['active', 'draft', 'deleted'].map((v) => (
                                    <MenuItem key={v} value={v}>{v}</MenuItem>
                                ))}
                            </TextField>
                        </>
                    }
                    onSortChange={handleSortChange}
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount: pagination?.total || 0,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: (p) => setPaginationModel((prev) => ({ ...prev, page: p })),
                        onRowsPerPageChange: (size) => setPaginationModel({ page: 0, pageSize: size }),
                    }}
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
                    setDateFrom(getYearAgoUtcBoundary());
                    setDateTo(getTodayUtcBoundary(true));
                    setActivePeriod('year');
                    setDraftFilters({
                        status: '',
                        storage_id: '',
                        date_from: getYearAgoUtcBoundary(),
                        date_to: getTodayUtcBoundary(true),
                    });
                }}
                    periodFilter={{
                        startDate: toPickerDate(dateFrom)?.toDate() || null,
                        endDate: toPickerDate(dateTo)?.toDate() || null,
                        onStartDateChange: (date: Date | null) => {
                            setActivePeriod(undefined);
                            if (date) { setDateFrom(toUtcDayBoundary(dayjs(date), false)); } else { setDateFrom(''); }
                        },
                        onEndDateChange: (date: Date | null) => {
                            setActivePeriod(undefined);
                            if (date) { setDateTo(toUtcDayBoundary(dayjs(date), true)); } else { setDateTo(''); }
                        },
                        activePeriod,
                        onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => {
                            setActivePeriod(period);
                            const now = dayjs();
                            let start = '';
                            let end = '';
                            switch (period) {
                                case 'day': start = toUtcDayBoundary(now, false); end = toUtcDayBoundary(now, true); break;
                                case 'week': start = toUtcDayBoundary(now.subtract(7, 'day'), false); end = toUtcDayBoundary(now, true); break;
                                case 'month': start = toUtcDayBoundary(now.subtract(30, 'day'), false); end = toUtcDayBoundary(now, true); break;
                                case 'year': start = toUtcDayBoundary(now.subtract(365, 'day'), false); end = toUtcDayBoundary(now, true); break;
                                default: break;
                            }
                            setDateFrom(start);
                            setDateTo(end);
                        },
                    }}
                    onRowClick={handleOpenItemsModal}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
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
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('common.noData')}
                                </Typography>
                            </Box>
                        );
                    }

                    const totalSurplus = inventoryItems.reduce((sum, item) => sum + (parseFloat(String(item.surplus_amount)) || 0), 0);
                    const totalShortage = inventoryItems.reduce((sum, item) => sum + (parseFloat(String(item.shortage_amount)) || 0), 0);
                    const totalRemaining = inventoryItems.reduce((sum, item) => sum + (parseFloat(String(item.remaining_amount)) || 0), 0);

                    const headerCellSx = {
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        textTransform: 'uppercase' as const,
                        py: 1.5,
                        px: 1.5,
                        whiteSpace: 'nowrap',
                        borderBottom: `1px solid ${theme.vars.palette.divider}`,
                        bgcolor: 'action.hover',
                    };
                    const cellSx = {
                        py: 1.25,
                        px: 1.5,
                        fontSize: '0.875rem',
                        verticalAlign: 'middle',
                        borderBottom: `1px solid ${theme.vars.palette.divider}`,
                    };
                    const totalCellSx = {
                        ...cellSx,
                        fontWeight: 700,
                        borderTop: `2px solid ${theme.vars.palette.divider}`,
                        borderBottom: 'none',
                        bgcolor: 'action.hover',
                    };

                    return (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ ...headerCellSx, width: 40 }}>#</TableCell>
                                        <TableCell sx={headerCellSx}>{t('calculation.productName')}</TableCell>
                                        <TableCell sx={headerCellSx}>{t('calculation.unit')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.systemQty')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.countedQty')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.difference')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.pricePerUnit')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.surplus')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.shortage')}</TableCell>
                                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>{t('calculation.remaining')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inventoryItems.map((item, index) => {
                                        const diff = parseFloat(String(item.difference_quantity));
                                        const diffColor = diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary';
                                        return (
                                            <TableRow key={item.inventory_item_id} hover>
                                                <TableCell sx={{ ...cellSx, color: 'text.secondary' }}>{index + 1}</TableCell>
                                                <TableCell sx={{ ...cellSx, fontWeight: 500 }}>{item.ingredient_name}</TableCell>
                                                <TableCell sx={{ ...cellSx, color: 'text.secondary' }}>{item.ingredient_measurement}</TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{item.system_quantity ?? '-'}</TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{item.counted_quantity ?? '-'}</TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right', fontWeight: 600, color: diffColor }}>
                                                    {Number.isNaN(diff) ? '-' : diff > 0 ? `+${diff}` : String(diff)}
                                                </TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{formatAmount(item.price_per_unit)}</TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right', color: 'success.main', fontWeight: 600 }}>
                                                    {formatAmount(item.surplus_amount)}
                                                </TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right', color: 'error.main', fontWeight: 600 }}>
                                                    {formatAmount(item.shortage_amount)}
                                                </TableCell>
                                                <TableCell sx={{ ...cellSx, textAlign: 'right' }}>{formatAmount(item.remaining_amount)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {/* Totals row */}
                                    <TableRow>
                                        <TableCell sx={totalCellSx} colSpan={7}>{t('common.total')}</TableCell>
                                        <TableCell sx={{ ...totalCellSx, textAlign: 'right', color: 'success.main' }}>
                                            {formatAmount(totalSurplus)}
                                        </TableCell>
                                        <TableCell sx={{ ...totalCellSx, textAlign: 'right', color: 'error.main' }}>
                                            {formatAmount(totalShortage)}
                                        </TableCell>
                                        <TableCell sx={{ ...totalCellSx, textAlign: 'right' }}>
                                            {formatAmount(totalRemaining)}
                                        </TableCell>
                                    </TableRow>
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
