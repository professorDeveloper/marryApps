import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { toast } from 'sonner';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';
import { GenericEditView } from 'src/components/generic-edit-view';

export function InvoiceDetailsEditView({ isNew = false }: { isNew?: boolean }) {
    const { id } = useParams<{ id?: string }>();
    const router = useRouter();
    const {
        createInvoiceDetail,
        updateInvoiceDetail,
        getInvoiceDetails,
        getInvoices,
        getIngredients,
    } = useInvoiceDetailsAPI();

    const [invoiceOptions, setInvoiceOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [ingredientOptions, setIngredientOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [invoices, ingredients] = await Promise.all([getInvoices(), getIngredients()]);

                setInvoiceOptions(
                    invoices.map((inv) => ({
                        value: inv.id,
                        label: `${inv.supplier_name} - ${new Date(inv.date).toLocaleDateString()}`,
                    }))
                );

                setIngredientOptions(
                    ingredients.map((ing) => ({
                        value: ing.id,
                        label: ing.name,
                    }))
                );
            } finally {
                setLoading(false);
            }
        };

        loadOptions();
    }, [getInvoices, getIngredients]);

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.invoice_id) {
                    toast.error('Please select an invoice');
                    return;
                }

                if (!formData.ingredient_id) {
                    toast.error('Please select an ingredient');
                    return;
                }

                if (!formData.quantity || formData.quantity <= 0) {
                    toast.error('Quantity must be greater than 0');
                    return;
                }

                if (!formData.price_per_unit || formData.price_per_unit <= 0) {
                    toast.error('Price per unit must be greater than 0');
                    return;
                }

                // Calculate total price: quantity * price_per_unit
                const totalPrice = (formData.quantity * formData.price_per_unit).toString();

                const dataToSend = {
                    ingredient_id: formData.ingredient_id,
                    invoice_id: formData.invoice_id,
                    quantity: formData.quantity,
                    price_per_unit: formData.price_per_unit.toString(),
                    price: totalPrice,
                };

                if (isNew) {
                    await createInvoiceDetail(dataToSend);
                    toast.success('Kirim successfully created');
                } else if (id) {
                    await updateInvoiceDetail(id, dataToSend);
                    toast.success('Kirim successfully updated');
                }

                router.push(paths.menu.warehouse.invoiceDetails.root);
            } catch (error) {
                console.error('Error saving detail:', error);
            }
        },
        [id, isNew, createInvoiceDetail, updateInvoiceDetail, router]
    );

    const BASIC: CardSection = {
        id: 'basic',
        title: 'Kirim ma\'lumotlari',
        columns: 2,
        fields: [
            {
                key: 'invoice_id',
                label: 'Yetkazib beruvchi',
                type: 'select',
                required: true,
                options: invoiceOptions,
            },
            {
                key: 'ingredient_id',
                label: 'Mahsulot',
                type: 'select',
                required: true,
                options: ingredientOptions,
            },
            {
                key: 'quantity',
                label: 'Miqdori',
                type: 'number',
                required: true,
                defaultValue: 1,
            },
            {
                key: 'price_per_unit',
                label: 'Birlik narxi (UZS)',
                type: 'number',
                required: true,
                defaultValue: 0,
            },
        ],
    };

    const config: GenericEditViewConfig = {
        title: isNew ? 'Yangi Kirim qo\'shash' : 'Kirimni tahrirlash',
        entityName: 'kirim',
        breadcrumbs: [
            { name: 'Menu', href: paths.menu.root },
            { name: 'Warehouse', href: paths.menu.warehouse.root },
            { name: 'Kirimlar', href: paths.menu.warehouse.invoiceDetails.root },
            { name: isNew ? 'Yangi' : 'Tahrirlash', href: '' },
        ],
        sections: [BASIC],
        onSubmit: handleSubmit,
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return <GenericEditView config={config} isNew={isNew} />;
}
