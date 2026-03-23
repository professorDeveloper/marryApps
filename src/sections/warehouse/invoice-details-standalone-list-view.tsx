import type { GridColDef } from '@mui/x-data-grid';
import type { InvoiceListFilters } from 'src/hooks/use-invoice-details-api';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField } from '@mui/material';
import { paths } from 'src/routes/paths';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useStorageAPI } from 'src/hooks/use-storage-api';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { GenericViewModal } from 'src/components/generic-view-view';
import { NoDataTooltip } from 'src/components/no-data-tooltip';
import { DataGrid } from '@mui/x-data-grid';
import { fetcher } from 'src/lib/axios';

interface InvoiceDetailWithInvoiceInfo {
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

const initialFilters: InvoiceListFilters = {
    date_from: getTodayUtcBoundary(),
    date_to: getTomorrowUtcBoundary(true),
    storage_id: '',
    supplier_id: '',
    ingredient_id: '',
    status: '',
    expand: 'supplier_id,storage_id',
    q: '',
    limit: 20,
    offset: 0,
};

const toUtcDayBoundary = (value: dayjs.Dayjs, endOfDay = false): string => {
    const date = new Date(
        Date.UTC(
            value.year(),
            value.month(),
            value.date(),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0
        )
    );

    return date.toISOString().replace('.000Z', 'Z');
};

const toPickerDate = (value?: string): dayjs.Dayjs | null => (value ? dayjs(value.slice(0, 10)) : null);

let staticDataCache: {
    suppliers: any[];
    storages: any[];
    ingredients: any[];
} | null = null;

let staticDataPromise: Promise<{
    suppliers: any[];
    storages: any[];
    ingredients: any[];
}> | null = null;

export function InvoiceDetailsStandaloneListView() {
    const { t } = useTranslation('menu');
    const noDataText = t('noDataAvailable', "Tushunarli ma'lumot mavjud emas");
    const theme = {
        vars: {
            palette: {
                error: {
                    main: '#f44336',
                },
            },
        },
    };
    const { deleteInvoiceDetails, getIngredients, getInvoicesPage } = useInvoiceDetailsAPI();
    const { deleteInvoices } = useInvoiceAPI();
    const { getSuppliers } = useSupplierAPI();
    const { getStorages } = useStorageAPI();
    const [rawInvoices, setRawInvoices] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [storages, setStorages] = useState<any[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);

    const isSuppliersEmpty = suppliers.length === 0;
    const isStoragesEmpty = storages.length === 0;
    const isIngredientsEmpty = ingredients.length === 0;
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceDetailWithInvoiceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const [selectedDeleteType, setSelectedDeleteType] = useState<'invoice' | 'detail' | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [filters, setFilters] = useState<InvoiceListFilters>(initialFilters);
    const [draftFilters, setDraftFilters] = useState<InvoiceListFilters>(initialFilters);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const lastInvoicesKeyRef = useRef('');

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                if (staticDataCache) {
                    setSuppliers(staticDataCache.suppliers);
                    setStorages(staticDataCache.storages);
                    setIngredients(staticDataCache.ingredients);
                    return;
                }

                if (!staticDataPromise) {
                    staticDataPromise = Promise.all([
                        getSuppliers(),
                        getStorages(),
                        getIngredients(),
                    ]).then(([suppliersData, storagesData, ingredientsData]) => ({
                        suppliers: suppliersData || [],
                        storages: storagesData || [],
                        ingredients: ingredientsData || [],
                    }));
                }

                const resolved = await staticDataPromise;
                staticDataCache = resolved;

                setSuppliers(resolved.suppliers);
                setStorages(resolved.storages);
                setIngredients(resolved.ingredients);
            } catch {
                setSuppliers([]);
                setStorages([]);
                setIngredients([]);
            }
        };

        fetchStaticData();
    }, [getSuppliers, getStorages, getIngredients]);

    useEffect(() => {
        const fetchInvoices = async () => {
            const key = JSON.stringify({
                date_from: filters.date_from,
                date_to: filters.date_to,
                storage_id: filters.storage_id,
                supplier_id: filters.supplier_id,
                ingredient_id: filters.ingredient_id,
                status: filters.status,
                q: filters.q,
                expand: filters.expand,
                limit: filters.limit,
                offset: filters.offset,
            });

            if (lastInvoicesKeyRef.current === key) return;
            lastInvoicesKeyRef.current = key;

            setLoading(true);
            try {
                const response = await getInvoicesPage(filters);
                setRowCount(response.total || 0);
                setRawInvoices(response.items || []);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [filters, getInvoicesPage]);

    useEffect(() => {
        setDraftFilters((prev) => ({
            ...prev,
            q: debouncedSearchQuery,
        }));
    }, [debouncedSearchQuery]);

    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
        setFilters((prev) => ({
            ...prev,
            ...draftFilters,
            offset: 0,
            limit: paginationModel.pageSize,
        }));
    }, [draftFilters]);

    const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
        setPaginationModel(model);
        setFilters((prev) => ({
            ...prev,
            limit: model.pageSize,
            offset: model.page * model.pageSize,
        }));
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

    const handleDeleteClick = (id: string, type: 'invoice' | 'detail') => {
        setSelectedDeleteId(id);
        setSelectedDeleteType(type);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (selectedDeleteId && selectedDeleteType) {
            if (selectedDeleteType === 'invoice') {
                await deleteInvoices([selectedDeleteId]);
                setRawInvoices((prev) => prev.filter((row) => row.id !== selectedDeleteId));
                setSelectedInvoiceDetails((prev) =>
                    prev.filter((detail) => detail.invoice_id !== selectedDeleteId)
                );
            } else if (selectedDeleteType === 'detail') {
                await deleteInvoiceDetails([selectedDeleteId]);
                setSelectedInvoiceDetails((prev) => prev.filter((row) => row.id !== selectedDeleteId));
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

    const handleViewClick = async (invoice: any) => {
        setSelectedInvoice(invoice);
        setSelectedInvoiceDetails([]);
        try {
            const response = await fetcher<any>(`/api/v1/invoice-details/invoice/${invoice.id}`);
            const details = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.data)
                    ? response.data.data
                    : Array.isArray(response)
                        ? response
                        : [];

            const enrichedDetails = details.map((detail: any) => {
                const ingredient = ingredients.find((ing: any) => ing.id === detail.ingredient_id);
                return {
                    ...detail,
                    quantity: Number(detail.quantity),
                    invoice_supplier_name: invoice?.supplier_name || 'Unknown',
                    invoice_date: invoice?.date || '',
                    ingredient_name: ingredient?.name || detail.ingredient_id,
                };
            });

            setSelectedInvoiceDetails(enrichedDetails);
        } catch {
            setSelectedInvoiceDetails([]);
        }
    };

    const handleModalClose = () => {
        setSelectedInvoice(null);
        setSelectedInvoiceDetails([]);
    };

    const invoiceColumns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'id',
                headerName: '№',
                width: 80,
                renderCell: (params) => {
                    const index = invoices.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'supplier_name',
                headerName: t('invoices.name', 'Supplier Name'),
                flex: 1,
                minWidth: 200,
            },
            {
                field: 'supplier_phone',
                headerName: t('invoices.phone', 'Phone'),
                width: 160,
            },
            {
                field: 'storage_name',
                headerName: t('invoices.storage', 'Storage'),
                flex: 1,
                minWidth: 180,
            },
            {
                field: 'total_amount',
                headerName: t('invoices.totalAmount', 'Total Amount'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.total_amount || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                field: 'status',
                headerName: t('invoices.status', 'Status'),
                width: 120,
                renderCell: (params) => {
                    const status = params.row.status?.toLowerCase();
                    let color = 'default';
                    if (status === 'pending') color = 'warning';
                    if (status === 'draft') color = 'default';
                    if (status === 'deleted') color = 'error';
                    return (
                        <span
                            style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: 700,
                                marginTop: '10px',
                                marginBottom: '10px',
                                backgroundColor:
                                    color === 'warning'
                                        ? '#FFF3CD'
                                        : color === 'success'
                                            ? '#D4EDDA'
                                            : color === 'error'
                                                ? '#F8D7DA'
                                                : '#E2E3E5',
                                color:
                                    color === 'warning'
                                        ? '#856404'
                                        : color === 'success'
                                            ? '#155724'
                                            : color === 'error'
                                                ? '#721C24'
                                                : '#383D41',
                            }}
                        >
                            {status}
                        </span>
                    );
                },
            },
            {
                field: 'date',
                headerName: t('invoices.date', 'Date'),
                width: 140,
                renderCell: (params) => new Date(params.row.date).toLocaleDateString(),
            },
            {
                type: 'actions',
                field: 'actions',
                headerName: t('actions'),
                width: 150,
                // align: 'right',
                // headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        // showInMenu
                        label={t('edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={paths.warehouse.invoices.edit(params.row.id)}
                    />,
                    <CustomGridActionsCellItem
                        // showInMenu
                        label={t('delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => handleDeleteClick(params.row.id, 'invoice')}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [t, invoices]
    );

    const detailsColumns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'id',
                headerName: '№',
                width: 80,
                renderCell: (params) => {
                    const filtered = selectedInvoiceDetails.filter(
                        (d) => d.invoice_id === selectedInvoice?.id
                    );
                    const index = filtered.findIndex((row) => row.id === params.row.id);
                    return index + 1;
                },
            },
            {
                field: 'ingredient_id',
                headerName: t('ingredient', 'Mahsulot'),
                flex: 1,
                minWidth: 200,
                renderCell: (params) => params.row.ingredient_name || params.row.ingredient_id,
            },
            {
                field: 'quantity',
                headerName: t('quantity', 'Miqdori'),
                width: 120,
                renderCell: (params) => `${params.row.quantity}`,
            },
            {
                field: 'price_per_unit',
                headerName: t('price_per_unit', 'Birlik narxi'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.price_per_unit || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            {
                field: 'price',
                headerName: t('total_price', 'Jami narx'),
                width: 150,
                renderCell: (params) => {
                    const amount = parseFloat(params.row.price || 0);
                    return `${amount.toLocaleString()} UZS`;
                },
            },
            // {
            //     type: 'actions',
            //     field: 'actions',
            //     headerName: ' ',
            //     width: 100,
            //     align: 'right',
            //     headerAlign: 'right',
            //     sortable: false,
            //     filterable: false,
            //     disableColumnMenu: true,
            //     getActions: (params) => [
            //         <CustomGridActionsCellItem
            //             showInMenu
            //             label={t('edit')}
            //             icon={<Iconify icon="solar:pen-bold" />}
            //             href={paths.warehouse.invoiceDetails.edit(params.row.id)}
            //         />,
            //         <CustomGridActionsCellItem
            //             showInMenu
            //             label={t('delete')}
            //             icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            //             onClick={() => handleDeleteClick(params.row.id, 'detail')}
            //         />,
            //     ],
            // },
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
            <GenericTableView
                data={invoices}
                loading={loading}
                columns={invoiceColumns}
                paginationMode="server"
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                pageSizeOptions={[10, 20, 50, 100]}
                renderFilters={() => (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(220px, 1fr))',
                                md: 'repeat(3, minmax(220px, 1fr))',
                                lg: 'repeat(4, minmax(220px, 1fr))',
                            },
                            gap: 2,
                            alignItems: 'end',
                            '& .MuiFormControl-root, & .MuiTextField-root': {
                                minWidth: 220,
                                width: '100%',
                            },
                        }}
                    >
                        <DatePicker
                            label={t('ingredientReports.startDate', 'Start date')}
                            value={startDateValue}
                            onChange={(value) =>
                                setDraftFilters((prev) => ({
                                    ...prev,
                                    date_from: value ? toUtcDayBoundary(value) : '',
                                }))
                            }
                            format="DD.MM.YYYY"
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    inputProps: { readOnly: true },
                                    sx: { cursor: 'pointer' },
                                },
                            }}
                        />
                        <DatePicker
                            label={t('ingredientReports.endDate', 'End date')}
                            value={endDateValue}
                            onChange={(value) =>
                                setDraftFilters((prev) => ({
                                    ...prev,
                                    date_to: value ? toUtcDayBoundary(value, true) : '',
                                }))
                            }
                            format="DD.MM.YYYY"
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    inputProps: { readOnly: true },
                                    sx: { cursor: 'pointer' },
                                },
                            }}
                        />
                        <NoDataTooltip enabled={isStoragesEmpty} title={noDataText}>
                            <TextField
                                select
                                size="small"
                                label={t('invoices.storage', 'Storage')}
                                SelectProps={{ native: true }}
                                value={draftFilters.storage_id || ''}
                                onChange={(e) =>
                                    setDraftFilters((prev) => ({
                                        ...prev,
                                        storage_id: e.target.value,
                                    }))
                                }
                                InputLabelProps={{ shrink: true }}
                                disabled={isStoragesEmpty}
                            >
                                <option value="" disabled hidden>
                                    {t('ingredientReports.all', 'All')}
                                </option>
                                {storages.map((storage) => (
                                    <option key={storage.id} value={storage.id}>
                                        {storage.name || storage.id}
                                    </option>
                                ))}
                            </TextField>
                        </NoDataTooltip>
                        <NoDataTooltip enabled={isSuppliersEmpty} title={noDataText}>
                            <TextField
                                select
                                size="small"
                                label={t('invoices.name', 'Supplier')}
                                SelectProps={{ native: true }}
                                value={draftFilters.supplier_id || ''}
                                onChange={(e) =>
                                    setDraftFilters((prev) => ({
                                        ...prev,
                                        supplier_id: e.target.value,
                                    }))
                                }
                                InputLabelProps={{ shrink: true }}
                                disabled={isSuppliersEmpty}
                            >
                                <option value="" disabled hidden>
                                    {t('ingredientReports.all', 'All')}
                                </option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name || supplier.id}
                                    </option>
                                ))}
                            </TextField>
                        </NoDataTooltip>
                        <NoDataTooltip enabled={isIngredientsEmpty} title={noDataText}>
                            <TextField
                                select
                                size="small"
                                label={t('ingredient', 'Ingredient')}
                                SelectProps={{ native: true }}
                                value={draftFilters.ingredient_id || ''}
                                onChange={(e) =>
                                    setDraftFilters((prev) => ({
                                        ...prev,
                                        ingredient_id: e.target.value,
                                    }))
                                }
                                InputLabelProps={{ shrink: true }}
                                disabled={isIngredientsEmpty}
                            >
                                <option value="" disabled hidden>
                                    {t('ingredientReports.all', 'All')}
                                </option>
                                {ingredients.map((ingredient) => (
                                    <option key={ingredient.id} value={ingredient.id}>
                                        {ingredient.name || ingredient.id}
                                    </option>
                                ))}
                            </TextField>
                        </NoDataTooltip>
                        <TextField
                            select
                            size="small"
                            label={t('invoices.status', 'Status')}
                            SelectProps={{ native: true }}
                            value={draftFilters.status || ''}
                            onChange={(e) =>
                                setDraftFilters((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="" disabled hidden>
                                {t('ingredientReports.all', 'All')}
                            </option>
                            <option value="pending">{t('warehouse.invoices.statuses.pending', 'Pending')}</option>
                            <option value="arrived">{t('warehouse.invoices.statuses.arrived', 'Arrived')}</option>
                            <option value="received">{t('warehouse.invoices.statuses.received', 'Received')}</option>
                            <option value="cancelled">{t('warehouse.invoices.statuses.cancelled', 'Cancelled')}</option>
                        </TextField>
                      
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Iconify icon="solar:restart-bold" />}
                                onClick={() => setDraftFilters(initialFilters)}
                                sx={{ flex: 1 }}
                            >
                                {t('ingredientReports.reset', 'Reset')}
                            </Button>
                        </Box>
                    </Box>
                )}
                breadcrumbs={{
                    heading: t('overview.warehouse.invoiceDetails', 'Kirimlar'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
                        { name: t('overview.warehouse.invoiceDetails', 'Kirimlar'), href: paths.warehouse.invoiceDetails.root },
                    ],
                }}
                addButton={{ label: t('add'), href: paths.warehouse.invoices.new }}
                onRowClick={(id) => {
                    const invoice = invoices.find(inv => inv.id === id);
                    if (invoice) {
                        handleViewClick(invoice);
                    }
                }}
                onQuickFilterChange={setSearchQuery}
            />

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
                // position="center"
                renderContent={(data) => (
                    <>
                        {/* <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginY: '6px' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                href={`${paths.warehouse.invoiceDetails.new}?invoice_id=${data.id}`}
                                startIcon={<Iconify icon="solar:add-circle-bold" />}
                                style={{ marginBottom: '6px' }}
                            >
                                {t('add_detail', 'Add Detail')}
                            </Button>
                        </Box> */}
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
                                    // Hide toolbar completely
                                    '& .MuiDataGrid-toolbarContainer, & .MuiDataGrid-toolbarContainer button': {
                                        display: 'none !important',
                                    },
                                    // Style column headers
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: 'background.paper',
                                    },
                                    // Hide menu icons in column headers
                                    '& .MuiDataGrid-menuIcon': {
                                        display: 'none !important',
                                    },
                                    // Remove focus outlines
                                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
                                        outline: 'none !important',
                                    },
                                    // Hide column separators
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
                    </>
                )}
            />
        </>
    );
}
