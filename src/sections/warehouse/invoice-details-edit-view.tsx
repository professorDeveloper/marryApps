import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { toast } from 'sonner';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useInvoiceDetailsAPI } from 'src/hooks/use-invoice-details-api';
import { GenericEditView } from 'src/components/generic-edit-view';
import { useTranslate } from 'src/locales';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

export function InvoiceDetailsEditView({ isNew = false }: { isNew?: boolean }) {
    const { t } = useTranslate('menu');
    const { id } = useParams<{ id?: string }>();
    const router = useRouter();
    const {
        createInvoiceDetail,
        updateInvoiceDetail,
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
                    toast.error(t('warehouse.invoiceDetails.selectSupplier'));
                    return;
                }

                if (!formData.ingredient_id) {
                    toast.error(t('warehouse.invoiceDetails.selectProduct'));
                    return;
                }

                if (!formData.quantity || formData.quantity <= 0) {
                    toast.error(t('warehouse.invoiceDetails.quantityRequired'));
                    return;
                }

                if (!formData.price_per_unit || formData.price_per_unit <= 0) {
                    toast.error(t('warehouse.invoiceDetails.priceRequired'));
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
                    toast.success(t('warehouse.invoiceDetails.createdSuccess'));
                } else if (id) {
                    await updateInvoiceDetail(id, dataToSend);
                    toast.success(t('warehouse.invoiceDetails.updatedSuccess'));
                }

                router.push(paths.warehouse.invoiceDetails.root);
            } catch (error) {
                console.error('Error saving detail:', error);
            }
        },
        [id, isNew, createInvoiceDetail, updateInvoiceDetail, router]
    );

    const BASIC: CardSection = {
        id: 'basic',
        title: t('warehouse.invoiceDetails.title'),
        columns: 2,
        fields: [
            {
                key: 'invoice_id',
                label: t('warehouse.invoiceDetails.supplier'),
                type: 'select',
                required: true,
                options: invoiceOptions,
                placeholder: t('warehouse.invoiceDetails.selectSupplier'),
            },
            {
                key: 'ingredient_id',
                label: t('warehouse.invoiceDetails.product'),
                type: 'select',
                required: true,
                options: ingredientOptions,
                placeholder: t('warehouse.invoiceDetails.selectProduct'),
            },
            {
                key: 'quantity',
                label: t('warehouse.invoiceDetails.quantity'),
                type: 'number',
                required: true,
                defaultValue: 1,
            },
            {
                key: 'price_per_unit',
                label: t('warehouse.invoiceDetails.unitPrice'),
                type: 'number',
                required: true,
            },
        ],
    };

    const config: GenericEditViewConfig = {
        title: isNew ? t('warehouse.invoiceDetails.addNew') : t('warehouse.invoiceDetails.editEntry'),
        entityName: t('warehouse.invoiceDetails.title').toLowerCase(),
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('menu'), href: paths.menu.root },
            { name: t('warehouse.title'), href: paths.warehouse.root },
            { name: t('warehouse.invoiceDetails.entries'), href: paths.warehouse.invoiceDetails.root },
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

    return (
        <Box sx={{ pl: 4, pt: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* BREADCRUMBS AND TITLE */}
                <CustomBreadcrumbs
                    heading={isNew ? t('warehouse.invoiceDetails.addNew') : t('warehouse.invoiceDetails.editEntry')}
                    links={config.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                <GenericEditView
                    config={config}
                    isNew={isNew}
                />
            </Box>
        </Box>
    );
}