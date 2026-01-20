import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';

export function InvoicesEditView({ isNew = false }: { isNew?: boolean }) {
    const router = useRouter();
    const { createInvoice, updateInvoice } = useInvoiceAPI();

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.supplier_name) {
                    throw new Error('Supplier name is required');
                }

                if (isNew) {
                    const newInvoice = await createInvoice(formData);
                    router.push(paths.menu.warehouse.invoices.edit(newInvoice.id));
                } else {
                    // For edit, we need to get the ID from somewhere
                    // This is handled by GenericEditView through the page wrapper
                    await updateInvoice(formData.id, formData);
                }

                router.push(paths.menu.warehouse.invoices.root);
            } catch (error) {
                console.error('Error saving invoice:', error);
                throw error;
            }
        },
        [isNew, createInvoice, updateInvoice, router]
    );

    const BASIC: CardSection = {
        id: 'basic',
        title: 'Yetkazib beruvchi ma\'lumotlari',
        columns: 2,
        fields: [
            {
                key: 'supplier_name',
                label: 'Yetkazib beruvchi nomi',
                type: 'text',
                required: true,
                defaultValue: '',
            },
            {
                key: 'supplier_phone',
                label: 'Telefon raqami',
                type: 'text',
                defaultValue: '',
            },
            {
                key: 'supplier_email',
                label: 'Email',
                type: 'text',
                defaultValue: '',
            },
            {
                key: 'date',
                label: 'Sana',
                type: 'text',
                required: true,
                defaultValue: new Date().toISOString()
            },
            {
                key: 'status',
                label: 'Holati',
                type: 'select',
                required: true,
                defaultValue: 'pending',
                options: [
                    { value: 'pending', label: 'Kutilmoqda' },
                    { value: 'completed', label: 'Tamomlandi' },
                    { value: 'cancelled', label: 'Bekor qilindi' },
                ],
            },
            {
                key: 'total_amount',
                label: 'Jami summa (UZS)',
                type: 'number',
                required: true,
                defaultValue: '0',
            },
        ],
    };

    const config: GenericEditViewConfig = {
        title: isNew ? 'Yangi kirim qo\'shash' : 'Kirimni tahrirlash',
        entityName: 'invoice',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Warehouse', href: paths.menu.warehouse.root },
            { name: 'Invoices', href: paths.menu.warehouse.invoices.root },
            { name: isNew ? 'Yangi' : 'Tahrirlash', href: '' },
        ],
        sections: [BASIC],
        onSubmit: handleSubmit,
    };

    return <GenericEditView config={config} isNew={isNew} />;
}
