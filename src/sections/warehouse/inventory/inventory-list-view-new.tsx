import type { IInventory, IInventoryItem } from 'src/types/inventory';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Box,
    Table,
    Dialog,
    Button,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    Typography,
    DialogTitle,
    DialogActions,
    DialogContent,
    TableContainer,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useInventoryAPI } from 'src/hooks/use-inventory-api';
import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { GenericViewModal } from 'src/components/generic-view-view';

import { InventoryDataTable } from './components/InventoryDataTable';

export function InventoryListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { getInventoryItems } = useInventoryAPI();
    
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<IInventoryItem[]>([]);
    
    const { openModal, closeModal, selectedData } = useGenericViewModal<IInventory>();

    const handleEditInventory = useCallback((id: string) => {
        router.push(`/menu/inventory/${id}/edit`);
    }, [router]);

    const handleConfirmDelete = useCallback(async () => {
        if (deleteId) {
            try {
                // Delete will be handled by the DataTable component
                setDeleteDialogOpen(false);
                setDeleteId(null);
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error(t('error.deleteFailed'));
            }
        }
    }, [deleteId, t]);

    const handleViewInventory = useCallback(async (inventory: IInventory) => {
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
    }, [getInventoryItems, openModal, t]);

    const handleDeleteClick = useCallback((id: string) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    }, []);

    const handleCancelDelete = useCallback(() => {
        setDeleteDialogOpen(false);
        setDeleteId(null);
    }, []);

    const renderInventorySpecifications = useCallback((inventory: IInventory) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {inventory.number && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('inventory.number')}:</Box>
                        <Box>{inventory.number}</Box>
                    </Box>
                )}
                {inventory.date && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('inventory.date')}:</Box>
                        <Box>{new Date(inventory.date).toLocaleDateString()}</Box>
                    </Box>
                )}
                {inventory.storage_id && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('inventory.storage')}:</Box>
                        <Box>{(inventory as any)?._expand?.storage_id?.name || inventory.storage_id}</Box>
                    </Box>
                )}
                {inventory.description && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('inventory.description')}:</Box>
                        <Box>{inventory.description}</Box>
                    </Box>
                )}
                {inventory.status && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('inventory.status')}:</Box>
                        <Box>{inventory.status}</Box>
                    </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ fontWeight: 500 }}>{t('inventory.remainingAmount')}:</Box>
                    <Box>{(inventory as any)?.remaining_amount || 0}</Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ fontWeight: 500 }}>{t('inventory.shortageAmount')}:</Box>
                    <Box>{(inventory as any)?.shortage_amount || 0}</Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ fontWeight: 500 }}>{t('inventory.surplusAmount')}:</Box>
                    <Box>{(inventory as any)?.surplus_amount || 0}</Box>
                </Box>
                {inventory.date && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('inventory.createdAt')}:</Box>
                        <Box>{new Date(inventory.date).toLocaleDateString()}</Box>
                    </Box>
                )}
            </Box>
            
            {inventoryItems.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        {t('inventory.items')}
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('inventory.itemName')}</TableCell>
                                    <TableCell align="right">{t('inventory.quantity')}</TableCell>
                                    <TableCell align="right">{t('inventory.systemQuantity')}</TableCell>
                                    <TableCell align="right">{t('inventory.difference')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {inventoryItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{(item as any).name}</TableCell>
                                        <TableCell align="right">{(item as any).quantity}</TableCell>
                                        <TableCell align="right">{item.system_quantity || 0}</TableCell>
                                        <TableCell align="right">
                                            {((item as any).quantity || 0) - (item.system_quantity || 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Box>
    ), [t, inventoryItems]);

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
                <InventoryDataTable
                    onView={handleViewInventory}
                    onEdit={handleEditInventory}
                    onDelete={handleDeleteClick}
                    showHeaderActions
                    enablePeriodPicker={false}
                    enablePeriodButtons={false}
                />
            </DashboardContent>

            <GenericViewModal
                isOpen={!!selectedData}
                onClose={closeModal}
                title={String(selectedData?.number || t('inventory.inventory'))}
                data={selectedData}
                renderContent={selectedData ? () => renderInventorySpecifications(selectedData) : undefined}
            />

            <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
                <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
                <DialogContent>
                    {t('common.deleteMessage')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="inherit">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
