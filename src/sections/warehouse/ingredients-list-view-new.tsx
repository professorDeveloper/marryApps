import type { IIngredientItem } from 'src/types/ingredients';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Box,
    Dialog,
    Button,
    DialogTitle,
    DialogActions,
    DialogContent,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { DashboardContent } from 'src/layouts/dashboard';
import { useDeleteIngredient } from 'src/actions/ingredients';

import { toast } from 'src/components/snackbar';
import { GenericViewModal } from 'src/components/generic-view-view';

import { IngredientsDataTable } from './ingredients';

export function IngredientListView() {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { openModal, closeModal, selectedData } = useGenericViewModal<IIngredientItem>();
    const { deleteIngredient } = useDeleteIngredient();
    
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<IIngredientItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);

    const handleEditIngredient = useCallback((id: string) => {
        router.push(`/warehouse/ingredients/${id}/edit`);
    }, [router]);

    const handleConfirmDelete = useCallback(async () => {
        if (ingredientToDelete) {
            try {
                await deleteIngredient(ingredientToDelete);
                toast.success(t('success.deleteSuccess'));
                // Refresh will be handled by the DataTable component
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error(t('error.deleteFailed'));
            } finally {
                setDeleteDialogOpen(false);
                setIngredientToDelete(null);
            }
        }
    }, [ingredientToDelete, deleteIngredient, t]);

    const handleViewIngredient = useCallback((ingredient: IIngredientItem) => {
        setSelectedIngredient(ingredient);
        setViewModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setViewModalOpen(false);
        setSelectedIngredient(null);
    }, []);

    const handleDeleteClick = useCallback((id: string) => {
        setIngredientToDelete(id);
        setDeleteDialogOpen(true);
    }, []);

    const handleCancelDelete = useCallback(() => {
        setDeleteDialogOpen(false);
        setIngredientToDelete(null);
    }, []);

    const renderIngredientSpecifications = useCallback((ingredient: IIngredientItem) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ingredient.picture_url && (
                <Box
                    component="img"
                    src={ingredient.picture_url}
                    alt={ingredient.name}
                    sx={{ width: '100%', borderRadius: 1, maxHeight: 300, objectFit: 'cover' }}
                />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {ingredient.measurement && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('warehouse.measurement')}:</Box>
                        <Box>{ingredient.measurement}</Box>
                    </Box>
                )}
                {ingredient.price_per_unit && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('warehouse.price')}:</Box>
                        <Box>{ingredient.price_per_unit}</Box>
                    </Box>
                )}
                {ingredient.color_code && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('warehouse.color')}:</Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.5,
                                    bgcolor: ingredient.color_code,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            />
                            <Box>{ingredient.color_code}</Box>
                        </Box>
                    </Box>
                )}
                {ingredient.group_name && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('warehouse.group')}:</Box>
                        <Box>{ingredient.group_name}</Box>
                    </Box>
                )}
                {ingredient.created_at && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ fontWeight: 500 }}>{t('warehouse.createdAt')}:</Box>
                        <Box>{new Date(ingredient.created_at).toLocaleDateString()}</Box>
                    </Box>
                )}
            </Box>
        </Box>
    ), [t]);

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
                <IngredientsDataTable
                    onView={handleViewIngredient}
                    onEdit={handleEditIngredient}
                    onDelete={handleDeleteClick}
                    showHeaderActions
                    enablePeriodPicker={false}
                    enablePeriodButtons={false}
                />
            </DashboardContent>

            <GenericViewModal
                isOpen={viewModalOpen}
                onClose={handleCloseModal}
                title={selectedIngredient?.name || t('warehouse.ingredients')}
                data={selectedIngredient}
                renderContent={selectedIngredient ? renderIngredientSpecifications : undefined}
            />

            <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
                <DialogTitle>{t('common.confirmDelete', 'Confirm Delete')}</DialogTitle>
                <DialogContent>
                    {t('common.deleteMessage', 'Are you sure you want to delete this ingredient?')}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="inherit">
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
