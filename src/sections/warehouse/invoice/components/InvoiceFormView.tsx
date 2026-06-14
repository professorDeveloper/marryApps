import { toast } from 'sonner';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Dialog, DialogContent, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { fetchInvoiceDetailsByInvoiceId } from 'src/hooks/use-invoice-details-api';

import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    invoiceFormPickerActions,
    mapBatchItemsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';

import { InvoiceMetaFields } from './InvoiceMetaFields';
import {
    type InvoiceLineItemsApi,
    InvoiceFormLineItemsSection,
} from './InvoiceFormLineItemsSection';

const InvoiceFormView = React.memo(function InvoiceFormView() {
    const { id } = useParams<{ id?: string }>();
    const invoiceId = id || 'new';
    const isNew = invoiceId === 'new';
    const { t } = useTranslation('menu');
    const {
        createInvoiceBatch,
        updateInvoiceDetailsBatch,
        getInvoiceById,
        updateInvoice,
    } = useInvoiceAPI();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.invoiceForm;
    const { getSuppliers } = useSupplierAPI();
    const { getStorages } = useStorageAPI();

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [storages, setStorages] = useState<any[]>([]);
    const [supplier, setSupplier] = useState('');
    const [storage, setStorage] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString());
    const [invoiceStatus, setInvoiceStatus] = useState('pending');
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);

    const [hasLineItems, setHasLineItems] = useState(false);
    const [ingredientsLoading, setIngredientsLoading] = useState(true);

    const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [tableHeight, setTableHeight] = useState(730);
    const openIngredientDialog = useCallback(() => setIsIngredientDialogOpen(true), []);

    const lineItemsApiRef = useRef<InvoiceLineItemsApi | null>(null);
    const listsFetchedRef = useRef(false);

    const handleHasItemsChange = useCallback((next: boolean) => {
        setHasLineItems(next);
    }, []);

    const handleIngredientsLoadingChange = useCallback((loading: boolean) => {
        setIngredientsLoading(loading);
    }, []);

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

    useEffect(() => {
        if (listsFetchedRef.current) return;
        listsFetchedRef.current = true;
        Promise.all([getSuppliers(), getStorages()])
            .then(([suppliersData, storagesData]) => {
                setSuppliers(suppliersData);
                setStorages(storagesData);
            })
            .catch(console.error);
    }, [getSuppliers, getStorages]);

    useEffect(() => {
        if (!isNew) return;
        if (suppliers.length === 0 || storages.length === 0) return;
        setSupplier((prev) => prev || suppliers[0]?.id || '');
        setStorage((prev) => prev || storages[0]?.id || '');
    }, [isNew, suppliers, storages]);

    useEffect(() => {
        if (isNew) {
            setPageLoading(false);
            return undefined;
        }

        let cancelled = false;

        const load = async () => {
            setPageLoading(true);
            try {
                const invoice = await getInvoiceById(invoiceId);
                if (cancelled) return;
                if (!invoice) {
                    toast.error(t('error.loadFailed'));
                    return;
                }

                setSupplier(invoice.supplier_id || '');
                setStorage(invoice.storage_id || '');
                setInvoiceStatus(invoice.status);
                const d = invoice.date;
                setInvoiceDate(typeof d === 'string' && d ? d : new Date().toISOString());

                const details = invoiceId ? await fetchInvoiceDetailsByInvoiceId(invoiceId) : [];
                if (cancelled) return;
                lineItemsApiRef.current?.restoreFromPersisted(details.filter(Boolean));
                dispatch(
                    invoiceFormPickerActions.setFormState({
                        formName,
                        items: mapBatchItemsToPickerItems(details.filter(Boolean)),
                        meta: { isNew, invoiceId: invoiceId ?? null, source: 'hydrate' },
                    })
                );
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
    }, [dispatch, formName, getInvoiceById, invoiceId, isNew, t]);

    useEffect(
        () => () => {
            dispatch(invoiceFormPickerActions.resetFormState({ formName }));
        },
        [dispatch, formName]
    );

    const handleSubmitBatch = useCallback(async () => {
        const api = lineItemsApiRef.current;
        const batchData = api?.getBatchData() ?? [];

        if (batchData.length === 0) {
            toast.error(t('warehouse.invoiceDetails.addAtLeastOneItem'));
            return;
        }

        if (!supplier) {
            toast.error(t('warehouse.invoices.supplierRequired'));
            return;
        }

        if (!storage) {
            toast.error(t('warehouse.invoices.storageRequired'));
            return;
        }

        const calculatedTotal = batchData.reduce(
            (sum, row) => sum + (parseFloat(String(row.price ?? 0)) || 0),
            0
        );

        try {
            setSubmitting(true);
            dispatch(
                invoiceFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(batchData),
                    meta: { isNew, invoiceId, source: 'submit' },
                })
            );

            if (isNew) {
                await createInvoiceBatch({
                    invoice: {
                        supplier_id: supplier,
                        storage_id: storage,
                        total_amount: calculatedTotal.toString(),
                        status: invoiceStatus,
                        date: invoiceDate || new Date().toISOString(),
                    },
                    details: batchData.map((d) => ({
                        ingredient_id: d.ingredient_id,
                        quantity: d.quantity,
                        price_per_unit: d.price_per_unit,
                        price: d.price,
                    })),
                });

                toast.success(t('warehouse.invoices.created'));
                api?.restoreFromPersisted([]);
                router.push(paths.warehouse.invoiceDetails.root);
                return;
            }

            await updateInvoice(invoiceId, {
                supplier_id: supplier,
                storage_id: storage,
                total_amount: calculatedTotal.toString(),
                status: invoiceStatus,
                date: invoiceDate || new Date().toISOString(),
            });

            await updateInvoiceDetailsBatch(invoiceId, batchData);

            toast.success(t('warehouse.invoiceDetails.batchCreatedSuccess'));
            api?.restoreFromPersisted([]);
            router.push(paths.warehouse.invoiceDetails.root);
        } catch (error) {
            console.error('Error submitting batch:', error);
            toast.error(error instanceof Error ? error.message : t('error.loadFailed'));
        } finally {
            setSubmitting(false);
        }
    }, [
        t,
        supplier,
        storage,
        invoiceDate,
        invoiceStatus,
        isNew,
        invoiceId,
        createInvoiceBatch,
        updateInvoiceDetailsBatch,
        updateInvoice,
        router,
        dispatch,
        formName,
    ]);

    const handleInvoiceCancel = useCallback(() => {
        router.push(paths.warehouse.invoiceDetails.root);
    }, [router]);

    const saveLabel = isNew ? t('save') : t('warehouse.invoiceDetails.submitBatch');

    return (
        <Box sx={{ px: 2, m: 0, alignItems: 'center' }}>
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

                <InvoiceMetaFields
                    supplier={supplier}
                    storage={storage}
                    invoiceDate={invoiceDate}
                    invoiceStatus={invoiceStatus}
                    onSupplierChange={setSupplier}
                    onStorageChange={setStorage}
                    onDateChange={setInvoiceDate}
                    onStatusChange={setInvoiceStatus}
                    suppliers={suppliers}
                    storages={storages}
                    disabled={submitting || pageLoading}
                    isOpen={isInfoOpen}
                    onToggle={() => setIsInfoOpen((v) => !v)}
                />

                <InvoiceFormLineItemsSection
                    apiRef={lineItemsApiRef}
                    onHasItemsChange={handleHasItemsChange}
                    onIngredientsLoadingChange={handleIngredientsLoadingChange}
                    onOpenIngredientDialog={openIngredientDialog}
                    onInvoiceCancel={handleInvoiceCancel}
                    onInvoiceSave={handleSubmitBatch}
                    invoiceCancelDisabled={ingredientsLoading || pageLoading}
                    invoiceSaveDisabled={
                        submitting || ingredientsLoading || pageLoading || !hasLineItems
                    }
                    saveLabel={saveLabel}
                    metaFieldsOpen={isInfoOpen}
                    tableHeight={tableHeight}
                />
            </Box>

            <Dialog open={isIngredientDialogOpen} fullWidth maxWidth="lg">
                <DialogContent>
                    <IngredientEditView
                        isNew
                        onSuccess={() => {
                            void lineItemsApiRef.current?.refreshIngredients();
                            setIsIngredientDialogOpen(false);
                        }}
                        onCancel={() => setIsIngredientDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
});

export default InvoiceFormView;
