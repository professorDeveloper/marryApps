import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';

import {
    Dialog,
    Button,
    TextField,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import {
    useUpdateIngredientStock,
    useDeleteIngredientStock,
    useGetIngredientStocksPage,
} from 'src/actions/ingredient-stock';

import { DeductionUtilityDataTable } from 'src/sections/warehouse/deduction';

function IngredientStockListView() {
    const { t } = useTranslation('menu');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [storageFilter, setStorageFilter] = useState('');

    // Debounce search query
    useEffect(() => {
        const timeout = setTimeout(() => {
            console.log('Setting debounced search query:', searchQuery);
            setDebouncedSearchQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Reset page when search changes
    useEffect(() => {
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, [debouncedSearchQuery]);

    const { stocks, stocksLoading, pagination } = useGetIngredientStocksPage({
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
        search: debouncedSearchQuery,
        expand: 'ingredient_id,storage_id,branch_id',
    });
    
    // Debug logging
    useEffect(() => {
        console.log('API call params:', {
            limit: paginationModel.pageSize,
            offset: paginationModel.page * paginationModel.pageSize,
            search: debouncedSearchQuery,
            expand: 'ingredient_id,storage_id,branch_id',
        });
    }, [paginationModel.pageSize, paginationModel.page, debouncedSearchQuery]);
    
    // Debug search state changes
    useEffect(() => {
        console.log('Search state changed:', { searchQuery, debouncedSearchQuery });
    }, [searchQuery, debouncedSearchQuery]);
    const handleSearchChange = (value: string) => {
        console.log('Search input changed:', value);
        setSearchQuery(value);
    };
    const { updateStock } = useUpdateIngredientStock();
    const { deleteStock } = useDeleteIngredientStock();

    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [openEdit, setOpenEdit] = useState(false);
    const [editQuantity, setEditQuantity] = useState('');
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteStockId, setDeleteStockId] = useState<string | null>(null);

    const handleEditClose = () => {
        setOpenEdit(false);
        setSelectedStock(null);
        setEditQuantity('');
    };

    const handleEditSave = async () => {
        if (!selectedStock) return;

        try {
            await updateStock(selectedStock.id, { quantity: editQuantity });
            handleEditClose();
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };

    const handleDeleteClose = () => {
        setOpenDelete(false);
        setDeleteStockId(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteStockId) return;

        try {
            await deleteStock(deleteStockId);
            handleDeleteClose();
        } catch (error) {
            console.error('Error deleting stock:', error);
        }
    };

    const handleFiltersChange = (filterState: Record<string, { type: 'text' | 'multi'; value: string | string[] }>) => {
        const v = filterState.storage_name?.value;
        const storageValue = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
        setStorageFilter(storageValue);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    // The stocks are now enriched by the hook with ingredient and storage names
    const enrichedStocks = useMemo(() => Array.isArray(stocks) ? stocks : [], [stocks]);

    // TODO: Once the backend supports storage_id param in the ingredient-stocks endpoint,
    // move this filtering to the server-side by adding storage_id to the API query params
    const filteredStocks = useMemo(() => {
        if (!storageFilter) return enrichedStocks;
        return enrichedStocks.filter((stock: any) => stock.storage_id === storageFilter);
    }, [enrichedStocks, storageFilter]);

    // Build unique storage options from enriched stocks
    const storageOptions = useMemo(() => {
        const options = new Set<string>();
        enrichedStocks.forEach((stock: any) => {
            if (stock.storage_id) options.add(stock.storage_id);
        });
        return Array.from(options);
    }, [enrichedStocks]);

    const storageMap = useMemo(() => {
        const map: Record<string, string> = {};
        enrichedStocks.forEach((stock: any) => {
            if (stock.storage_id && stock.storage_name) {
                map[stock.storage_id] = stock.storage_name;
            }
        });
        return map;
    }, [enrichedStocks]);

    const filtersValue = useMemo(() => {
        const result: Record<string, { type: 'multi'; value: string[] }> = {};
        if (storageFilter) result.storage_name = { type: 'multi', value: [storageFilter] };
        return result;
    }, [storageFilter]);

    const columns = useMemo(
        () => [
            {
                key: 'ingredient_name',
                label: t('ingredientStock.ingredient'),
                sortable: true,
                width: '1.5fr',
                align: 'left' as const,
                getValue: (row: any) => row?.ingredient_name ?? '',
            },
            {
                key: 'quantity',
                label: t('ingredientStock.quantity'),
                sortable: true,
                width: '1fr',
                align: 'right' as const,
                mono: true,
                getValue: (row: any) => row?.quantity ?? '',
            },
            {
                key: 'measurement',
                label: t('ingredientStock.measurement'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.measurement ?? '-',
            },
            {
                key: 'price_per_unit',
                label: t('ingredientStock.pricePerUnit', 'Price per unit'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) => row?.price_per_unit ?? '-',
            },
            {
                key: 'storage_name',
                label: t('ingredientStock.storage', 'Storage'),
                sortable: true,
                filter: {
                    type: 'multi' as const,
                    options: storageOptions,
                    getOptionLabel: (id: string) => storageMap[id] || id,
                },
                width: '1.2fr',
                align: 'left' as const,
                getValue: (row: any) => row?.storage_name ?? '',
            },
            {
                key: 'created_at',
                label: t('ingredientStock.created_at'),
                sortable: true,
                width: '1fr',
                align: 'left' as const,
                getValue: (row: any) =>
                    row?.created_at ? new Date(row.created_at).toLocaleDateString() : '',
            },
        ],
        [t, storageOptions, storageMap]
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
                    persistKey="warehouse-ingredient-stocks"
                    data={filteredStocks}
                    getRowId={(row: any) => String(row?.id)}
                    columns={columns}
                    filters={filtersValue}
                    onFiltersChange={handleFiltersChange}
                    page={paginationModel.page}
                    rowsPerPage={paginationModel.pageSize}
                    totalCount={pagination?.total || 0}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    onPageChange={(p) => setPaginationModel((prev) => ({ ...prev, page: p }))}
                    onRowsPerPageChange={(size) => setPaginationModel({ page: 0, pageSize: size })}
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onReset={() => {
                        setSearchQuery('');
                        setStorageFilter('');
                        setPaginationModel({ page: 0, pageSize: 20 });
                    }}
                    defaultConfig={{
                        order: ['ingredient_name', 'quantity', 'measurement', 'price_per_unit', 'storage_name', 'created_at'],
                        visibility: {
                            ingredient_name: true,
                            quantity: true,
                            measurement: true,
                            price_per_unit: true,
                            storage_name: true,
                            created_at: true,
                        },
                        widths: {
                            ingredient_name: '1.5fr',
                            quantity: '1fr',
                            measurement: '1fr',
                            price_per_unit: '1fr',
                            storage_name: '1.2fr',
                            created_at: '1fr',
                        },
                    }}
                />
            </DashboardContent>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>{t('ingredientStock.edit')}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        fullWidth
                        label={t('ingredientStock.ingredient')}
                        value={selectedStock?.ingredient_name || ''}
                        disabled
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label={t('ingredientStock.quantity')}
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label={t('ingredientStock.measurement')}
                        value={selectedStock?.measurement || ''}
                        disabled
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose}>{t('cancel')}</Button>
                    <Button onClick={handleEditSave} variant="contained">
                        {t('save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDelete} onClose={handleDeleteClose}>
                <DialogTitle>{t('delete')}</DialogTitle>
                <DialogContent>
                    {t('ingredientStock.deleteFailed')} - {t('deleteConfirm')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose}>{t('cancel')}</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        {t('delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default IngredientStockListView;
