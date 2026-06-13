import type {
    SelectOption,
    OutgoingInvoiceFormData,
    OutgoingInvoiceBatchApiResponse,
} from '../types';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Stack,
    Paper,
    Table,
    Button,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    IconButton,
    Typography,
    TableContainer,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useOutgoingInvoicesAPI } from 'src/hooks/use-outgoing-invoices-api';

import { useAppDispatch } from 'src/store';
import {
    PICKER_FORM_NAMES,
    mapBatchItemsToPickerItems,
    outgoingInvoiceFormPickerActions,
} from 'src/store/slices/pickerFormSlices';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useIngredients } from 'src/sections/warehouse/invoice/hooks/useIngredients';

import { OutgoingInvoiceMetaFields } from './OutgoingInvoiceMetaFields';
import {
    OutgoingInvoiceLineItems,
    type OutgoingInvoiceLineItemsApi,
} from './OutgoingInvoiceLineItems';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const OutgoingInvoiceFormView = React.memo(function OutgoingInvoiceFormView() {
    const { t } = useTranslation('menu');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isNew = !id;
    const dispatch = useAppDispatch();
    const formName = PICKER_FORM_NAMES.outgoingInvoiceForm;

    // ── API hooks ─────────────────────────────────────────────────────────
    const { getDeductionGroups } = useDeductionsAPI();
    const { getStorages } = useStorageAPI();
    const {
        getOutgoingInvoiceById,
        createOutgoingInvoiceBatch,
        confirmOutgoingInvoice,
        cancelOutgoingInvoice,
        deleteOutgoingInvoice,
        deleteOutgoingInvoiceItem,
    } = useOutgoingInvoicesAPI();

    const { ingredients, loading: ingredientsLoading, refreshIngredients } = useIngredients();

    // ── State ─────────────────────────────────────────────────────────────
    const [pageLoading, setPageLoading] = useState(!isNew);
    const [submitting, setSubmitting] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(true);
    const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | 'delete' | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

    const [storages, setStorages] = useState<SelectOption[]>([]);
    const [groups, setGroups] = useState<SelectOption[]>([]);

    const [formData, setFormData] = useState<OutgoingInvoiceFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        storage_id: '',
        group_id: '',
        description: '',
    });

    const [batchResponse, setBatchResponse] = useState<OutgoingInvoiceBatchApiResponse | null>(null);
    const [hasLineItems, setHasLineItems] = useState(false);

    const [tableHeight, setTableHeight] = useState(730);

    const lineItemsApiRef = useRef<OutgoingInvoiceLineItemsApi | null>(null);
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

    // ── Ingredients map (for batch response table) ────────────────────────
    const ingredientsMap = useMemo(() => {
        const map: Record<string, string> = {};
        ingredients.forEach((ing) => {
            map[ing.id] = ing.name;
        });
        return map;
    }, [ingredients]);

    // ── Load base data (storages, groups) ─────────────────────────────────
    useEffect(() => {
        if (listsFetchedRef.current) return;
        listsFetchedRef.current = true;
        Promise.all([getStorages(), getDeductionGroups()])
            .then(([storagesData, groupsData]) => {
                setStorages(storagesData);
                setGroups(groupsData);
            })
            .catch(console.error);
    }, [getStorages, getDeductionGroups]);

    // ── Map API response to state ─────────────────────────────────────────
    const mapResponseToState = useCallback((response: OutgoingInvoiceBatchApiResponse) => {
        setBatchResponse(response);
        setFormData({
            date: dayjs(response.data.invoice.date).format('YYYY-MM-DD'),
            storage_id: response.data.invoice.storage_id,
            group_id: response.data.invoice.group_id,
            description: response.data.invoice.description || '',
        });
        const mappedItems = response.data.items.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
        }));
        lineItemsApiRef.current?.restoreFromPersisted(mappedItems);
        dispatch(
            outgoingInvoiceFormPickerActions.setFormState({
                formName,
                items: mapBatchItemsToPickerItems(mappedItems),
                meta: {
                    isNew,
                    outgoingInvoiceId: response.data.invoice.id ?? id ?? null,
                    source: 'hydrate',
                },
            })
        );
    }, [dispatch, formName, id, isNew]);

    // ── Load existing invoice (edit mode) ─────────────────────────────────
    useEffect(() => {
        if (isNew) {
            setPageLoading(false);
            return undefined;
        }

        let cancelled = false;
        const load = async () => {
            setPageLoading(true);
            try {
                const details = await getOutgoingInvoiceById(id!);
                if (cancelled) return;
                if (!details) {
                    navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                    return;
                }
                mapResponseToState(details);
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
    }, [isNew, id, getOutgoingInvoiceById, mapResponseToState, navigate, t]);

    useEffect(
        () => () => {
            dispatch(outgoingInvoiceFormPickerActions.resetFormState({ formName }));
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
    const handleDescriptionChange = useCallback(
        (value: string) => setFormData((prev) => ({ ...prev, description: value })),
        []
    );

    const handleHasItemsChange = useCallback((next: boolean) => {
        setHasLineItems(next);
    }, []);

    // ── Normalize date for API ────────────────────────────────────────────
    const normalizeDateForApi = useCallback((value: string) => {
        if (!value) return new Date().toISOString();
        if (value.includes('T')) return value;
        return `${value}T00:00:00Z`;
    }, []);

    // ── Submit (create batch) ─────────────────────────────────────────────
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
            toast.error(t('outgoingInvoices.groupRequired'));
            return;
        }

        try {
            setSubmitting(true);
            dispatch(
                outgoingInvoiceFormPickerActions.setFormState({
                    formName,
                    items: mapBatchItemsToPickerItems(batchData),
                    meta: {
                        isNew,
                        outgoingInvoiceId: id ?? batchResponse?.data?.invoice?.id ?? null,
                        source: 'submit',
                    },
                })
            );
            const response = await createOutgoingInvoiceBatch({
                date: normalizeDateForApi(formData.date),
                description: formData.description || '',
                storage_id: formData.storage_id,
                group_id: formData.group_id,
                items: batchData,
            });
            mapResponseToState(response);
        } catch (error) {
            console.error('Error submitting batch:', error);
        } finally {
            setSubmitting(false);
        }
    }, [batchResponse?.data?.invoice?.id, createOutgoingInvoiceBatch, dispatch, formData, formName, id, isNew, mapResponseToState, normalizeDateForApi, t]);

    // ── Cancel (navigate back) ────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        navigate(paths.warehouse.outgoingInvoices.root);
    }, [navigate]);

    // ── Derived ───────────────────────────────────────────────────────────
    const outgoingInvoiceId = batchResponse?.data?.invoice?.id;
    const saveLabel = isNew
        ? t('outgoingInvoices.saveInvoice')
        : t('common.save');

    const breadcrumbs = useMemo(
        () => [
            { name: t('overview.operations.title'), href: paths.operations.invoices.root },
            {
                name: t('overview.warehouse.expensesInvoices'),
                href: paths.warehouse.outgoingInvoices.root,
            },
            {
                name: isNew
                    ? t('common.create')
                    : t('common.edit'),
                href: '',
            },
        ],
        [isNew, t]
    );

    const heading = isNew
        ? t('outgoingInvoices.create')
        : t('outgoingInvoices.view');

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <Box sx={{ px: { xs: 1.5, md: 2 }, m: 0, alignItems: 'center' }}>
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
                        <CircularProgress color="primary" />
                    </Box>
                )}

                <OutgoingInvoiceMetaFields
                    date={formData.date}
                    storageId={formData.storage_id}
                    groupId={formData.group_id}
                    description={formData.description}
                    onDateChange={handleDateChange}
                    onStorageChange={handleStorageChange}
                    onGroupChange={handleGroupChange}
                    onDescriptionChange={handleDescriptionChange}
                    storages={storages}
                    groups={groups}
                    disabled={submitting || pageLoading}
                    isOpen={isInfoOpen}
                    onToggle={() => setIsInfoOpen((v) => !v)}
                />

                {/* Show item picker when no batch response yet (creating / editing items) */}
                {!batchResponse && (
                    <OutgoingInvoiceLineItems
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
                )}

                {/* Show batch response items (after save) */}
                {batchResponse && (
                    <BatchResponseView
                        batchResponse={batchResponse}
                        ingredientsMap={ingredientsMap}
                        outgoingInvoiceId={outgoingInvoiceId}
                        deletingItemId={deletingItemId}
                        actionLoading={actionLoading}
                        onDeleteItem={async (itemId: string) => {
                            if (!outgoingInvoiceId) return;
                            try {
                                setDeletingItemId(itemId);
                                await deleteOutgoingInvoiceItem(outgoingInvoiceId, itemId);
                                const details = await getOutgoingInvoiceById(outgoingInvoiceId);
                                if (details) mapResponseToState(details);
                            } finally {
                                setDeletingItemId(null);
                            }
                        }}
                        onConfirm={async () => {
                            if (!outgoingInvoiceId) return;
                            try {
                                setActionLoading('confirm');
                                await confirmOutgoingInvoice(outgoingInvoiceId);
                                navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                            } finally {
                                setActionLoading(null);
                            }
                        }}
                        onCancelInvoice={async () => {
                            if (!outgoingInvoiceId) return;
                            try {
                                setActionLoading('cancel');
                                await cancelOutgoingInvoice(outgoingInvoiceId);
                                navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                            } finally {
                                setActionLoading(null);
                            }
                        }}
                        onDelete={async () => {
                            if (!outgoingInvoiceId) return;
                            const confirmed = window.confirm(
                                t('common.deleteConfirmMessage')
                            );
                            if (!confirmed) return;
                            try {
                                setActionLoading('delete');
                                await deleteOutgoingInvoice(outgoingInvoiceId);
                                navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                            } finally {
                                setActionLoading(null);
                            }
                        }}
                    />
                )}

                {/* Edit mode: not found state */}
                {!isNew && !batchResponse && !pageLoading && (
                    <Box sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                            {t('outgoingInvoices.notFound')}
                        </Typography>
                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => navigate(paths.warehouse.outgoingInvoices.root)}
                        >
                            {t('overview.warehouse.expensesInvoices')}
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
});

export default OutgoingInvoiceFormView;

// ---------------------------------------------------------------------------
// Batch response sub-component (shown after successful save)
// ---------------------------------------------------------------------------

interface BatchResponseViewProps {
    batchResponse: OutgoingInvoiceBatchApiResponse;
    ingredientsMap: Record<string, string>;
    outgoingInvoiceId?: string;
    deletingItemId: string | null;
    actionLoading: 'confirm' | 'cancel' | 'delete' | null;
    onDeleteItem: (itemId: string) => Promise<void>;
    onConfirm: () => Promise<void>;
    onCancelInvoice: () => Promise<void>;
    onDelete: () => Promise<void>;
}

const BatchResponseView = React.memo(function BatchResponseView({
    batchResponse,
    ingredientsMap,
    outgoingInvoiceId,
    deletingItemId,
    actionLoading,
    onDeleteItem,
    onConfirm,
    onCancelInvoice,
    onDelete,
}: BatchResponseViewProps) {
    const { t } = useTranslation('menu');

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    {t('outgoingInvoices.items')}
                </Typography>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>{t('warehouse.ingredient')}</TableCell>
                                <TableCell>{t('calculation.quantity')}</TableCell>
                                <TableCell>
                                    {t('outgoingInvoices.pricePerUnit')}
                                </TableCell>
                                <TableCell>
                                    {t('outgoingInvoices.totalAmount')}
                                </TableCell>
                                <TableCell>
                                    {t('outgoingInvoices.stockBefore')}
                                </TableCell>
                                <TableCell>
                                    {t('outgoingInvoices.stockAfter')}
                                </TableCell>
                                <TableCell align="right">
                                    {t('common.actions')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {batchResponse.data.items.map((item, index) => (
                                <TableRow key={item.id || `${item.ingredient_id}-${index}`}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {ingredientsMap[item.ingredient_id] || item.ingredient_id}
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.price_per_unit}</TableCell>
                                    <TableCell>{item.total_amount}</TableCell>
                                    <TableCell>{item.stock_before}</TableCell>
                                    <TableCell>{item.stock_after}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="error"
                                            size="small"
                                            disabled={
                                                !outgoingInvoiceId || deletingItemId === item.id
                                            }
                                            onClick={() => onDeleteItem(item.id)}
                                        >
                                            {deletingItemId === item.id ? (
                                                <CircularProgress size={16} color="inherit" />
                                            ) : (
                                                <DeleteIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent="flex-end"
                sx={{ mb: 2 }}
            >
                <Button
                    variant="contained"
                    color="success"
                    disabled={!outgoingInvoiceId || !!actionLoading}
                    onClick={onConfirm}
                >
                    {actionLoading === 'confirm' ? (
                        <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                    ) : (
                        t('common.confirm')
                    )}
                </Button>
                <Button
                    variant="contained"
                    color="warning"
                    disabled={!outgoingInvoiceId || !!actionLoading}
                    onClick={onCancelInvoice}
                >
                    {actionLoading === 'cancel' ? (
                        <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                    ) : (
                        t('common.cancel')
                    )}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    disabled={!outgoingInvoiceId || !!actionLoading}
                    onClick={onDelete}
                >
                    {actionLoading === 'delete' ? (
                        <CircularProgress size={18} sx={{ color: 'var(--accent-fg)' }} />
                    ) : (
                        t('common.delete')
                    )}
                </Button>
            </Stack>
        </Box>
    );
});
