import type {
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

import { useSeparationActsAPI } from 'src/hooks/use-separation-acts-api';
import { useStoragesList, useDeductionGroups } from 'src/hooks/use-reference-data';

import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    mapBatchItemsToPickerItems,
    separationActsFormPickerActions,
} from 'src/store/slices/pickerFormSlices';

import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';
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
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.separationActsForm;

    // ── API hooks ─────────────────────────────────────────────────────────
    const {
        getSeparationActById,
        createSeparationActBatch,
        updateSeparationAct,
        confirmSeparationAct,
        cancelSeparationAct,
        deleteSeparationAct,
        deleteSeparationActItem,
    } = useSeparationActsAPI();

    const {
        ingredients,
        loading: ingredientsLoading,
        refreshIngredients,
        addIngredient,
    } = useIngredients();

    // ── State ─────────────────────────────────────────────────────────────
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [tableHeight, setTableHeight] = useState(730);
    const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
    const openIngredientDialog = useCallback(() => setIsIngredientDialogOpen(true), []);

    // Shared reference data (SWR-deduped across views/mounts)
    const { storages } = useStoragesList();
    const { groups } = useDeductionGroups();

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
    const loadedIdRef = useRef<string | null>(null);

    // ── Calculate table height based on viewport ───────────────────────────
    useEffect(() => {
        const calculateHeight = () => {
            const viewportHeight = window.innerHeight;
            const reservedSpace = isInfoOpen ? 460 : 220;
            const calculatedHeight = Math.max(300, viewportHeight - reservedSpace);
            setTableHeight(calculatedHeight);
        };

        calculateHeight();
        window.addEventListener('resize', calculateHeight);
        return () => window.removeEventListener('resize', calculateHeight);
    }, [isInfoOpen]);

    // ── Effective separation act ID ────────────────────────────────────────
    const effectiveActId = id || batchResponse?.data?.act?.id;

    // ── Load existing separation act (edit mode) ──────────────────────────
    useEffect(() => {
        if (isNew) {
            setPageLoading(false);
            return undefined;
        }
        if (!id) {
            setPageLoading(false);
            return undefined;
        }
        if (loadedIdRef.current === id) {
            setPageLoading(false);
            return undefined;
        }
        loadedIdRef.current = id;

        const load = async () => {
            setPageLoading(true);
            try {
                const data = await getSeparationActById(id);
                // A newer id may have taken over loadedIdRef while this request was
                // in flight (e.g. React StrictMode's dev-only double effect-invoke,
                // or navigating to a different act before this one resolved).
                if (loadedIdRef.current !== id) return;
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
                    dispatch(
                        separationActsFormPickerActions.setFormState({
                            formName,
                            items: mapBatchItemsToPickerItems(data.data.items),
                            meta: { isNew, separationActId: id ?? null, source: 'hydrate' },
                        })
                    );
                }
            } catch (e) {
                console.error(e);
                if (loadedIdRef.current === id) {
                    loadedIdRef.current = null;
                    toast.error(t('error.loadFailed'));
                }
            } finally {
                if (loadedIdRef.current === id) setPageLoading(false);
            }
        };

        load();
        return undefined;
    }, [dispatch, formName, getSeparationActById, id, isNew, navigate, t]);

    useEffect(
        () => () => {
            dispatch(separationActsFormPickerActions.resetFormState({ formName }));
        },
        [dispatch, formName]
    );

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
            toast.error(t('deductions.itemsRequired'));
            return;
        }
        if (!formData.storage_id) {
            toast.error(t('deductions.storageRequired'));
            return;
        }
        if (!formData.group_id) {
            toast.error(t('deductions.groupRequired'));
            return;
        }
        if (!formData.source_ingredient_id) {
            toast.error(t('separationActs.sourceIngredientRequired'));
            return;
        }
        if (!formData.source_quantity || Number(formData.source_quantity) <= 0) {
            toast.error(t('separationActs.sourceQuantityRequired'));
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
            dispatch(
                separationActsFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(transformedItems),
                    meta: {
                        isNew,
                        separationActId: effectiveActId ?? null,
                        source: 'submit',
                    },
                })
            );

            if (isNew && !effectiveActId) {
                const result = await createSeparationActBatch(payload);
                if (result) {
                    setBatchResponse(result);
                    toast.success(t('separationActs.created'));
                }
            } else if (effectiveActId) {
                const result = await updateSeparationAct(effectiveActId, payload);
                if (result) {
                    setBatchResponse(result);
                    toast.success(t('separationActs.updated'));
                }
            }
        } catch (error) {
            console.error('Error saving separation act:', error);
        } finally {
            setSubmitting(false);
        }
    }, [formData, isNew, effectiveActId, ingredients, createSeparationActBatch, getSeparationActById, t, dispatch, formName]);

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
            toast.success(t('separationActs.confirmed'));
            navigate(paths.warehouse.separationActs.root);
        } catch (error) {
            console.error('Error confirming separation act:', error);
            toast.error(t('error.failed'));
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
            toast.success(t('separationActs.cancelled'));
            navigate(paths.warehouse.separationActs.root);
        } catch (error) {
            console.error('Error cancelling separation act:', error);
            toast.error(t('error.failed'));
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
            toast.success(t('separationActs.deleted'));
            navigate(paths.warehouse.separationActs.root);
        } catch (error) {
            console.error('Error deleting separation act:', error);
            toast.error(t('error.failed'));
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
                toast.success(t('separationActs.itemDeleted'));
            } catch (error) {
                console.error('Error deleting item:', error);
                toast.error(t('error.failed'));
            } finally {
                setDeletingItemId(null);
                setDeleteItemDialog(null);
            }
        },
        [effectiveActId, deleteSeparationActItem, getSeparationActById, t]
    );

    // ── Derived ───────────────────────────────────────────────────────────
    const saveLabel = isNew
        ? t('common.save')
        : t('common.save');

    const breadcrumbs = useMemo(
        () => [
            { name: t('overview.operations.title'), href: paths.operations.invoices.root },
            {
                name: t('overview.warehouse.separationActs'),
                href: paths.warehouse.separationActs.root,
            },
            {
                name: isNew
                    ? t('separationActs.new')
                    : String(batchResponse?.data?.act?.id || t('common.edit')),
                href: '',
            },
        ],
        [isNew, t, batchResponse?.data?.act?.id]
    );

    const heading = isNew
        ? t('separationActs.createNew')
        : t('separationActs.edit');

    const ingredientMap = useMemo(() => {
        const map = new Map<string, string>();
        ingredients.forEach((ing) => map.set(ing.id, ing.name));
        return map;
    }, [ingredients]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <Box sx={{ px: { xs: 2, md: 4 }, m: 0, alignItems: 'center' }}>

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
                        <CircularProgress color="primary" />
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
                            onOpenIngredientDialog={openIngredientDialog}
                            onHasItemsChange={handleHasItemsChange}
                            onCancel={handleCancel}
                            onSave={handleSubmit}
                            cancelDisabled={ingredientsLoading || pageLoading}
                            saveDisabled={submitting || ingredientsLoading || pageLoading || !hasLineItems}
                            saveLabel={saveLabel}
                            metaFieldsOpen={isInfoOpen}
                            tableHeight={tableHeight}
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
                                {t('separationActs.items')} ({batchResponse.data.items.length})
                            </Typography>
                            {batchResponse.data.items.length > 0 ? (
                                <TableContainer sx={{ overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: 600 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('warehouse.ingredient')}</TableCell>
                                                <TableCell align="center">{t('calculation.quantity')}</TableCell>
                                                <TableCell align="right">{t('calculation.price')}</TableCell>
                                                <TableCell align="right">{t('calculation.totalPrice')}</TableCell>
                                                <TableCell align="center">{t('common.actions')}</TableCell>
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
                                                                <CircularProgress size={16} color="inherit" />
                                                            ) : (
                                                                t('common.delete')
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography color="text.secondary">{t('separationActs.noItems')}</Typography>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            justifyContent="flex-end"
                        >
                            <Button variant="contained" onClick={handleCancel}>
                                {t('common.back')}
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
                                            <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                                        ) : (
                                            t('common.confirm')
                                        )}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        disabled={!!actionLoading}
                                        onClick={() => {
                                            const confirmed = window.confirm(
                                                t('common.deleteConfirmMessage')
                                            );
                                            if (confirmed) handleDeleteAct();
                                        }}
                                    >
                                        {actionLoading === 'delete' ? (
                                            <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                                        ) : (
                                            t('common.delete')
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
                                        <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                                    ) : (
                                        t('common.cancel')
                                    )}
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                )}

                {/* Not found state */}
                {!isNew && !batchResponse && !pageLoading && (
                    <Box sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                            {t('error.notFound')}
                        </Typography>
                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => navigate(paths.warehouse.separationActs.root)}
                        >
                            {t('overview.warehouse.separationActs')}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Delete Item Dialog */}
            <Dialog
                open={!!deleteItemDialog}
                onClose={() => setDeleteItemDialog(null)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>{t('common.delete')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('separationActs.deleteItemConfirm')}
                    </Typography>
                    {deleteItemDialog && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                            {deleteItemDialog.itemName}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <Button
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                        onClick={() => setDeleteItemDialog(null)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                        variant="contained"
                        color="error"
                        onClick={() => {
                            if (deleteItemDialog) {
                                handleDeleteItem(deleteItemDialog.itemId);
                            }
                        }}
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isIngredientDialogOpen} fullWidth maxWidth="lg">
                <DialogContent>
                    <IngredientEditView
                        isNew
                        onSuccess={(created) => {
                            if (created) addIngredient(created);
                            setIsIngredientDialogOpen(false);
                        }}
                        onCancel={() => setIsIngredientDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
});

export default SeparationActsFormView;
