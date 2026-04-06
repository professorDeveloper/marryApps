import type {
    SelectOption,
    SeparationActFormData,
} from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Stack,
    Table,
    Button,
    Dialog,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    Typography,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useSeparationActsAPI } from 'src/hooks/use-separation-acts-api';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useIngredients } from 'src/sections/warehouse/invoice/hooks/useIngredients';

import { SeparationActsMetaFields } from './SeparationActsMetaFields';
import { SeparationActsLineItems, type SeparationActsLineItemsApi } from './SeparationActsLineItems';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SeparationActsFormViewProps {
    isNew?: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SeparationActsFormView = React.memo(function SeparationActsFormView({
    isNew = false,
}: SeparationActsFormViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // ── API hooks ─────────────────────────────────────────────────────────
    const { getDeductionGroups } = useDeductionsAPI();
    const { getStorages } = useStorageAPI();
    const {
        getSeparationActById,
        createSeparationActBatch,
        confirmSeparationAct,
        cancelSeparationAct,
        deleteSeparationAct,
        deleteSeparationActItem,
    } = useSeparationActsAPI();

    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();

    // ── State ─────────────────────────────────────────────────────────────
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);

    const [storages, setStorages] = useState<SelectOption[]>([]);
    const [groups, setGroups] = useState<SelectOption[]>([]);

    const [batchResponse, setBatchResponse] = useState<any>(null);
    const [hasLineItems, setHasLineItems] = useState(false);
    const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | 'delete' | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [deleteItemDialog, setDeleteItemDialog] = useState<{ itemId: string; itemName: string } | null>(null);

    const [formData, setFormData] = useState<SeparationActFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        storage_id: '',
        group_id: '',
        source_ingredient_id: '',
        source_quantity: '',
        description: '',
    });

    const lineItemsApiRef = useRef<SeparationActsLineItemsApi | null>(null);
    const listsFetchedRef = useRef(false);

    // ── Effective separation act ID ────────────────────────────────────────
    const effectiveActId = id || batchResponse?.data?.act?.id;

    // ── Load base data (storages, groups, ingredients) ──────────────────────
    useEffect(() => {
        if (listsFetchedRef.current) return;
        listsFetchedRef.current = true;

        Promise.all([getDeductionGroups(), getStorages()])
            .then(([groupsData, storagesData]) => {
                setGroups(Array.isArray(groupsData) ? groupsData : []);
                setStorages(Array.isArray(storagesData) ? storagesData : []);
            })
            .catch(console.error);
    }, [getDeductionGroups, getStorages]);

    // ── Load existing separation act (edit mode) ──────────────────────────
    useEffect(() => {
        if (isNew) {
            setPageLoading(false);
            return;
        }
        if (!id) {
            setPageLoading(false);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setPageLoading(true);
            try {
                const data = await getSeparationActById(id);
                if (cancelled) return;
                if (!data) {
                    toast.error(t('error.notFound'));
                    navigate(paths.warehouse.separationActs.root);
                    return;
                }
                setBatchResponse(data);
                setFormData({
                    date: dayjs(data.data.act.date).format('YYYY-MM-DD'),
                    storage_id: data.data.act.storage_id,
                    group_id: data.data.act.group_id,
                    source_ingredient_id: data.data.act.source_ingredient_id || '',
                    source_quantity: data.data.act.source_quantity || '',
                    description: data.data.act.description || '',
                });
                if (data.data.items) {
                    lineItemsApiRef.current?.restoreFromPersisted(data.data.items);
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) toast.error(t('error.loadFailed'));
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [isNew, id, getSeparationActById, navigate, t]);

    // ── Form field handlers ───────────────────────────────────────────────
    const handleDateChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, date: value })),
        []
    );
    const handleStorageChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, storage_id: value })),
        []
    );
    const handleGroupChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, group_id: value })),
        []
    );
    const handleSourceIngredientChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, source_ingredient_id: value })),
        []
    );
    const handleSourceQuantityChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, source_quantity: value })),
        []
    );
    const handleDescriptionChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, description: value })),
        []
    );
    const handleHasItemsChange = useCallback((next: boolean) => {
        setHasLineItems(next);
    }, []);

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        const api = lineItemsApiRef.current;
        const batchData = api?.getBatchData() ?? [];

        if (batchData.length === 0) {
            toast.error(t('deductions.itemsRequired', 'Please add at least one item'));
            return;
        }
        if (!formData.storage_id) {
            toast.error(t('deductions.storageRequired', 'Please select storage'));
            return;
        }
        if (!formData.group_id) {
            toast.error(t('deductions.groupRequired', 'Please select group'));
            return;
        }
        if (!formData.source_ingredient_id) {
            toast.error(t('separationActs.sourceIngredientRequired', 'Please select source ingredient'));
            return;
        }
        if (!formData.source_quantity || Number(formData.source_quantity) <= 0) {
            toast.error(t('separationActs.sourceQuantityRequired', 'Source quantity must be greater than zero'));
            return;
        }

        // Build price map from ingredients
        const ingredientPrices = new Map<string, string>();
        ingredients.forEach((ing) => {
            ingredientPrices.set(ing.id, ing.price_per_unit || '0');
        });

        // Transform batch data to include price and storage_id
        const transformedItems = batchData.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            price: ingredientPrices.get(item.ingredient_id) || '0',
            storage_id: formData.storage_id,
        }));

        const payload = {
            date: formData.date,
            storage_id: formData.storage_id,
            group_id: formData.group_id,
            source_ingredient_id: formData.source_ingredient_id,
            source_quantity: formData.source_quantity,
            description: formData.description,
            items: transformedItems,
        };

        try {
            setSubmitting(true);

            if (isNew && !effectiveActId) {
                const result = await createSeparationActBatch(payload);
                if (result) {
                    setBatchResponse(result);
                    toast.success(t('separationActs.created', 'Separation act created successfully'));
                }
            } else if (effectiveActId) {
                const result = await getSeparationActById(effectiveActId);
                if (result) {
                    setBatchResponse(result);
                    toast.success(t('separationActs.updated', 'Separation act updated successfully'));
                }
            }
        } catch (error) {
            console.error('Error saving separation act:', error);
        } finally {
            setSubmitting(false);
        }
    }, [formData, isNew, effectiveActId, ingredients, createSeparationActBatch, getSeparationActById, t]);

    // ── Cancel ────────────────────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        navigate(paths.warehouse.separationActs.root);
    }, [navigate]);

    // ── Confirm Separation Act ────────────────────────────────────────────
    const handleConfirm = useCallback(async () => {
        if (!effectiveActId) return;
        try {
            setActionLoading('confirm');
            await confirmSeparationAct(effectiveActId, {
                source_ingredient_id: formData.source_ingredient_id,
                source_quantity: formData.source_quantity,
                storage_id: formData.storage_id,
            });
            toast.success(t('separationActs.confirmed', 'Separation act confirmed successfully'));
            navigate(paths.warehouse.separationActs.root);
        } catch (error) {
            console.error('Error confirming separation act:', error);
            toast.error(t('error.failed', 'Failed to confirm'));
        } finally {
            setActionLoading(null);
        }
    }, [effectiveActId, formData, confirmSeparationAct, navigate, t]);

    // ── Cancel Separation Act ─────────────────────────────────────────────
    const handleCancelAct = useCallback(async () => {
        if (!effectiveActId) return;
        try {
            setActionLoading('cancel');
            await cancelSeparationAct(effectiveActId);
            toast.success(t('separationActs.cancelled', 'Separation act cancelled successfully'));
            navigate(paths.warehouse.separationActs.root);
        } catch (error) {
            console.error('Error cancelling separation act:', error);
            toast.error(t('error.failed', 'Failed to cancel'));
        } finally {
            setActionLoading(null);
        }
    }, [effectiveActId, cancelSeparationAct, navigate, t]);

    // ── Delete Separation Act ─────────────────────────────────────────────
    const handleDeleteAct = useCallback(async () => {
        if (!effectiveActId) return;
        try {
            setActionLoading('delete');
            await deleteSeparationAct(effectiveActId);
            toast.success(t('separationActs.deleted', 'Separation act deleted successfully'));
            navigate(paths.warehouse.separationActs.root);
        } catch (error) {
            console.error('Error deleting separation act:', error);
            toast.error(t('error.failed', 'Failed to delete'));
        } finally {
            setActionLoading(null);
        }
    }, [effectiveActId, deleteSeparationAct, navigate, t]);

    // ── Delete Item ───────────────────────────────────────────────────────
    const handleDeleteItem = useCallback(
        async (itemId: string) => {
            if (!effectiveActId) return;
            try {
                setDeletingItemId(itemId);
                await deleteSeparationActItem(effectiveActId, itemId);
                const result = await getSeparationActById(effectiveActId);
                if (result) {
                    setBatchResponse(result);
                }
                toast.success(t('separationActs.itemDeleted', 'Item deleted successfully'));
            } catch (error) {
                console.error('Error deleting item:', error);
                toast.error(t('error.failed', 'Failed to delete item'));
            } finally {
                setDeletingItemId(null);
                setDeleteItemDialog(null);
            }
        },
        [effectiveActId, deleteSeparationActItem, getSeparationActById, t]
    );

    // ── Derived ───────────────────────────────────────────────────────────
    const saveLabel = isNew
        ? t('common.save', 'Save')
        : t('common.save', 'Save');

    const breadcrumbs = useMemo(
        () => [
            { name: t('app'), href: paths.menu.root },
            {
                name: t('overview.warehouse.separationActs', 'Separation Acts'),
                href: paths.warehouse.separationActs.root,
            },
            {
                name: isNew
                    ? t('separationActs.new', 'New')
                    : String(batchResponse?.data?.act?.id || t('common.edit', 'Edit')),
                href: '',
            },
        ],
        [isNew, t, batchResponse?.data?.act?.id]
    );

    const heading = isNew
        ? t('separationActs.createNew', 'Create New Separation Act')
        : t('separationActs.edit', 'Edit Separation Act');

    const ingredientMap = useMemo(() => {
        const map = new Map<string, string>();
        ingredients.forEach((ing) => map.set(ing.id, ing.name));
        return map;
    }, [ingredients]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <Box sx={{ px: 2, m: 0, alignItems: 'center' }}>
            <CustomBreadcrumbs heading={heading} links={breadcrumbs} sx={{ my: 2 }} />

            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pageLoading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            bgcolor: (theme) => theme.palette.background.paper,
                            opacity: 0.85,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {/* Form Section (create/edit mode) */}
                {(isNew || !batchResponse) && (
                    <>
                        <SeparationActsMetaFields
                            date={formData.date}
                            storageId={formData.storage_id}
                            groupId={formData.group_id}
                            sourceIngredientId={formData.source_ingredient_id}
                            sourceQuantity={formData.source_quantity}
                            description={formData.description}
                            onDateChange={handleDateChange}
                            onStorageChange={handleStorageChange}
                            onGroupChange={handleGroupChange}
                            onSourceIngredientChange={handleSourceIngredientChange}
                            onSourceQuantityChange={handleSourceQuantityChange}
                            onDescriptionChange={handleDescriptionChange}
                            storages={storages}
                            groups={groups}
                            ingredients={ingredients}
                            disabled={submitting || pageLoading}
                            isOpen={isInfoOpen}
                            onToggle={() => setIsInfoOpen((v) => !v)}
                        />

                        <SeparationActsLineItems
                            apiRef={lineItemsApiRef}
                            ingredients={ingredients}
                            ingredientsLoading={ingredientsLoading}
                            onRefreshIngredients={refreshIngredients}
                            onHasItemsChange={handleHasItemsChange}
                            onCancel={handleCancel}
                            onSave={handleSubmit}
                            cancelDisabled={ingredientsLoading || pageLoading}
                            saveDisabled={submitting || ingredientsLoading || pageLoading || !hasLineItems}
                            saveLabel={saveLabel}
                        />
                    </>
                )}

                {/* View Section (after creation) */}
                {!isNew && batchResponse && (
                    <Stack spacing={3}>
                        <SeparationActsMetaFields
                            date={formData.date}
                            storageId={formData.storage_id}
                            groupId={formData.group_id}
                            sourceIngredientId={formData.source_ingredient_id}
                            sourceQuantity={formData.source_quantity}
                            description={formData.description}
                            onDateChange={() => {}}
                            onStorageChange={() => {}}
                            onGroupChange={() => {}}
                            onSourceIngredientChange={() => {}}
                            onSourceQuantityChange={() => {}}
                            onDescriptionChange={() => {}}
                            storages={storages}
                            groups={groups}
                            ingredients={ingredients}
                            disabled
                            isOpen={isInfoOpen}
                            onToggle={() => setIsInfoOpen((v) => !v)}
                        />

                        {/* Items Display */}
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                {t('separationActs.items', 'Items')} ({batchResponse.data.items.length})
                            </Typography>
                            {batchResponse.data.items.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('warehouse.ingredient', 'Ingredient')}</TableCell>
                                                <TableCell align="center">{t('calculation.quantity', 'Quantity')}</TableCell>
                                                <TableCell align="right">{t('calculation.price', 'Price')}</TableCell>
                                                <TableCell align="right">{t('calculation.totalPrice', 'Total')}</TableCell>
                                                <TableCell align="center">{t('common.actions', 'Actions')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {batchResponse.data.items.map((item: any) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        {ingredientMap.get(item.ingredient_id) || item.ingredient_id}
                                                    </TableCell>
                                                    <TableCell align="center">{item.quantity}</TableCell>
                                                    <TableCell align="right">{item.price_per_unit}</TableCell>
                                                    <TableCell align="right">{item.total_amount}</TableCell>
                                                    <TableCell align="center">
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            disabled={actionLoading !== null || deletingItemId === item.id}
                                                            onClick={() =>
                                                                setDeleteItemDialog({
                                                                    itemId: item.id,
                                                                    itemName:
                                                                        ingredientMap.get(item.ingredient_id) || item.ingredient_id,
                                                                })
                                                            }
                                                        >
                                                            {deletingItemId === item.id ? (
                                                                <CircularProgress size={16} />
                                                            ) : (
                                                                t('common.delete', 'Delete')
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="text.secondary">{t('separationActs.noItems', 'No items')}</Typography>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button variant="contained" onClick={handleCancel}>
                                {t('common.back', 'Back')}
                            </Button>
                            {batchResponse.data.act.status === 'draft' && (
                                <>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        disabled={!!actionLoading}
                                        onClick={handleConfirm}
                                    >
                                        {actionLoading === 'confirm' ? (
                                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                                        ) : (
                                            t('common.confirm', 'Confirm')
                                        )}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        disabled={!!actionLoading}
                                        onClick={() => {
                                            const confirmed = window.confirm(
                                                t('common.deleteConfirmMessage', 'Are you sure?')
                                            );
                                            if (confirmed) handleDeleteAct();
                                        }}
                                    >
                                        {actionLoading === 'delete' ? (
                                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                                        ) : (
                                            t('common.delete', 'Delete')
                                        )}
                                    </Button>
                                </>
                            )}
                            {batchResponse.data.act.status === 'confirmed' && (
                                <Button
                                    variant="contained"
                                    color="warning"
                                    disabled={!!actionLoading}
                                    onClick={handleCancelAct}
                                >
                                    {actionLoading === 'cancel' ? (
                                        <CircularProgress size={18} sx={{ color: '#fff' }} />
                                    ) : (
                                        t('common.cancel', 'Cancel')
                                    )}
                                </Button>
                            )}
                        </Box>
                    </Stack>
                )}

                {/* Not found state */}
                {!isNew && !batchResponse && !pageLoading && (
                    <Box sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                            {t('error.notFound', 'Not found')}
                        </Typography>
                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => navigate(paths.warehouse.separationActs.root)}
                        >
                            {t('overview.warehouse.separationActs', 'Separation Acts')}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Delete Item Dialog */}
            <Dialog open={!!deleteItemDialog} onClose={() => setDeleteItemDialog(null)}>
                <DialogTitle>{t('common.delete', 'Delete')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('separationActs.deleteItemConfirm', 'Are you sure you want to delete this item?')}
                    </Typography>
                    {deleteItemDialog && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                            {deleteItemDialog.itemName}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteItemDialog(null)}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            if (deleteItemDialog) {
                                handleDeleteItem(deleteItemDialog.itemId);
                            }
                        }}
                    >
                        {t('common.delete', 'Delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default SeparationActsFormView;
