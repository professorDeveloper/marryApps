import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';

import { Box, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useTranslationsAPI } from 'src/hooks/use-translations-api';

import { useTranslate } from 'src/locales';

import { GenericEditView } from 'src/components/generic-edit-view';

interface SupplierEditViewProps {
    isNew?: boolean;
    onSupplierCreated?: (supplierId: string) => void;
    currentSupplierId?: string | null;
    skipRedirect?: boolean;
}

export function SupplierEditView({
    isNew = false,
    onSupplierCreated,
    currentSupplierId,
    skipRedirect = false,
}: SupplierEditViewProps) {
    const { t } = useTranslate('menu');
    const router = useRouter();
    const { id: urlId } = useParams<{ id?: string }>();
    const { createSupplier, getSupplierById, updateSupplier, deleteSuppliers } = useSupplierAPI();
    const { createTranslation, updateTranslation } = useTranslationsAPI();
    const [supplierData, setSupplierData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState(false);

    // Load supplier data when editing
    useEffect(() => {
        const loadSupplier = async () => {
            const supplierId = urlId || currentSupplierId;
            if (supplierId && !isNew) {
                setLoading(true);
                try {
                    const supplier = await getSupplierById(supplierId);
                    if (supplier) {
                        setSupplierData(supplier);
                    }
                } catch (error) {
                    console.error('Error loading supplier:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        loadSupplier();
    }, [isNew, urlId, currentSupplierId, getSupplierById]);

    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                if (!formData.name) {
                    throw new Error(t('warehouse.suppliers.nameRequired'));
                }

                // Create or update translation if translations are provided
                let name_i18n = formData.name_i18n;
                if (formData.name_en || formData.name_ru) {
                    const translationData: any = {
                        en: formData.name_en || formData.name || '',
                        ru: formData.name_ru || formData.name || '',
                        uz: formData.name || '', // Primary name is always Uzbek
                    };

                    if (name_i18n) {
                        // Update existing translation
                        await updateTranslation(name_i18n, translationData);
                    } else {
                        // Create new translation
                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    }
                }

                const payload = {
                    name: String(formData.name).trim(),
                    name_i18n,
                    phone_number: formData.phone_number || null,
                    email: formData.email || null,
                    address: formData.address || null,
                };

                if (isNew) {
                    const newSupplier = await createSupplier(payload);
                    // Call callback if provided (for tab component)
                    if (onSupplierCreated) {
                        onSupplierCreated(newSupplier.id);
                    }
                    // Only redirect if not in tab mode
                    if (!skipRedirect && !onSupplierCreated) {
                        router.push(paths.warehouse.suppliers.root);
                    }
                } else {
                    // Update mode
                    const supplierId = urlId || currentSupplierId;
                    if (supplierId) {
                        await updateSupplier(supplierId, payload);
                        if (!skipRedirect) {
                            router.push(paths.warehouse.suppliers.root);
                        }
                    }
                }

                if (!onSupplierCreated && !skipRedirect) {
                    router.push(paths.warehouse.suppliers.root);
                }
            } catch (error) {
                console.error('Error saving supplier:', error);
                throw error;
            }
        },
        [isNew, createSupplier, updateSupplier, router, onSupplierCreated, skipRedirect, currentSupplierId, urlId, t, createTranslation, updateTranslation]
    );

    const BASIC: CardSection = {
        id: 'basic',
        title: t('warehouse.suppliers.info'),
        columns: 1,
        fields: [
            {
                key: 'name',
                label: t('warehouse.suppliers.name'),
                type: 'text',
                required: true,
                defaultValue: '',
            },
            {
                key: 'name_en',
                label: t('warehouse.nameEn', 'Name (English)'),
                type: 'text',
                required: false,
                defaultValue: '',
            },
            {
                key: 'name_ru',
                label: t('warehouse.nameRu', 'Name (Russian)'),
                type: 'text',
                required: false,
                defaultValue: '',
            },
            {
                key: 'phone_number',
                label: t('warehouse.suppliers.phoneNumber'),
                type: 'text',
                defaultValue: '',
            },
            {
                key: 'email',
                label: t('warehouse.suppliers.email'),
                type: 'email',
                defaultValue: '',
            },
            {
                key: 'address',
                label: t('warehouse.suppliers.address'),
                type: 'text',
                defaultValue: '',
            },
        ],
    };

    const config: GenericEditViewConfig = {
        title: isNew ? t('warehouse.suppliers.addNew') : t('warehouse.suppliers.edit'),
        entityName: t('warehouse.suppliers.title').toLowerCase(),
        breadcrumbs: [
            { name: t('menu'), href: paths.menu.root },
            { name: t('warehouse.title'), href: paths.warehouse.root },
            { name: t('warehouse.suppliers.title'), href: paths.warehouse.suppliers.root },
        ],
        sections: [BASIC],
        onSubmit: handleSubmit,
        onDelete: async () => {
            const supplierId = urlId || currentSupplierId;
            if (!supplierId) {
                throw new Error('Supplier ID is required');
            }
            await deleteSuppliers([supplierId]);
            router.push(paths.warehouse.suppliers.root);
        },
    };

    return (
        <Box sx={{ pl: 4, pt: 3 }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <GenericEditView config={config} isNew={isNew} data={supplierData || undefined} />
            )}
        </Box>
    );
}
