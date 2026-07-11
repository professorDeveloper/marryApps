import type {
    Deduction,
    SelectOption,
    DeductionFormData,
} from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Button, Dialog, Typography, DialogContent, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDeductionsAPI } from 'src/hooks/use-deductions-api';

import { useAppDispatch } from 'src/store';
import { fetcher, endpoints } from 'src/lib/axios';
import {
    PICKER_FORM_NAMES,
    deductionFormPickerActions,
    mapBatchItemsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IngredientEditView } from 'src/sections/warehouse/ingredients-edit-view';
import { useIngredients } from 'src/sections/warehouse/invoice/hooks/useIngredients';

import { DeductionMetaFields } from './DeductionMetaFields';
import { DeductionLineItems, type DeductionLineItemsApi } from './DeductionLineItems';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const CREATE_ALLOWED_STATUSES = ['active', 'draft'] as const;
type CreateDeductionStatus = (typeof CREATE_ALLOWED_STATUSES)[number];
const normalizeCreateStatus = (value: unknown): CreateDeductionStatus =>
    CREATE_ALLOWED_STATUSES.includes(value as CreateDeductionStatus)
        ? (value as CreateDeductionStatus)
        : 'active';

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DeductionFormViewProps {
    isNew?: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DeductionFormView = React.memo(function DeductionFormView({
    isNew = false,
}: DeductionFormViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.deductionForm;

    // ── API hooks ─────────────────────────────────────────────────────────
    const {
        getDeductionById,
        createDeduction,
        updateDeduction,
        updateDeductionItemsBatch,
        getDeductionGroups,
    } = useDeductionsAPI();

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

    const [storages, setStorages] = useState<SelectOption[]>([]);
    const [groups, setGroups] = useState<SelectOption[]>([]);

    const [deduction, setDeduction] = useState<Deduction | null>(null);
    const [createdDeductionId, setCreatedDeductionId] = useState<string | undefined>(undefined);
    const [hasLineItems, setHasLineItems] = useState(false);

    const [formData, setFormData] = useState<DeductionFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        status: 'active',
        storage_id: '',
        description: '',
        act_group_id: '',
    });

    const lineItemsApiRef = useRef<DeductionLineItemsApi | null>(null);
    const listsFetchedRef = useRef(false);
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

    // ── Effective deduction ID ────────────────────────────────────────────
    const effectiveDeductionId = id || deduction?.id || createdDeductionId;

    // ── Status options ────────────────────────────────────────────────────
    const statusOptions = useMemo(
        () => [
            { value: 'active', label: t('deductions.active') },
            { value: 'draft', label: t('deductions.draft') },
        ],
        [t]
    );

    // ── Load base data (storages, groups) ─────────────────────────────────
    useEffect(() => {
        if (listsFetchedRef.current) return;
        listsFetchedRef.current = true;

        Promise.all([
            getDeductionGroups(),
            fetcher<BackendResponse<SelectOption[]>>(endpoints.storage.list).catch(() => ({
                data: [] as SelectOption[],
            })),
        ])
            .then(([groupsData, storagesData]) => {
                setGroups(Array.isArray(groupsData) ? groupsData : []);
                setStorages(
                    Array.isArray((storagesData as any)?.data) ? (storagesData as any).data : []
                );
            })
            .catch(console.error);
    }, [getDeductionGroups]);

    // ── Load existing deduction (edit mode) ───────────────────────────────
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

        let cancelled = false;
        const load = async () => {
            setPageLoading(true);
            try {
                const data = await getDeductionById(id);
                if (cancelled) return;
                if (!data) {
                    toast.error(t('error.notFound'));
                    navigate(paths.warehouse.deductions.root);
                    return;
                }
                setDeduction(data);
                setFormData({
                    date: dayjs(data.date).format('YYYY-MM-DD'),
                    status: data.status,
                    storage_id: data.storage_id,
                    description: data.description || '',
                    act_group_id: data.act_group_id,
                });
                if (data.items) {
                    lineItemsApiRef.current?.restoreFromPersisted(data.items);
                    dispatch(
                        deductionFormPickerActions.setFormState({
                            formName,
                            items: mapBatchItemsToPickerItems(data.items),
                            meta: { isNew, deductionId: id ?? null, source: 'hydrate' },
                        })
                    );
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    loadedIdRef.current = null;
                    toast.error(t('error.loadFailed'));
                }
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [dispatch, formName, getDeductionById, id, isNew, navigate, t]);

    useEffect(
        () => () => {
            dispatch(deductionFormPickerActions.resetFormState({ formName }));
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
        (value: string) => setFormData((prev) => ({ ...prev, act_group_id: value })),
        []
    );
    const handleStatusChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, status: value })),
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
        if (!formData.act_group_id) {
            toast.error(t('deductions.groupRequired'));
            return;
        }

        const payload = {
            date: formData.date,
            status: isNew ? normalizeCreateStatus(formData.status) : formData.status,
            storage_id: formData.storage_id,
            description: formData.description,
            act_group_id: formData.act_group_id,
            items: batchData,
        };

        try {
            setSubmitting(true);
            const targetId = createdDeductionId || id;
            dispatch(
                deductionFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(batchData),
                    meta: {
                        isNew,
                        deductionId: targetId ?? null,
                        source: 'submit',
                    },
                })
            );

            if (isNew && !targetId) {
                const result = await createDeduction(payload);
                if (result) {
                    setCreatedDeductionId(result.id);
                    setDeduction(result);
                    toast.success(t('deductions.created'));
                    navigate(paths.warehouse.deductions.root);
                }
            } else if (targetId) {
                const result = await updateDeductionItemsBatch(targetId, batchData);
                if (result) {
                    setDeduction(result);
                    toast.success(t('deductions.updated'));
                    navigate(paths.warehouse.deductions.root);
                }
            }
        } catch (error) {
            console.error('Error saving deduction:', error);
        } finally {
            setSubmitting(false);
        }
    }, [
        formData,
        isNew,
        createdDeductionId,
        id,
        createDeduction,
        updateDeductionItemsBatch,
        navigate,
        t,
        dispatch,
        formName,
    ]);

    // ── Cancel ────────────────────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        navigate(paths.warehouse.deductions.root);
    }, [navigate]);

    // ── Derived ───────────────────────────────────────────────────────────
    const saveLabel = isNew
        ? t('common.save')
        : t('common.save');

    const breadcrumbs = useMemo(
        () => [
            { name: t('overview.operations.title'), href: paths.operations.invoices.root },
            {
                name: t('deductions.title'),
                href: paths.warehouse.deductions.root,
            },
            {
                name: isNew
                    ? t('deductions.new')
                    : String(deduction?.number || t('common.edit')),
                href: '',
            },
        ],
        [isNew, t, deduction?.number]
    );

    const heading = isNew
        ? t('deductions.createNew')
        : t('deductions.edit');

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

                <DeductionMetaFields
                    date={formData.date}
                    storageId={formData.storage_id}
                    groupId={formData.act_group_id}
                    status={formData.status}
                    description={formData.description}
                    onDateChange={handleDateChange}
                    onStorageChange={handleStorageChange}
                    onGroupChange={handleGroupChange}
                    onStatusChange={handleStatusChange}
                    onDescriptionChange={handleDescriptionChange}
                    storages={storages}
                    groups={groups}
                    statusOptions={statusOptions}
                    disabled={submitting || pageLoading}
                    isOpen={isInfoOpen}
                    onToggle={() => setIsInfoOpen((v) => !v)}
                />

                <DeductionLineItems
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

                {/* Edit mode: not found state */}
                {!isNew && !deduction && !pageLoading && (
                    <Box sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                            {t('error.notFound')}
                        </Typography>
                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => navigate(paths.warehouse.deductions.root)}
                        >
                            {t('deductions.title')}
                        </Button>
                    </Box>
                )}
            </Box>

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

export default DeductionFormView;
