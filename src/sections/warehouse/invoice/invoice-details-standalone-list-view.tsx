import type { InvoiceListFilters } from 'src/hooks/use-invoice-details-api';
import type { SearchOutput } from 'src/sections/common/data-table/types/types';

import useSWR from 'swr';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Chip,
  Dialog,
  Button,
  MenuItem,
  TextField,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useMetadata } from 'src/hooks/use-metadata';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import {
  useInvoiceDetailsAPI,
  invoiceDetailsByInvoiceKey,
  fetchInvoiceDetailsByInvoiceId,
} from 'src/hooks/use-invoice-details-api';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';

import { mutate } from 'src/lib/swr';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { GenericViewModal } from 'src/components/generic-view-view';

import { DataTable, FILTER_SELECT_SX } from 'src/sections/common/data-table';
import { CELL_SX } from 'src/sections/common/data-table/utils/constants';

import { MetadataEntity } from 'src/types/metadata';


interface InvoiceDetailWithFullInfo {
  id: string;
  invoice_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  quantity: number;
  price: string;
  price_per_unit: string;
  created_at: string;
  updated_at: string;
  invoice_supplier_name?: string;
  invoice_date?: string;
}

interface InvoiceWithDetails {
    id: string;
    supplier_id: string;
    storage_id: string;
    total_amount: string;
    status: string;
    date: string;
    supplier_name: string;
    supplier_phone: string;
    storage_name: string;
}

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

const initialFilters: InvoiceListFilters = {
    date_from: getYearAgoUtcBoundary(),
    date_to: getTodayUtcBoundary(true),
    storage_id: '',
    supplier_id: '',
    ingredient_id: '',
    status: '',
    expand: 'supplier_id,storage_id',
    search: '',
    ingredient_ids: [],
    general_search: '',
    limit: 20,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc',
};

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
  const boundary = endOfDay ? value.endOf('day') : value.startOf('day');
  return boundary.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value) : null);

const filterSelectSx = {
    ...FILTER_SELECT_SX,
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--brand)' },
};

let staticDataCache: {
  suppliers: any[];
  storages: any[];
} | null = null;

let staticDataPromise: Promise<{
  suppliers: any[];
  storages: any[];
}> | null = null;

export function InvoiceDetailsStandaloneListView() {
  const { t } = useTranslation('menu');
  const noDataText = t('noDataAvailable');
  const { deleteInvoiceDetails, getInvoicesPage } = useInvoiceDetailsAPI();
  const { deleteInvoices } = useInvoiceAPI();
  const { getSuppliers } = useSupplierAPI();
  const { getStorages } = useStorageAPI();
  const { data: metadata } = useMetadata([MetadataEntity.INGREDIENTS]);
  // stable reference — a bare `?? []` would invalidate downstream memos every render
  const ingredients = useMemo(
    () => metadata[MetadataEntity.INGREDIENTS] ?? [],
    [metadata]
  );
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [storages, setStorages] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [selectedDeleteType, setSelectedDeleteType] = useState<'invoice' | 'detail' | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [filters, setFilters] = useState<InvoiceListFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<InvoiceListFilters>(initialFilters);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month' | 'year' | undefined>('year');
  const lastInvoicesKeyRef = useRef('');

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        if (staticDataCache) {
          setSuppliers(staticDataCache.suppliers);
          setStorages(staticDataCache.storages);
          return;
        }

        if (!staticDataPromise) {
          staticDataPromise = Promise.all([
            getSuppliers(),
            getStorages(),
          ]).then(([suppliersData, storagesData]) => ({
            suppliers: suppliersData || [],
            storages: storagesData || [],
          }));
        }

        const resolved = await staticDataPromise;
        staticDataCache = resolved;

        setSuppliers(resolved.suppliers);
        setStorages(resolved.storages);
      } catch {
        setSuppliers([]);
        setStorages([]);
      }
    };

    fetchStaticData();
  }, [getSuppliers, getStorages]);

  useEffect(() => {
    const fetchInvoices = async () => {
      const key = JSON.stringify({
        date_from: filters.date_from,
        date_to: filters.date_to,
        storage_id: filters.storage_id,
        supplier_id: filters.supplier_id,
        ingredient_id: filters.ingredient_id,
        status: filters.status,
        search: filters.search,
        expand: filters.expand,
        limit: filters.limit,
        offset: filters.offset,
      });

      if (lastInvoicesKeyRef.current === key) return;
      lastInvoicesKeyRef.current = key;

      try {
        const response = await getInvoicesPage(filters);
        setRowCount(response.total || 0);
        setRawInvoices(response.items || []);
      } finally {
        // Loading state handled by DataTable component
      }
    };

    fetchInvoices();
  }, [filters, getInvoicesPage]);


    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilters((prev) => ({
            ...prev,
            ...draftFilters,
            offset: 0,
            limit: paginationModel.pageSize,
        }));
    }, [draftFilters, paginationModel.pageSize]);

    const handlePaginationPageChange = (page: number) => {
        setPaginationModel((prev) => ({ ...prev, page }));
        setFilters((prev) => ({
            ...prev,
            offset: page * paginationModel.pageSize,
        }));
        lastInvoicesKeyRef.current = '';
    };

    const handlePaginationRowsPerPageChange = (pageSize: number) => {
        setPaginationModel({ page: 0, pageSize });
        setFilters((prev) => ({
            ...prev,
            limit: pageSize,
            offset: 0,
        }));
        lastInvoicesKeyRef.current = '';
    };

    const invoices = useMemo(() => {
        const supplierMap = new Map(suppliers.map((s: any) => [s.id, s]));
        const storageMap = new Map(storages.map((s: any) => [s.id, s]));

        return rawInvoices.map((invoice: any) => {
            const expandedSupplier = invoice?._expand?.supplier_id;
            const expandedStorage = invoice?._expand?.storage_id;
            const supplier = expandedSupplier || supplierMap.get(invoice.supplier_id);
            const storage = expandedStorage || storageMap.get(invoice.storage_id);

            return {
                ...invoice,
                supplier_name: supplier?.name || 'Unknown',
                supplier_phone: supplier?.phone_number || '',
                storage_name: storage?.name || 'Unknown',
            };
        });
    }, [rawInvoices, suppliers, storages]);

    const ingredientOptions = useMemo(
        () => ingredients
            .filter((ing: any) => !ing.is_deleted)
            .map((ing: any) => ({ id: ing.id, label: ing.name })),
        [ingredients]
    );

    const handleSearch = useCallback(({ optionIds = [], customQueries = [] }: SearchOutput) => {
        setDraftFilters((prev) => ({
            ...prev,
            ingredient_ids: optionIds,
            general_search: customQueries.join(' '),
            search: '',
        }));
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, []);

    const handleDeleteClick = (id: string, type: 'invoice' | 'detail') => {
        setSelectedDeleteId(id);
        setSelectedDeleteType(type);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedDeleteId && selectedDeleteType) {
            if (selectedDeleteType === 'invoice') {
                await deleteInvoices([selectedDeleteId]);
                lastInvoicesKeyRef.current = '';
                setFilters((prev) => ({ ...prev }));
                if (selectedInvoice?.id === selectedDeleteId) {
                    setSelectedInvoice(null);
                }
            } else if (selectedDeleteType === 'detail') {
                await deleteInvoiceDetails([selectedDeleteId]);
                mutate(invoiceDetailsByInvoiceKey(selectedInvoice?.id));
            }
            setDeleteDialogOpen(false);
            setSelectedDeleteId(null);
            setSelectedDeleteType(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedDeleteId(null);
        setSelectedDeleteType(null);
    };

    const handleViewClick = useCallback((invoice: InvoiceWithDetails) => {
        setSelectedInvoice(invoice);
    }, []);

    const handleModalClose = () => {
        setSelectedInvoice(null);
    };

    // Details for the opened invoice — SWR dedupes repeat opens and caches per invoice;
    // the fetcher pulls pages of 500 instead of one limit=2000 request.
    const { data: rawSelectedDetails } = useSWR(
        invoiceDetailsByInvoiceKey(selectedInvoice?.id),
        ([, invoiceId]: readonly [string, string]) => fetchInvoiceDetailsByInvoiceId(invoiceId),
        { revalidateOnFocus: false, revalidateOnReconnect: false }
    );

    const ingredientNameById = useMemo(
        () => new Map(ingredients.map((ing: any) => [ing.id, ing.name])),
        [ingredients]
    );

    const selectedInvoiceDetails = useMemo<InvoiceDetailWithFullInfo[]>(() => {
        if (!selectedInvoice || !rawSelectedDetails) return [];
        return rawSelectedDetails.map((detail: any) => ({
            ...detail,
            quantity: Number(detail.quantity),
            invoice_supplier_name: selectedInvoice?.supplier_name || 'Unknown',
            invoice_date: selectedInvoice?.date || '',
            ingredient_name: ingredientNameById.get(detail.ingredient_id) || detail.ingredient_id,
        }));
    }, [rawSelectedDetails, selectedInvoice, ingredientNameById]);

    const columns = useMemo(
        () => [
            {
                key: 'supplier',
                label: t('invoices.supplier'),
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: any) => row?.supplier_id ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.supplier_name || '-'}
                    </Box>
                ),
            },
            {
                key: 'supplier_phone',
                label: t('invoices.phone'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.supplier_phone ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.supplier_phone || '-'}
                    </Box>
                ),
            },
            {
                key: 'storage_id',
                label: t('invoices.storage'),
                sortable: true,
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.storage_id ?? '',
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={CELL_SX}>
                        {row?.storage_name || '-'}
                    </Box>
                ),
            },
            {
                key: 'total_amount',
                label: t('invoices.totalAmount'),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                mono: true,
                getValue: (row: any) => Number(row?.total_amount || 0),
                renderCell: ({ value }: { value: unknown }) => {
                    const amount = Number(value ?? 0);
                    return (
                        <Box sx={CELL_SX}>
                            {amount.toLocaleString().replace(/,/g, ' ')}
                        </Box>
                    );
                },
            },
            {
                key: 'status',
                label: t('invoices.status'),
                sortable: true,
                width: '0.8fr',
                align: 'left' as const,
                getValue: (row: any) => row?.status || '',
                renderCell: ({ value }: { value: unknown }) => {
                    const status = String(value ?? '');
                    return (
                        <Chip
                            size="small"
                            label={formatStatusLabel(status)}
                            color={getStatusColor(status)}
                            sx={{ textTransform: 'capitalize' }}
                        />
                    );
                },
            },
            {
                key: 'date',
                label: t('invoices.date'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) =>
                    row?.date ? new Date(row.date).toLocaleDateString() : '',
                renderCell: ({ row }: { row: any }) => {
                    const dateValue = row?.date ? new Date(row.date).toLocaleDateString() : '-';
                    return (
                        <Box sx={CELL_SX}>
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
                renderCell: ({ row }: { row: any }) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = paths.warehouse.invoices.edit(row.id);
                            }}
                            sx={{ color: 'text.secondary' }}
                        >
                            <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(row.id, 'invoice');
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                    </Box>
                ),
            },
        ],
        [t, handleViewClick, storages, suppliers]
    );

    const detailsColumns = useMemo(
        () => [
            {
                field: 'id' as const,
                headerName: '№',
                width: 80,
                renderCell: (params: any) => {
                    const filtered = selectedInvoiceDetails.filter(
                        (d) => d.invoice_id === selectedInvoice?.id
                    );
                    const index = filtered.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'ingredient_id' as const,
                headerName: t('ingredient'),
                flex: 1,
                minWidth: 200,
                renderCell: (params: any) => params.row.ingredient_name || params.row.ingredient_id,
            },
            {
                field: 'quantity' as const,
                headerName: t('quantity'),
                width: 120,
                renderCell: (params: any) => `${params.row.quantity}`,
            },
            {
                field: 'price_per_unit' as const,
                headerName: t('price_per_unit'),
                width: 150,
                renderCell: (params: any) => {
                    const amount = parseFloat(params.row.price_per_unit || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                field: 'price' as const,
                headerName: t('total_price'),
                width: 150,
                renderCell: (params: any) => {
                    const amount = parseFloat(params.row.price || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
        ],
        [t, selectedInvoice, selectedInvoiceDetails]
    );

    const filteredDetails = selectedInvoiceDetails.filter(
        (detail) => detail.invoice_id === selectedInvoice?.id
    );
    const startDateValue = useMemo(() => toPickerDate(draftFilters.date_from), [draftFilters.date_from]);
    const endDateValue = useMemo(() => toPickerDate(draftFilters.date_to), [draftFilters.date_to]);

    return (
        <>
            <DashboardContent
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    // maxHeight: '100%',
                    '--layout-dashboard-content-pt': { xs: '0px', md: '0px' },
                    '--layout-dashboard-content-pb': { xs: '0px', md: '0px' },
                }}
            >
            
                <DataTable<InvoiceWithDetails>
                    persistKey="warehouse-invoice-details-standalone"
                    data={invoices}
                    getRowId={(row: any) => String(row?.id)}
                    columns={columns}
                    search={{
                        mode: "advanced",
                        allowFreeText: true,
                        options: ingredientOptions,
                        onSearch: handleSearch,
                    }}
                    filterRow={
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                                gap: 1,
                                width: '100%',
                            }}
                        >
                            <TextField
                                select size="small" label={t('invoices.supplier')}
                                value={draftFilters.supplier_id}
                                onChange={(e) => { setDraftFilters((p) => ({ ...p, supplier_id: e.target.value })); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {suppliers.map((s: any) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('invoices.storage')}
                                value={draftFilters.storage_id}
                                onChange={(e) => { setDraftFilters((p) => ({ ...p, storage_id: e.target.value })); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {storages.map((s: any) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select size="small" label={t('invoices.status')}
                                value={draftFilters.status}
                                onChange={(e) => { setDraftFilters((p) => ({ ...p, status: e.target.value })); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                                sx={filterSelectSx}
                            >
                                <MenuItem value="">{t('common.all')}</MenuItem>
                                {['pending', 'received', 'cancelled'].map((v) => (
                                    <MenuItem key={v} value={v}>{v}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    }
                    pagination={{
                        page: paginationModel.page,
                        rowsPerPage: paginationModel.pageSize,
                        totalCount: rowCount,
                        rowsPerPageOptions: [10, 20, 50, 100],
                        onPageChange: handlePaginationPageChange,
                        onRowsPerPageChange: handlePaginationRowsPerPageChange,
                    }}
                    periodFilter={{
                        startDate: startDateValue ? startDateValue.toDate() : null,
                        endDate: endDateValue ? endDateValue.toDate() : null,
                        onStartDateChange: (date: Date | null) => {
                            setActivePeriod(undefined); // Reset active period when manually changing date
                            if (date) {
                                setDraftFilters(prev => ({
                                    ...prev,
                                    date_from: toUtcDayBoundary(dayjs(date), false)
                                }));
                            } else {
                                setDraftFilters(prev => ({
                                    ...prev,
                                    date_from: ''
                                }));
                            }
                        },
                        onEndDateChange: (date: Date | null) => {
                            setActivePeriod(undefined); // Reset active period when manually changing date
                            if (date) {
                                setDraftFilters(prev => ({
                                    ...prev,
                                    date_to: toUtcDayBoundary(dayjs(date), true)
                                }));
                            } else {
                                setDraftFilters(prev => ({
                                    ...prev,
                                    date_to: ''
                                }));
                            }
                        },
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
                                case 'week': {
                                    const weekStart = now.subtract(7, 'day');
                                    startDate = toUtcDayBoundary(weekStart, false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                                }
                                case 'month': {
                                    const monthStart = now.subtract(30, 'day');
                                    startDate = toUtcDayBoundary(monthStart, false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                                }
                                case 'year': {
                                    const yearStart = now.subtract(365, 'day');
                                    startDate = toUtcDayBoundary(yearStart, false);
                                    endDate = toUtcDayBoundary(now, true);
                                    break;
                                }
                                default:
                                    break;
                            }
                            
                            setDraftFilters(prev => ({
                                ...prev,
                                date_from: startDate,
                                date_to: endDate
                            }));
                        }
                    }}
                    defaultConfig={{
                        order: ['supplier', 'supplier_phone', 'storage_id', 'total_amount',  'status', 'date','actions'],
                        visibility: {
                            supplier: true,
                            supplier_phone: true,
                            storage_id: true,
                            total_amount: true,
                            status: true,
                            date: true,
                            actions: true,
                        },
                        widths: {
                            supplier: '1.5fr',
                            supplier_phone: '1fr',
                            storage_id: '1.2fr',
                            total_amount: '1fr',
                            status: '0.8fr',
                            date: '1fr',
                            actions: '0.7fr',
                        },
                    }}
                    onReset={() => {
                        setDraftFilters(initialFilters);
                        setActivePeriod('year');
                    }}
                    onRowClick={handleViewClick}
                    headerActions={
                        <Button
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            component={RouterLink}
                            href={paths.warehouse.invoices.new}
                            size="small"
                        >
                            {t('add')}
                        </Button>
                    }
                />
            </DashboardContent>

            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>{t('warehouse.invoiceDetails.deleteConfirmation.title')}</DialogTitle>
                <DialogContent>
                    <p>{t('warehouse.invoiceDetails.deleteConfirmation.message')}</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} variant="outlined">
                        {t('warehouse.invoiceDetails.deleteConfirmation.cancel')}
                    </Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        {t('warehouse.invoiceDetails.deleteConfirmation.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <GenericViewModal
                isOpen={!!selectedInvoice}
                onClose={handleModalClose}
                title={`Invoice Details for ${selectedInvoice?.supplier_name}`}
                data={selectedInvoice}
                maxWidth="sm"
                slideDirection="left"
                position="right"
                renderContent={(data) => (
                    <Box sx={{ width: '100%' }}>
                        <DataGrid
                            rows={filteredDetails}
                            columns={detailsColumns}
                            autoHeight
                            disableRowSelectionOnClick
                            disableColumnFilter
                            disableColumnMenu
                            disableColumnSelector
                            disableDensitySelector
                            hideFooterSelectedRowCount
                            pagination
                            pageSizeOptions={[10, 25, 50, 100]}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 100 },
                                },
                            }}
                            sx={{
                                '& .MuiDataGrid-toolbarContainer, & .MuiDataGrid-toolbarContainer button': {
                                    display: 'none !important',
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: 'background.paper',
                                },
                                '& .MuiDataGrid-menuIcon': {
                                    display: 'none !important',
                                },
                                '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
                                    outline: 'none !important',
                                },
                                '& .MuiDataGrid-columnSeparator': {
                                    display: 'none',
                                },
                            }}
                            slots={{
                                toolbar: () => null,
                                columnMenu: () => null,
                            }}
                        />
                    </Box>
                )}
            />
        </>
    );
}
