import type {
    SelectOption,
    ShipmentsFormData,
    ShipmentBatchApiResponse,
} from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
    Box,
    Stack,
    Button,
    Dialog,
    Typography,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useShipmentsAPI } from 'src/hooks/use-shipments-api';
import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    shipmentsFormPickerActions,
    mapBatchItemsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useIngredients } from 'src/sections/warehouse/invoice/hooks/useIngredients';

import { ShipmentsMetaFields } from './ShipmentsMetaFields';
import { ShipmentsLineItems, type ShipmentsLineItemsApi } from './ShipmentsLineItems';

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

interface ShipmentsFormViewProps {
    isNew?: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ShipmentsFormView = React.memo(function ShipmentsFormView({
    isNew = false,
}: ShipmentsFormViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.shipmentsForm;

    // ── API hooks ─────────────────────────────────────────────────────────
    const {
        getShipmentById,
        createShipmentBatch,
        updateShipment,
        confirmShipment,
        cancelShipment,
        deleteShipment,
        deleteShipmentItem,
    } = useShipmentsAPI();
    const { getStorages } = useStorageAPI();
    const { getSuppliers } = useSupplierAPI();

    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();

    // ── State ─────────────────────────────────────────────────────────────
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [tableHeight, setTableHeight] = useState(730);

    const [storages, setStorages] = useState<SelectOption[]>([]);
    const [suppliers, setSuppliers] = useState<SelectOption[]>([]);

    const [batchResponse, setBatchResponse] = useState<ShipmentBatchApiResponse | null>(null);
    const [hasLineItems, setHasLineItems] = useState(false);
    const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | 'delete' | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [deleteItemDialog, setDeleteItemDialog] = useState<{ itemId: string; itemName: string } | null>(null);

    const [formData, setFormData] = useState<ShipmentsFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        storage_id: '',
        supplier_id: '',
        description: '',
    });

    const lineItemsApiRef = useRef<ShipmentsLineItemsApi | null>(null);
    const listsFetchedRef = useRef(false);

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

    // ── Effective shipment ID ─────────────────────────────────────────────
    const effectiveShipmentId = id || batchResponse?.data?.shipment?.id;

    // ── Load base data (storages, suppliers, ingredients) ──────────────────
    useEffect(() => {
        if (listsFetchedRef.current) return;
        listsFetchedRef.current = true;

        Promise.all([getStorages(), getSuppliers()])
            .then(([storagesData, suppliersData]) => {
                setStorages(Array.isArray(storagesData) ? storagesData : []);
                setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
            })
            .catch(console.error);
    }, [getStorages, getSuppliers]);

    // ── Load existing shipment (edit mode) ─────────────────────────────────
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
                const data = await getShipmentById(id);
                if (cancelled) return;
                if (!data) {
                    toast.error(t('error.notFound'));
                    navigate(paths.warehouse.shipments.root);
                    return;
                }
                setBatchResponse(data);
                setFormData({
                    date: dayjs(data.data.shipment.date).format('YYYY-MM-DD'),
                    storage_id: data.data.shipment.storage_id,
                    supplier_id: data.data.shipment.supplier_id,
                    description: data.data.shipment.description || '',
                });
                if (data.data.items) {
                    lineItemsApiRef.current?.restoreFromPersisted(data.data.items);
                    dispatch(
                        shipmentsFormPickerActions.setFormState({
                            formName,
                            items: mapBatchItemsToPickerItems(data.data.items),
                            meta: { isNew, shipmentId: id ?? null, source: 'hydrate' },
                        })
                    );
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
    }, [dispatch, formName, getShipmentById, id, isNew, navigate, t]);

    useEffect(
        () => () => {
            dispatch(shipmentsFormPickerActions.resetFormState({ formName }));
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
    const handleSupplierChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, supplier_id: value })),
        []
    );
    const handleDescriptionChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, description: value })),
        []
    );
    const handleHasItemsChange = useCallback((next: boolean) => {
        setHasLineItems(next);
    }, []);

    // ── Submit (create or update) ─────────────────────────────────────────
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
        if (!formData.supplier_id) {
            toast.error(t('warehouse.invoices.supplierRequired'));
            return;
        }

        const payload = {
            date: dayjs(formData.date).toISOString(),
            storage_id: formData.storage_id,
            supplier_id: formData.supplier_id,
            description: formData.description,
            items: batchData,
        };

        try {
            setSubmitting(true);
            dispatch(
                shipmentsFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(batchData as Array<Record<string, unknown>>),
                    meta: {
                        isNew,
                        shipmentId: effectiveShipmentId ?? null,
                        source: 'submit',
                    },
                })
            );

            if (isNew && !effectiveShipmentId) {
                const result = await createShipmentBatch(payload);
                if (result) {
                    setBatchResponse(result);
                    toast.success(t('shipments.created'));
                }
            } else if (effectiveShipmentId) {
                const result = await updateShipment(effectiveShipmentId, payload);
                if (result) {
                    setBatchResponse(result);
                    toast.success(t('shipments.updated'));
                }
            }
        } catch (error) {
            console.error('Error saving shipment:', error);
        } finally {
            setSubmitting(false);
        }
    }, [formData, isNew, effectiveShipmentId, createShipmentBatch, getShipmentById, t, dispatch, formName]);

    // ── Cancel ────────────────────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        navigate(paths.warehouse.shipments.root);
    }, [navigate]);

    // ── Confirm Shipment ──────────────────────────────────────────────────
    const handleConfirm = useCallback(async () => {
        if (!effectiveShipmentId) return;
        try {
            setActionLoading('confirm');
            await confirmShipment(effectiveShipmentId);
            toast.success(t('shipments.confirmed'));
            navigate(paths.warehouse.shipments.root);
        } catch (error) {
            console.error('Error confirming shipment:', error);
            toast.error(t('error.failed'));
        } finally {
            setActionLoading(null);
        }
    }, [effectiveShipmentId, confirmShipment, navigate, t]);

    // ── Cancel Shipment ───────────────────────────────────────────────────
    const handleCancelShipment = useCallback(async () => {
        if (!effectiveShipmentId) return;
        try {
            setActionLoading('cancel');
            await cancelShipment(effectiveShipmentId);
            toast.success(t('shipments.cancelled'));
            navigate(paths.warehouse.shipments.root);
        } catch (error) {
            console.error('Error cancelling shipment:', error);
            toast.error(t('error.failed'));
        } finally {
            setActionLoading(null);
        }
    }, [effectiveShipmentId, cancelShipment, navigate, t]);

    // ── Delete Shipment ───────────────────────────────────────────────────
    const handleDeleteShipment = useCallback(async () => {
        if (!effectiveShipmentId) return;
        try {
            setActionLoading('delete');
            await deleteShipment(effectiveShipmentId);
            toast.success(t('shipments.deleted'));
            navigate(paths.warehouse.shipments.root);
        } catch (error) {
            console.error('Error deleting shipment:', error);
            toast.error(t('error.failed'));
        } finally {
            setActionLoading(null);
        }
    }, [effectiveShipmentId, deleteShipment, navigate, t]);

    // ── Delete Shipment Item ──────────────────────────────────────────────
    const handleDeleteItem = useCallback(
        async (itemId: string) => {
            if (!effectiveShipmentId) return;
            try {
                setDeletingItemId(itemId);
                await deleteShipmentItem(effectiveShipmentId, itemId);
                const result = await getShipmentById(effectiveShipmentId);
                if (result) {
                    setBatchResponse(result);
                }
                toast.success(t('shipments.itemDeleted'));
            } catch (error) {
                console.error('Error deleting item:', error);
                toast.error(t('error.failed'));
            } finally {
                setDeletingItemId(null);
                setDeleteItemDialog(null);
            }
        },
        [effectiveShipmentId, deleteShipmentItem, getShipmentById, t]
    );

    // ── Derived ───────────────────────────────────────────────────────────
    const saveLabel = isNew
        ? t('common.save')
        : t('common.save');

    const breadcrumbs = useMemo(
        () => [
            { name: t('app'), href: paths.menu.root },
            {
                name: t('overview.warehouse.shipments'),
                href: paths.warehouse.shipments.root,
            },
            {
                name: isNew
                    ? t('shipments.new')
                    : String(batchResponse?.data?.shipment?.number || t('common.edit')),
                href: '',
            },
        ],
        [isNew, t, batchResponse?.data?.shipment?.number]
    );

    const heading = isNew
        ? t('shipments.createNew')
        : t('shipments.edit');

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
                        <ShipmentsMetaFields
                            date={formData.date}
                            storageId={formData.storage_id}
                            supplierId={formData.supplier_id}
                            description={formData.description}
                            onDateChange={handleDateChange}
                            onStorageChange={handleStorageChange}
                            onSupplierChange={handleSupplierChange}
                            onDescriptionChange={handleDescriptionChange}
                            storages={storages}
                            suppliers={suppliers}
                            disabled={submitting || pageLoading}
                            isOpen={isInfoOpen}
                            onToggle={() => setIsInfoOpen((v) => !v)}
                        />

                        <ShipmentsLineItems
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
                            metaFieldsOpen={isInfoOpen}
                            tableHeight={tableHeight}
                        />
                    </>
                )}

                {/* View Section (after creation) */}
                {!isNew && batchResponse && (
                    <Stack spacing={3}>
                        <ShipmentsMetaFields
                            date={formData.date}
                            storageId={formData.storage_id}
                            supplierId={formData.supplier_id}
                            description={formData.description}
                            onDateChange={() => {}}
                            onStorageChange={() => {}}
                            onSupplierChange={() => {}}
                            onDescriptionChange={() => {}}
                            storages={storages}
                            suppliers={suppliers}
                            disabled
                            isOpen={isInfoOpen}
                            onToggle={() => setIsInfoOpen((v) => !v)}
                        />

                        {/* Items Display */}
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                {t('shipments.items')} ({batchResponse.data.items.length})
                            </Typography>
                            {batchResponse.data.items.length > 0 ? (
                                <Stack spacing={1}>
                                    {batchResponse.data.items.map((item) => (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 1.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {ingredientMap.get(item.ingredient_id) || item.ingredient_id}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Qty: {item.quantity} | Price: {item.price_per_unit} | Total:{' '}
                                                    {item.total_amount}
                                                </Typography>
                                            </Box>
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
                                                    t('common.delete')
                                                )}
                                            </Button>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography color="text.secondary">{t('shipments.noItems')}</Typography>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button variant="contained" onClick={handleCancel}>
                                {t('common.back')}
                            </Button>
                            {batchResponse.data.shipment.status === 'draft' && (
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
                                            if (confirmed) handleDeleteShipment();
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
                            {batchResponse.data.shipment.status === 'confirmed' && (
                                <Button
                                    variant="contained"
                                    color="warning"
                                    disabled={!!actionLoading}
                                    onClick={handleCancelShipment}
                                >
                                    {actionLoading === 'cancel' ? (
                                        <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                                    ) : (
                                        t('common.cancel')
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
                            {t('error.notFound')}
                        </Typography>
                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => navigate(paths.warehouse.shipments.root)}
                        >
                            {t('overview.warehouse.shipments')}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Delete Item Dialog */}
            <Dialog open={!!deleteItemDialog} onClose={() => setDeleteItemDialog(null)}>
                <DialogTitle>{t('common.delete')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('shipments.deleteItemConfirm')}
                    </Typography>
                    {deleteItemDialog && (
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                            {deleteItemDialog.itemName}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteItemDialog(null)}>
                        {t('common.cancel')}
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
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default ShipmentsFormView;
