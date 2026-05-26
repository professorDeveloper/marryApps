import type {
    Branch,
    Storage,
    Transfer,
    SelectOption,
    TransferFormData,
} from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Button, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';
import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    transfersFormPickerActions,
    mapBatchItemsToPickerItems,
} from 'src/store/slices/pickerFormSlices';

import { fetcher, endpoints } from 'src/lib/axios';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useIngredients } from 'src/sections/warehouse/invoice/hooks/useIngredients';

import { TransfersMetaFields } from './TransfersMetaFields';
import { TransfersLineItems, type TransfersLineItemsApi } from './TransfersLineItems';

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

interface TransfersFormViewProps {
    isNew?: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TransfersFormView = React.memo(function TransfersFormView({
    isNew = false,
}: TransfersFormViewProps) {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.transfersForm;

    // ── API hooks ─────────────────────────────────────────────────────────
    const {
        getTransferById,
        createTransferBatch,
        updateTransferItemsBatch,
        getTransferGroups,
    } = useTransfersAPI();

    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();

    // ── State ─────────────────────────────────────────────────────────────
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [tableHeight, setTableHeight] = useState(730);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [storages, setStorages] = useState<Storage[]>([]);
    const [fromStorages, setFromStorages] = useState<Storage[]>([]);
    const [toStorages, setToStorages] = useState<Storage[]>([]);
    const [groups, setGroups] = useState<SelectOption[]>([]);

    const [transfer, setTransfer] = useState<Transfer | null>(null);
    const [hasLineItems, setHasLineItems] = useState(false);

    const initialBranchId =
        typeof window !== 'undefined'
            ? localStorage.getItem('selectedBranchId') || localStorage.getItem('branch_id') || ''
            : '';

    const [formData, setFormData] = useState<TransferFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        from_branch_id: initialBranchId,
        to_branch_id: initialBranchId,
        from_storage_id: '',
        to_storage_id: '',
        act_group_id: '',
        status: 'active',
        description: '',
    });

    const lineItemsApiRef = useRef<TransfersLineItemsApi | null>(null);
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

    // ── Effective transfer ID ─────────────────────────────────────────────
    const effectiveTransferId = id || transfer?.id;

    // ── Load base data (branches, storages, groups) ────────────────────────
    useEffect(() => {
        if (listsFetchedRef.current) return;
        listsFetchedRef.current = true;

        Promise.all([
            getTransferGroups(),
            fetcher<BackendResponse<Branch[]>>(endpoints.branches.list).catch(() => ({
                data: [] as Branch[],
            })),
            fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(() => ({
                data: [] as Storage[],
            })),
        ])
            .then(([groupsData, branchesData, storagesData]) => {
                setGroups(Array.isArray(groupsData) ? groupsData : []);
                setBranches(Array.isArray((branchesData as any)?.data) ? (branchesData as any).data : []);
                setStorages(Array.isArray((storagesData as any)?.data) ? (storagesData as any).data : []);
            })
            .catch(console.error);
    }, [getTransferGroups]);

    // ── Auto-set branches when single branch available ─────────────────────
    useEffect(() => {
        if (!isNew) return;
        if (branches.length !== 1) return;

        const onlyBranchId = branches[0].id;
        setFormData((prev) => ({
            ...prev,
            from_branch_id: prev.from_branch_id || onlyBranchId,
            to_branch_id: prev.to_branch_id || onlyBranchId,
        }));
    }, [branches, isNew]);

    // ── Update fromStorages when fromBranch changes ────────────────────────
    useEffect(() => {
        if (!formData.from_branch_id) {
            setFromStorages([]);
            return;
        }

        const branchStorages = storages.filter((s) => s.branch_id === formData.from_branch_id);
        setFromStorages(branchStorages);

        if (!formData.from_storage_id && branchStorages.length === 1) {
            setFormData((prev) => ({ ...prev, from_storage_id: branchStorages[0].id }));
        }
    }, [formData.from_branch_id, storages]);

    // ── Update toStorages when toBranch changes ──────────────────────────
    useEffect(() => {
        if (!formData.to_branch_id) {
            setToStorages([]);
            return;
        }

        const branchStorages = storages.filter((s) => s.branch_id === formData.to_branch_id);
        setToStorages(branchStorages);

        if (!formData.to_storage_id && branchStorages.length === 1) {
            setFormData((prev) => ({ ...prev, to_storage_id: branchStorages[0].id }));
        }
    }, [formData.to_branch_id, storages]);

    // ── Load existing transfer (edit mode) ─────────────────────────────────
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
                const data = await getTransferById(id);
                if (cancelled) return;
                if (!data) {
                    toast.error(t('error.notFound'));
                    navigate(paths.warehouse.transfers.root);
                    return;
                }
                setTransfer(data);
                setFormData({
                    date: dayjs(data.date).format('YYYY-MM-DD'),
                    from_branch_id: data.from_branch_id,
                    to_branch_id: data.to_branch_id,
                    from_storage_id: data.from_storage_id,
                    to_storage_id: data.to_storage_id,
                    act_group_id: data.act_group_id,
                    status: data.status,
                    description: data.description || '',
                });
                if (data.items) {
                    lineItemsApiRef.current?.restoreFromPersisted(data.items);
                    dispatch(
                        transfersFormPickerActions.setFormState({
                            formName,
                            items: mapBatchItemsToPickerItems(data.items),
                            meta: { isNew, transferId: id ?? null, source: 'hydrate' },
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
    }, [dispatch, formName, getTransferById, id, isNew, navigate, t]);

    useEffect(
        () => () => {
            dispatch(transfersFormPickerActions.resetFormState({ formName }));
        },
        [dispatch, formName]
    );

    // ── Form field handlers ───────────────────────────────────────────────
    const handleDateChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, date: value })),
        []
    );
    const handleFromBranchChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, from_branch_id: value, from_storage_id: '' })),
        []
    );
    const handleToBranchChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, to_branch_id: value, to_storage_id: '' })),
        []
    );
    const handleFromStorageChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, from_storage_id: value })),
        []
    );
    const handleToStorageChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, to_storage_id: value })),
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
        if (!formData.from_branch_id || !formData.to_branch_id) {
            toast.error(t('transfers.branchRequired'));
            return;
        }
        if (!formData.from_storage_id || !formData.to_storage_id) {
            toast.error(t('deductions.storageRequired'));
            return;
        }
        if (!formData.act_group_id) {
            toast.error(t('deductions.groupRequired'));
            return;
        }

        const payload = {
            date: formData.date,
            from_branch_id: formData.from_branch_id,
            to_branch_id: formData.to_branch_id,
            from_storage_id: formData.from_storage_id,
            to_storage_id: formData.to_storage_id,
            act_group_id: formData.act_group_id,
            status: formData.status,
            description: formData.description,
            items: batchData,
        };

        try {
            setSubmitting(true);
            dispatch(
                transfersFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(batchData as Array<Record<string, unknown>>),
                    meta: {
                        isNew,
                        transferId: effectiveTransferId ?? null,
                        source: 'submit',
                    },
                })
            );

            if (isNew && !effectiveTransferId) {
                await createTransferBatch(payload);
                toast.success(t('transfers.created'));
                navigate(paths.warehouse.transfers.root);
            } else if (effectiveTransferId) {
                await updateTransferItemsBatch(effectiveTransferId, payload);
                toast.success(t('transfers.updated'));
                navigate(paths.warehouse.transfers.root);
            }
        } catch (error) {
            console.error('Error saving transfer:', error);
        } finally {
            setSubmitting(false);
        }
    }, [formData, isNew, effectiveTransferId, createTransferBatch, updateTransferItemsBatch, navigate, t, dispatch, formName]);

    // ── Cancel ────────────────────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        navigate(paths.warehouse.transfers.root);
    }, [navigate]);

    // ── Status options ────────────────────────────────────────────────────
    const statusOptions = useMemo(
        () => [
            { value: 'active', label: t('transfers.active') },
            { value: 'draft', label: t('transfers.draft') },
            { value: 'deleted', label: t('transfers.deleted') },
        ],
        [t]
    );

    // ── Derived ───────────────────────────────────────────────────────────
    const saveLabel = isNew
        ? t('common.save')
        : t('common.save');

    const breadcrumbs = useMemo(
        () => [
            { name: t('app'), href: paths.menu.root },
            {
                name: t('overview.warehouse.transfers'),
                href: paths.warehouse.transfers.root,
            },
            {
                name: isNew
                    ? t('transfers.new')
                    : String(transfer?.id || t('common.edit')),
                href: '',
            },
        ],
        [isNew, t, transfer?.id]
    );

    const heading = isNew
        ? t('transfers.createNew')
        : t('transfers.edit');

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

                <TransfersMetaFields
                    date={formData.date}
                    fromBranchId={formData.from_branch_id}
                    toBranchId={formData.to_branch_id}
                    fromStorageId={formData.from_storage_id}
                    toStorageId={formData.to_storage_id}
                    groupId={formData.act_group_id}
                    status={formData.status}
                    description={formData.description}
                    onDateChange={handleDateChange}
                    onFromBranchChange={handleFromBranchChange}
                    onToBranchChange={handleToBranchChange}
                    onFromStorageChange={handleFromStorageChange}
                    onToStorageChange={handleToStorageChange}
                    onGroupChange={handleGroupChange}
                    onStatusChange={handleStatusChange}
                    onDescriptionChange={handleDescriptionChange}
                    branches={branches}
                    fromStorages={fromStorages}
                    toStorages={toStorages}
                    groups={groups}
                    statusOptions={statusOptions}
                    disabled={submitting || pageLoading}
                    isOpen={isInfoOpen}
                    onToggle={() => setIsInfoOpen((v) => !v)}
                />

                <TransfersLineItems
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

                {/* Edit mode: not found state */}
                {!isNew && !transfer && !pageLoading && (
                    <Box sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                            {t('error.notFound')}
                        </Typography>
                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => navigate(paths.warehouse.transfers.root)}
                        >
                            {t('overview.warehouse.transfers')}
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
});

export default TransfersFormView;
