import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useTranslate } from 'src/locales';
import { GenericEditView } from 'src/components/generic-edit-view';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useStorageAPI } from 'src/hooks/use-storage-api';
import { Box, CircularProgress } from '@mui/material';
import { toast } from 'sonner';

interface InvoiceInfoEditViewProps {
    isNew?: boolean;
    onInvoiceSubmit?: (formData: Record<string, any>, detailsData?: any[]) => void; // For batch flow
    onInvoiceCreated?: (invoiceId: string) => void;
    onInvoiceDataChange?: (formData: Record<string, any>) => void; // For batch flow
    detailsData?: any[]; // Details to include in batch
    currentInvoiceId?: string | null;
    skipRedirect?: boolean;
    useBatchFlow?: boolean; // If true, don't create invoice, just collect data
    onFormDataChange?: (formData: Record<string, any>) => void; // Callback to persist form data in parent
    persistedFormData?: Record<string, any>; // Form data from parent to restore
    onSwitchToDetailsTab?: () => void; // Callback to switch to details tab when validation fails
}

const ALLOWED_STATUSES = ['pending', 'draft', 'deleted'] as const;
type InvoiceStatus = (typeof ALLOWED_STATUSES)[number];
const normalizeStatus = (value: unknown): InvoiceStatus =>
    ALLOWED_STATUSES.includes(value as InvoiceStatus) ? (value as InvoiceStatus) : 'pending';

export function InvoiceInfoEditView({
    isNew = false,
    onInvoiceCreated,
    onInvoiceDataChange,
    onInvoiceSubmit,
    detailsData,
    currentInvoiceId,
    skipRedirect = false,
    useBatchFlow = false,
    onFormDataChange,
    persistedFormData,
    onSwitchToDetailsTab,
}: InvoiceInfoEditViewProps) {
    const { t } = useTranslate('menu');
    const router = useRouter();
    const { id: urlId } = useParams<{ id?: string }>();
    const { createInvoice, updateInvoice, deleteInvoice } = useInvoiceAPI();
    const { getSuppliers } = useSupplierAPI();
    const { getStorages } = useStorageAPI();
    const [invoiceData, setInvoiceData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [storages, setStorages] = useState<any[]>([]);
    const [internalFormData, setInternalFormData] = useState<Record<string, any>>(persistedFormData || {
        supplier_id: '',
        storage_id: '',
        date: new Date().toISOString(),
        status: 'pending',
        total_amount: '',
    });

    // Load suppliers for dropdown
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const data = await getSuppliers();
                setSuppliers(
                    Array.isArray(data) ? data.filter((item) => item && item.id != null) : []
                );
            } catch (error) {
                console.error('Error loading suppliers:', error);
            }
        };

        loadSuppliers();
    }, [getSuppliers]);

    // Load storages for dropdown
    useEffect(() => {
        const loadStorages = async () => {
            try {
                const data = await getStorages();
                setStorages(
                    Array.isArray(data) ? data.filter((item) => item && item.id != null) : []
                );
            } catch (error) {
                console.error('Error loading storages:', error);
            }
        };

        loadStorages();
    }, [getStorages]);

    // Update internal form data when persisted data changes
    useEffect(() => {
        if (persistedFormData && Object.keys(persistedFormData).length > 0) {
            setInternalFormData(persistedFormData);
        }
    }, [persistedFormData]);

    useEffect(() => {
        setLoading(false);
    }, [isNew, urlId, currentInvoiceId]);

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.supplier_id) {
                    const errorMsg = t('warehouse.invoices.supplierRequired');
                    toast.error(errorMsg);
                    throw new Error(errorMsg);
                }
                if (!formData.storage_id) {
                    const errorMsg = t('warehouse.invoices.storageRequired', 'Storage is required');
                    toast.error(errorMsg);
                    throw new Error(errorMsg);
                }

                // If using batch flow with details, call the batch submit handler
                if (onInvoiceSubmit && detailsData && detailsData.length > 0) {
                    await onInvoiceSubmit({
                        supplier_id: formData.supplier_id,
                        storage_id: formData.storage_id,
                        total_amount: formData.total_amount?.toString() || '0',
                        status: normalizeStatus(formData.status),
                        date: formData.date || new Date().toISOString(),
                    }, detailsData);
                    return;
                }

                // If using batch flow but no details, show error and redirect to details tab
                if (useBatchFlow && (!detailsData || detailsData.length === 0)) {
                    const errorMsg = t('warehouse.invoiceDetails.addAtLeastOneItem');
                    toast.error(errorMsg);
                    // Switch to details tab
                    if (onSwitchToDetailsTab) {
                        onSwitchToDetailsTab();
                    }
                    throw new Error(errorMsg);
                }

                // If using batch flow, just pass data up to parent without creating invoice
                if (useBatchFlow && onInvoiceDataChange) {
                    onInvoiceDataChange({
                        supplier_id: formData.supplier_id,
                        storage_id: formData.storage_id,
                        total_amount: formData.total_amount?.toString() || '0',
                        status: normalizeStatus(formData.status),
                        date: formData.date || new Date().toISOString(),
                    });
                    return;
                }

                // Otherwise, create invoice normally
                if (isNew) {
                    const newInvoice = await createInvoice({
                        supplier_id: formData.supplier_id,
                        storage_id: formData.storage_id,
                        total_amount: formData.total_amount?.toString() || '0',
                        status: normalizeStatus(formData.status),
                        date: formData.date || new Date().toISOString(),
                    });
                    toast.success(t('warehouse.invoices.created'));
                    // Call callback if provided (for tab component)
                    if (onInvoiceCreated) {
                        onInvoiceCreated(newInvoice.id);
                    }
                    // Only redirect if not in tab mode
                    if (!skipRedirect && !onInvoiceCreated) {
                        router.push(paths.warehouse.invoiceDetails.root);
                    }
                }
                if (!isNew) {
                    const invoiceId = currentInvoiceId || urlId;
                    if (!invoiceId) {
                        throw new Error('Invoice ID is required');
                    }
                    await updateInvoice(invoiceId, {
                        supplier_id: formData.supplier_id,
                        storage_id: formData.storage_id,
                        total_amount: formData.total_amount?.toString() || '0',
                        status: normalizeStatus(formData.status),
                        date: formData.date || new Date().toISOString(),
                    });
                    toast.success(t('common.updateSuccess'));
                }

                if (!onInvoiceCreated && !skipRedirect) {
                    router.push(paths.warehouse.invoiceDetails.root);
                }
            } catch (error) {
                console.error('Error saving invoice:', error);
                throw error;
            }
        },
        [isNew, useBatchFlow, createInvoice, updateInvoice, router, onInvoiceCreated, onInvoiceDataChange, onInvoiceSubmit, detailsData, skipRedirect, currentInvoiceId, urlId, t, onSwitchToDetailsTab]
    );

    const BASIC: CardSection = {
        id: 'basic',
        title: t('warehouse.invoices.info'),
        columns: 2,
        fields: [
            {
                key: 'supplier_id',
                label: t('warehouse.invoices.supplier'),
                type: 'select',
                required: true,
                defaultValue: '',
                options: suppliers
                    .filter((s) => s && s.id != null)
                    .map((s) => ({ value: s.id, label: s.name ?? '' })),
            },
            {
                key: 'storage_id',
                label: t('warehouse.storages.title', 'Storage'),
                type: 'select',
                required: true,
                defaultValue: '',
                options: storages
                    .filter((s) => s && s.id != null)
                    .map((s) => ({ value: s.id, label: s.name ?? '' })),
            },
            {
                key: 'date',
                label: t('warehouse.invoices.date'),
                type: 'text',
                required: true,
                defaultValue: new Date().toISOString()
            },
            {
                key: 'status',
                label: t('warehouse.invoices.status'),
                type: 'select',
                required: true,
                defaultValue: 'pending',
                options: [
                    { value: 'pending', label: t('warehouse.invoices.statuses.pending') },
                    { value: 'draft', label: t('common.draft', 'Draft') },
                    { value: 'deleted', label: t('common.deleted', 'Deleted') },
                ],
            },
            // {
            //     key: 'total_amount',
            //     label: t('warehouse.invoices.totalAmount'),
            //     type: 'text',
            //     required: true,
            //     defaultValue: '',
            // },
        ],
    };

    const config: GenericEditViewConfig = {
        title: isNew ? t('warehouse.invoices.addNew') : t('warehouse.invoices.edit'),
        entityName: t('warehouse.invoices.title').toLowerCase(),
        breadcrumbs: [
            { name: t('overview.menu.title'), href: paths.menu.root },
            { name: t('warehouse.title'), href: paths.warehouse.root },
            { name: t('warehouse.invoices.title'), href: paths.warehouse.invoices.root },
        ],
        sections: [BASIC],
        onSubmit: handleSubmit,
        onDelete: async () => {
            const invoiceId = currentInvoiceId || urlId;
            if (!invoiceId) {
                throw new Error('Invoice ID is required');
            }
            await deleteInvoice(invoiceId);
            toast.success(t('common.deleteSuccess'));
            router.push(paths.warehouse.invoiceDetails.root);
        },
    };

    // Use persisted form data if available, otherwise use invoice data
    const dataToPass = useBatchFlow && persistedFormData && Object.keys(persistedFormData).some(k => persistedFormData[k])
        ? persistedFormData
        : (invoiceData || undefined);

    // Handler for form data changes from GenericEditView
    const handleFormChange = useCallback(
        (newFormData: Record<string, any>) => {
            setInternalFormData(newFormData);
            if (onFormDataChange) {
                onFormDataChange(newFormData);
            }
        },
        [onFormDataChange]
    );

    return (
        <Box>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <GenericEditView
                    config={config}
                    isNew={isNew}
                    data={dataToPass || internalFormData}
                    formData={internalFormData}
                    onFormDataChange={handleFormChange}
                />
            )}
        </Box>
    );
}
