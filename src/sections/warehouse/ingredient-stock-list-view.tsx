import type { GridColDef } from '@mui/x-data-grid';
import { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Box,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { toast } from 'src/components/snackbar';
import {
    useGetIngredientStocksPage,
    useUpdateIngredientStock,
    useDeleteIngredientStock,
} from 'src/actions/ingredient-stock';
import { paths } from 'src/routes/paths';

function IngredientStockListView() {
    const { t } = useTranslation('menu');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const { stocks, stocksLoading, pagination } = useGetIngredientStocksPage({
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
        expand: 'ingredient_id,storage_id,branch_id',
    });
    const { updateStock } = useUpdateIngredientStock();
    const { deleteStock } = useDeleteIngredientStock();

    const [selectedStock, setSelectedStock] = useState<any>(null);
    const [openEdit, setOpenEdit] = useState(false);
    const [editQuantity, setEditQuantity] = useState('');
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteStockId, setDeleteStockId] = useState<string | null>(null);

    const handleEditOpen = (stock: any) => {
        setSelectedStock(stock);
        setEditQuantity(stock.quantity);
        setOpenEdit(true);
    };

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

    const handleDeleteOpen = (stockId: string) => {
        setDeleteStockId(stockId);
        setOpenDelete(true);
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

    const columns: GridColDef[] = useMemo(
        () => [
            {
                field: 'ingredient_name',
                headerName: t('ingredientStock.ingredient'),
                flex: 1,
                minWidth: 150,
                renderCell: (params) => <Box sx={{ mt: 2, mb: 2 }}>{params.row.ingredient_name}</Box>,
            },
            {
                field: 'quantity',
                headerName: t('ingredientStock.quantity'),
                flex: 0.8,
                minWidth: 100,
                align: 'right',
                headerAlign: 'right',
            },
            {
                field: 'measurement',
                headerName: t('ingredientStock.measurement'),
                flex: 0.8,
                minWidth: 100,
            },
            {
                field: 'created_at',
                headerName: t('ingredientStock.created_at'),
                // flex: 1,
                minWidth: 150,
                renderCell: (params) => new Date(params.value).toLocaleDateString(),
            },
            {
                field: 'actions',
                type: 'actions',
                headerName: t('actions'),
                // flex: 0.8,
                width: 100,
                sortable: false,
                filterable: false,
                getActions: (params) => [
                    // <CustomGridActionsCellItem
                    //     key="edit"
                    //     icon={<Iconify icon="solar:pen-bold" />}
                    //     label={t('edit')}
                    //     onClick={() => handleEditOpen(params.row)}
                    //     showInMenu
                    // />,
                    <CustomGridActionsCellItem
                        key="delete"
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        label={t('delete')}
                        onClick={() => handleDeleteOpen(params.row.id)}
                        style={{ color: '#FB6633' }}
                        // showInMenu
                    />,
                ],
            },
        ],
        [t]
    );

    const enrichedStocks = useMemo(() => {
        return (Array.isArray(stocks) ? stocks : []).map((stock: any) => {
            const expandedIngredient = stock?._expand?.ingredient_id;
            const expandedStorage = stock?._expand?.storage_id;
            return {
                ...stock,
                ingredient_name: expandedIngredient?.name || stock.ingredient_name || stock.ingredient_id,
                measurement: expandedIngredient?.measurement || stock.measurement || '-',
                storage_name: expandedStorage?.name || stock.storage_name || stock.storage_id,
            };
        });
    }, [stocks]);

    return (
        <>
            <GenericTableView
                data={enrichedStocks}
                loading={stocksLoading}
                columns={columns}
                paginationMode="server"
                rowCount={pagination?.total || 0}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50, 100]}
                breadcrumbs={{
                    heading: t('ingredientStock.title'),
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: t('warehouse.ingredients'), href: paths.warehouse.ingredients.root },
                        { name: t('ingredientStock.title') },
                    ],
                }}
                onDeleteRow={(id) => deleteStock(id)}
            />

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
