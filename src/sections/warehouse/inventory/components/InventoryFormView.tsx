import type { InventoryItemsApi, IInventoryFormData } from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { debounce } from 'es-toolkit';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Dialog, Typography, DialogContent, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks/use-router';

import { useInventoryAPI } from 'src/hooks/use-inventory-api';
import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    inventoryFormPickerActions,
    mapBatchItemsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

import { useGetStorages } from 'src/actions/departments';

import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';

import { InventoryMetaFields } from './InventoryMetaFields';
import { InventoryItemsSection } from './InventoryItemsSection';

const InventoryFormView = React.memo(function InventoryFormView() {
    const { id } = useParams<{ id?: string }>();
    const isNew = !id;
    const { t } = useTranslation('menu');
    const router = useRouter();
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.inventoryForm;
    
    const {
        getInventoryById,
        getInventoryItems,
        createInventoryBatch,
        updateInventory,
        updateInventoryItemsBatch,
        applyInventory,
    } = useInventoryAPI();
    
    // Meta fields
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm:ss'));
    const [storageId, setStorageId] = useState('');
    const [status, setStatus] = useState('draft');
    const [description, setDescription] = useState('');
    
    // UI state
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);
    const [hasItems, setHasItems] = useState(false);
    const [ingredientsLoading, setIngredientsLoading] = useState(true);
    const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [tableHeight, setTableHeight] = useState(730);
    const [createdInventoryId, setCreatedInventoryId] = useState<string | undefined>();
    
    const itemsApiRef = useRef<InventoryItemsApi | null>(null);
    const effectiveId = id || createdInventoryId;

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
    /** Latest description text (avoids stale closure on save when debounce hasn’t flushed). */
    const descriptionLiveRef = useRef(description);
    useEffect(() => {
        descriptionLiveRef.current = description;
    }, [description]);

    const debouncedSetDescription = useMemo(
        () =>
            debounce((value: string) => {
                setDescription(value);
            }, 220),
        []
    );
    useEffect(() => () => debouncedSetDescription.cancel(), [debouncedSetDescription]);

    const handleDescriptionLive = useCallback(
        (value: string) => {
            descriptionLiveRef.current = value;
            debouncedSetDescription(value);
        },
        [debouncedSetDescription]
    );

    // Store items to restore after ingredients load
    const pendingItemsRef = useRef<any[] | null>(null);
    
    // Load existing inventory on edit
    useEffect(() => {
        if (isNew) {
            setPageLoading(false);
            return;
        }
        
        let cancelled = false;
        const load = async () => {
            setPageLoading(true);
            try {
                const inventory = await getInventoryById(id!);
                if (cancelled) return;
                if (!inventory) {
                    toast.error(t('error.notFound'));
                    router.push(paths.menu.inventory.root);
                    return;
                }
                setDate(dayjs(inventory.date).format('YYYY-MM-DDTHH:mm:ss'));
                setStorageId(inventory.storage_id || '');
                setStatus(inventory.status || 'draft');
                setDescription(inventory.description || '');
                
                const items = await getInventoryItems(id!);
                if (cancelled) return;
                // Store items so we can restore after apiRef is ready
                pendingItemsRef.current = items;
                // Try immediate restore (may work if child already mounted)
                itemsApiRef.current?.restoreFromPersisted(items);
                dispatch(
                    inventoryFormPickerActions.setFormState({
                        formName,
                        items: mapBatchItemsToPickerItems(items ?? []),
                        meta: { isNew, inventoryId: id ?? null, source: 'hydrate' },
                    })
                );
            } catch {
                if (!cancelled) toast.error(t('error.loadFailed'));
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };
        
        load();
        return () => { cancelled = true; };
    }, [dispatch, formName, getInventoryById, getInventoryItems, id, isNew, router, t]);

    useEffect(
        () => () => {
            dispatch(inventoryFormPickerActions.resetFormState({ formName }));
        },
        [dispatch, formName]
    );
    
    const { storages } = useGetStorages();

    
    // When ingredients finish loading, restore pending items (edit mode)
    const handleIngredientsLoadingChange = useCallback((loading: boolean) => {
        setIngredientsLoading(loading);
        if (!loading && pendingItemsRef.current) {
            itemsApiRef.current?.restoreFromPersisted(pendingItemsRef.current);
            pendingItemsRef.current = null;
        }
    }, []);

    const storageOptions = useMemo(
        () => (Array.isArray(storages) ? storages.map((s: any) => ({ id: s.id, name: s.name })) : []),
        [storages]
    );

    const handleSave = useCallback(async () => {
        if (!storageId) {
            toast.error(t('inventory.selectStorage'));
            return;
        }
        const batchData = itemsApiRef.current?.getBatchData() ?? [];
        if (batchData.length === 0) {
            toast.error(t('inventory.selectIngredients'));
            return;
        }

        setSubmitting(true);
        try {
            debouncedSetDescription.flush();
            dispatch(
                inventoryFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(batchData as Array<Record<string, unknown>>),
                    meta: { isNew, inventoryId: effectiveId ?? null, source: 'submit' },
                })
            );
            const formPayload: IInventoryFormData = {
                counted_date: date,
                status: status as IInventoryFormData['status'],
                storage_id: storageId,
                description: descriptionLiveRef.current,
            };

            if (isNew && !createdInventoryId) {
                const result = await createInventoryBatch({ ...formPayload, items: batchData });
                if (!result) return;
                setCreatedInventoryId(result.inventory.id);
            } else {
                const currentId = effectiveId!;
                await updateInventory(currentId, formPayload);
                const savedItems = await updateInventoryItemsBatch(currentId, batchData);
                if (savedItems) await applyInventory(currentId);
            }

            toast.success(isNew ? t('success.created') : t('success.updated'));
            router.push(paths.menu.inventory.root);
        } catch {
            toast.error(t('error.saveFailed'));
        } finally {
            setSubmitting(false);
        }
    }, [
        storageId, date, status, isNew, createdInventoryId, effectiveId,
        createInventoryBatch, updateInventory, updateInventoryItemsBatch, applyInventory, t,
        debouncedSetDescription,
        dispatch,
        formName,
    ]);

    const handleCancel = useCallback(() => {
        router.push(paths.menu.inventory.root);
    }, [router]);

    return (
        <Box sx={{ px: 4, m: 0 }}>
           

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
                            bgcolor: 'var(--bg)',
                            opacity: 0.85,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                <InventoryMetaFields
                    date={date}
                    storageId={storageId}
                    status={status}
                    description={description}
                    onDateChange={setDate}
                    onStorageChange={setStorageId}
                    onStatusChange={setStatus}
                    onDescriptionChange={handleDescriptionLive}
                    storages={storageOptions}
                    disabled={submitting || pageLoading}
                    isOpen={isInfoOpen}
                    onToggle={() => setIsInfoOpen((v) => !v)}
                />

                <InventoryItemsSection
                    apiRef={itemsApiRef}
                    storageId={storageId}
                    date={date}
                    onHasItemsChange={setHasItems}
                    onIngredientsLoadingChange={handleIngredientsLoadingChange}
                    onOpenIngredientDialog={() => setIsIngredientDialogOpen(true)}
                    onCancel={handleCancel}
                    onSave={handleSave}
                    cancelDisabled={ingredientsLoading || pageLoading}
                    saveDisabled={submitting || ingredientsLoading || pageLoading || !hasItems}
                    isSaving={submitting}
                    metaFieldsOpen={isInfoOpen}
                    tableHeight={tableHeight}
                />

            </Box>

            <Dialog open={isIngredientDialogOpen} fullWidth maxWidth="lg">
                <DialogContent>
                    <IngredientEditView
                        isNew
                        onSuccess={() => {
                            void itemsApiRef.current?.refreshIngredients();
                            setIsIngredientDialogOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
});

export default InventoryFormView;
