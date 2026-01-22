import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import { useCallback } from 'react';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useTranslate } from 'src/locales';
import { GenericEditView } from 'src/components/generic-edit-view';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { Box } from '@mui/material';

export function InvoicesEditView({ isNew = false }: { isNew?: boolean }) {
    const { t } = useTranslate('menu');
    const router = useRouter();
    const { createInvoice, updateInvoice } = useInvoiceAPI();

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.supplier_name) {
                    throw new Error(t('warehouse.invoices.supplierNameRequired'));
                }

                if (isNew) {
                    const newInvoice = await createInvoice(formData);
                    router.push(paths.warehouse.invoices.edit(newInvoice.id));
                } else {
                    // For edit, we need to get the ID from somewhere
                    // This is handled by GenericEditView through the page wrapper
                    await updateInvoice(formData.id, formData);
                }

                router.push(paths.warehouse.invoices.root);
            } catch (error) {
                console.error('Error saving invoice:', error);
                throw error;
            }
        },
        [isNew, createInvoice, updateInvoice, router]
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
                type: 'number',
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
            <GenericEditView config={config} isNew={isNew} />
        </Box>
    );
}