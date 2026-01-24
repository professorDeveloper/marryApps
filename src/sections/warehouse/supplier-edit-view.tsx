import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useTranslate } from 'src/locales';
import { GenericEditView } from 'src/components/generic-edit-view';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { Box, CircularProgress } from '@mui/material';

interface InvoicesEditViewProps {
    isNew?: boolean;
    onInvoiceCreated?: (invoiceId: string) => void;
    currentInvoiceId?: string | null;
    skipRedirect?: boolean;
}

export function InvoicesEditView({
    isNew = false,
    onInvoiceCreated,
    currentInvoiceId,
    skipRedirect = false,
}: InvoicesEditViewProps) {
    const { t } = useTranslate('menu');
    const router = useRouter();
    const { id: urlId } = useParams<{ id?: string }>();
    const { createInvoice, updateInvoice, getInvoiceById } = useInvoiceAPI();
    const [invoiceData, setInvoiceData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(!isNew);

    // Load invoice data when editing
    useEffect(() => {
        const loadInvoiceData = async () => {
            try {
                const invoiceId = currentInvoiceId || urlId;
                if (!isNew && invoiceId && getInvoiceById) {
                    const data = await getInvoiceById(invoiceId);
                    setInvoiceData(data);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error loading invoice data:', error);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        loadInvoiceData();
    }, [isNew, urlId, currentInvoiceId, getInvoiceById]);

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.supplier_name) {
                    throw new Error(t('warehouse.invoices.supplierNameRequired'));
                }

                if (isNew) {
                    const newInvoice = await createInvoice(formData);
                    // Call callback if provided (for tab component)
                    if (onInvoiceCreated) {
                        onInvoiceCreated(newInvoice.id);
                    }
                    // Only redirect if not in tab mode
                    if (!skipRedirect && !onInvoiceCreated) {
                        router.push(paths.warehouse.invoices.edit(newInvoice.id));
                    }
                } else {
                    const invoiceIdToUpdate = currentInvoiceId || urlId;
                    if (invoiceIdToUpdate) {
                        await updateInvoice(invoiceIdToUpdate, formData);
                    }
                    if (!skipRedirect) {
                        router.push(paths.warehouse.invoices.root);
                    }
                }

                if (!onInvoiceCreated && !skipRedirect) {
                    router.push(paths.warehouse.invoices.root);
                }
            } catch (error) {
                console.error('Error saving invoice:', error);
                throw error;
            }
        },
        [isNew, createInvoice, updateInvoice, router, onInvoiceCreated, skipRedirect, currentInvoiceId, urlId, t]
    );

    const BASIC: CardSection = {
        id: 'basic',
        title: t('warehouse.invoices.supplierInfo'),
        columns: 2,
        fields: [
            {
                key: 'supplier_name',
                label: t('warehouse.invoices.supplierName'),
                type: 'text',
                required: true,
                defaultValue: '',
            },
            {
                key: 'supplier_phone',
                label: t('warehouse.invoices.phoneNumber'),
                type: 'text',
                defaultValue: '',
            },
            {
                key: 'supplier_email',
                label: t('warehouse.invoices.email'),
                type: 'text',
                defaultValue: '',
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
                    { value: 'completed', label: t('warehouse.invoices.statuses.completed') },
                    { value: 'cancelled', label: t('warehouse.invoices.statuses.cancelled') },
                ],
            },
            {
                key: 'total_amount',
                label: t('warehouse.invoices.totalAmount'),
                type: 'text',
                required: true,
            },
        ],
    };

    const config: GenericEditViewConfig = {
        title: isNew ? t('warehouse.invoices.addNew') : t('warehouse.invoices.edit'),
        entityName: t('warehouse.invoices.title').toLowerCase(),
        breadcrumbs: [
            { name: t('menu'), href: paths.menu.root },
            { name: t('warehouse.title'), href: paths.warehouse.root },
            { name: t('warehouse.invoices.title'), href: paths.warehouse.invoices.root },
            // { name: isNew ? t('common.new') : t('common.edit'), href: '' },
        ],
        sections: [BASIC],
        onSubmit: handleSubmit,
    };

    return (
        <Box sx={{ pl: 4, pt: 3 }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <GenericEditView config={config} isNew={isNew} data={invoiceData || undefined} />
            )}
        </Box>
    );
}