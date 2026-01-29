import type { TFunction } from 'i18next';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Tab, Tabs, Stack } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslationsAPI } from 'src/hooks/use-translations-api';
import { useGetCompound, useDeleteCompound, useUpdateCompound, useCreateCompoundWithCalculations } from 'src/hooks/use-compounds';

import { useGetDepartments } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import ProductCalculator from 'src/components/generic-edit-view/edit-calculation';

export interface CompoundEditViewProps {
    compoundId?: string;
    isNew?: boolean;
}

const IMAGE_SECTION: CardSection = {
    id: 'image',
    title: 'semifinishedProducts.imageTitle',
    fields: [
        {
            key: 'picture_url',
            label: 'semifinishedProducts.imageUrl',
            type: 'url',
            placeholder: 'https://example.com/image.jpg',
            defaultValue: '',
        },
    ],
};

const BASIC_INFO_SECTION: CardSection = {
    id: 'basic',
    title: 'semifinishedProducts.basicTitle',
    columns: 1,
    fields: [
        {
            key: 'name',
            label: 'semifinishedProducts.name',
            type: 'text',
            required: true,
            defaultValue: '',
            // helperText: 'Asosiy nomi Uzbek tilida kiritiladi va translation uz fieldiga avtomatik yuboriladi',
        },
        {
            key: 'name_en',
            label: 'semifinishedProducts.nameEn',
            type: 'text',
            required: false,
            defaultValue: '',
        },
        {
            key: 'name_ru',
            label: 'semifinishedProducts.nameRu',
            type: 'text',
            required: false,
            defaultValue: '',
        },
        {
            key: 'description',
            label: 'semifinishedProducts.description',
            type: 'textarea',
            rows: 3,
            defaultValue: '',
        },
        {
            key: 'department_id',
            label: 'semifinishedProducts.department',
            type: 'text',
            required: true,
        },
    ],
};

const PRICING_SECTION: CardSection = {
    id: 'pricing',
    title: 'semifinishedProducts.pricingTitle',
    columns: 2,
    fields: [
        // {
        //     key: 'price',
        //     label: 'semifinishedProducts.price',
        //     type: 'text',
        //     required: false,
        //     placeholder: '0',
        // },
        {
            key: 'quantity',
            label: 'semifinishedProducts.quantity',
            type: 'number',
            required: true,
            placeholder: '0',
        },
        {
            key: 'measurement',
            label: 'semifinishedProducts.measurement',
            type: 'text',
            required: true,
            defaultValue: 'kg',
        },
    ],
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`compound-tabpanel-${index}`}
            aria-labelledby={`compound-tab-${index}`}
            {...other}
        >
            <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>
                {children}
            </Box>
        </div>
    );
}

export function CompoundEditView({ compoundId, isNew = false }: CompoundEditViewProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');
    const [activeTab, setActiveTab] = useState(0);
    // Store form data at parent level to preserve across tab changes
    const [formData, setFormData] = useState<Record<string, any>>({});
    // Track the created compound ID for new items
    const [createdCompoundId, setCreatedCompoundId] = useState<string | undefined>(undefined);
    // Track pending calculations when entity is created
    const pendingCalculationsRef = useRef<{
        ingredient_calculations?: Array<{ ingredient_id: string; quantity: string }>;
        compound_calculations?: Array<{ compound_id: string; quantity: string }>;
    } | null>(null);

    // SWR hooks
    const { compound, compoundLoading } = useGetCompound(isNew ? '' : compoundId || '');
    const { departments } = useGetDepartments();
    const { updateCompound } = useUpdateCompound();
    const { deleteCompound } = useDeleteCompound();
    const { createTranslation } = useTranslationsAPI();
    const { createCompoundWithCalculations } = useCreateCompoundWithCalculations();

    const loading = !isNew && compoundLoading;

    // Effective compound ID - either from props, fetched compound, or newly created
    const effectiveCompoundId = compoundId || compound?.id || createdCompoundId;

    // Initialize form data when compound is loaded
    useEffect(() => {
        if (compound && Object.keys(compound).length > 0) {
            setFormData(compound);
        } else if (isNew && (!formData || Object.keys(formData).length === 0)) {
            // Initialize empty form for new compound
            const initialData: Record<string, any> = {
                name: '',
                description: '',
                department_id: '',
                price: '',
                quantity: '',
                measurement: 'kg',
                picture_url: '',
            };
            setFormData(initialData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [compound, isNew]);

    // Handle form submission
    const handleSubmit = useCallback(
        async (submitFormData: Record<string, any>) => {
            try {
                if (isNew && !createdCompoundId) {
                    // YANGI FLOW: For new compounds, store form data and move to calculations tab
                    // Do NOT create compound yet - wait for calculations
                    setFormData(submitFormData);
                    setActiveTab(1);
                } else if (compoundId) {
                    // Update existing compound with translation
                    let name_i18n = submitFormData.name_i18n;
                    if (!name_i18n && (submitFormData.name_en || submitFormData.name_ru)) {
                        // Create translation if provided
                        const translationData: any = {
                            en: submitFormData.name_en || submitFormData.name || '',
                            ru: submitFormData.name_ru || submitFormData.name || '',
                            uz: submitFormData.name || '', // Primary name is always Uzbek
                        };

                        const translationResult = await createTranslation(translationData);
                        name_i18n = translationResult.id;
                    }

                    const payload = {
                        name: submitFormData.name,
                        name_i18n,
                        description: submitFormData.description || '',
                        price: String(submitFormData.price),
                        quantity: Number(submitFormData.quantity),
                        measurement: submitFormData.measurement,
                        department_id: submitFormData.department_id,
                        picture_url: submitFormData.picture_url || null,
                    };
                    await updateCompound(compoundId, payload);
                    // Redirect to list
                    router.push(paths.menu.semifinished.root);
                }
            } catch {
                // console.error('Error saving compound:', err);
                toast.error(
                    isNew ? t('error.createFailed') : t('error.updateFailed')
                );
            }
        },
        [router, isNew, compoundId, createdCompoundId, updateCompound, t, createTranslation]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!compound) return;

        try {
            await deleteCompound(compound.id);
            router.push(paths.menu.semifinished.root);
        } catch {

            // console.error('Error deleting compound:', err);
            toast.error(t('error.deleteFailed'));
        }
    }, [compound, deleteCompound, router, t]);

    const IMAGE_SECTION_T = translateSection(IMAGE_SECTION, t);
    const BASIC_INFO_SECTION_T = translateSection(BASIC_INFO_SECTION, t);
    const PRICING_SECTION_T = translateSection(PRICING_SECTION, t);

    // Add department options dynamically
    const BASIC_INFO_WITH_DEPS = {
        ...BASIC_INFO_SECTION_T,
        fields: BASIC_INFO_SECTION_T.fields?.map((field) => {
            if (field.key === 'department_id') {
                return {
                    ...field,
                    type: 'select' as const,
                    options: departments.map((dept: any) => ({
                        value: dept.id,
                        label: dept.name,
                    })),
                };
            }
            return field;
        }),
    };

    const MEASUREMENT_OPTIONS = ['kg', 'piece', 'l'];

    const PRICING_WITH_MEASUREMENTS = {
        ...PRICING_SECTION_T,
        fields: PRICING_SECTION_T.fields?.map((field) => {
            if (field.key === 'measurement') {
                return {
                    ...field,
                    type: 'select' as const,
                    options: MEASUREMENT_OPTIONS.map((m) => ({
                        value: m,
                        label: t(`semifinishedProducts.${m}`),
                    })),
                };
            }
            return field;
        }),
    };

    const config: GenericEditViewConfig = {
        title: isNew ? t('semifinishedProducts.newTitle') : t('semifinishedProducts.editTitle'),
        entityName: 'compound',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('overview.menu.title', 'Menu'), href: paths.menu.root },
            { name: t('semifinishedProducts.title'), href: paths.menu.semifinished.root },
            {
                name: isNew ? t('semifinishedProducts.new', 'New') : compound?.name || t('.semifinishedProducts.edit', 'Edit'),
                href: '',
            },
        ],
        leftSidecard: IMAGE_SECTION_T,
        sections: [BASIC_INFO_WITH_DEPS, PRICING_WITH_MEASUREMENTS],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* BREADCRUMBS AND TITLE */}
                <CustomBreadcrumbs
                    heading={config.title}
                    links={config.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                {/* TABS */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0, width: '100%' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            px: 0,
                            width: '100%',
                            minHeight: 48,
                            '.MuiTabs-flexContainer': {
                                width: '100%'
                            }
                        }}
                        variant="fullWidth"
                    >
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('semifinishedProducts.basicInfo', 'Basic Info')}
                            id="compound-tab-0"
                            aria-controls="compound-tabpanel-0"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('semifinishedProducts.composition', 'Composition')}
                            id="compound-tab-1"
                            aria-controls="compound-tabpanel-1"
                        />
                    </Tabs>
                </Box>

                {/* Tab 0: Basic Edit Form */}
                <TabPanel value={activeTab} index={0}>
                    <GenericEditView
                        config={config}
                        data={compound}
                        formData={formData}
                        onFormDataChange={setFormData}
                        isNew={isNew}
                        loading={loading}
                    />
                </TabPanel>

                {/* Tab 1: Calculation/Composition */}
                <TabPanel value={activeTab} index={1}>
                    <Stack spacing={3}>
                        <ProductCalculator
                            compoundId={effectiveCompoundId}
                            onCalculationsReady={(calculations) => {
                                // Store calculations for when save is clicked
                                pendingCalculationsRef.current = calculations;
                            }}
                            onSaveWithGood={async (calculationsData) => {
                                try {
                                    // Always create translation for new compounds
                                    const translationData: any = {
                                        en: formData.name_en || formData.name || '',
                                        ru: formData.name_ru || formData.name || '',
                                        uz: formData.name || '', // Primary name is always Uzbek
                                    };

                                    const translationResult = await createTranslation(translationData);
                                    const name_i18n = translationResult.id;

                                    // Save compound with calculations using new API
                                    const result = await createCompoundWithCalculations({
                                        compound: {
                                            ...formData,
                                            name_i18n,
                                        },
                                        ingredient_calculations: calculationsData.ingredient_calculations,
                                        compound_calculations: calculationsData.compound_calculations,
                                    }) as any;

                                    const newCompoundId = result?.compound?.id || result?.data?.compound?.id;
                                    if (newCompoundId) {
                                        setCreatedCompoundId(newCompoundId);
                                        pendingCalculationsRef.current = null;
                                        // Redirect to compounds list
                                        router.push(paths.menu.semifinished.root);
                                    } else {
                                        router.push(paths.menu.semifinished.root);
                                    }
                                } catch (error) {
                                    console.error("Error saving compound with calculations:", error);
                                    throw error;
                                }
                            }}
                        />
                    </Stack>
                </TabPanel>
            </Box>
        </Box>
    );
}

export function CompoundEditViewWrapper({ isNew = false }: { isNew?: boolean }) {
    const { id } = useParams<{ id?: string }>();

    return (
        <CompoundEditView
            compoundId={id}
            isNew={isNew}
        />
    );
}

/**
 * Runtime helper: translate CardSection objects that may contain translation keys
 */
function translateSection(section: CardSection, t: TFunction): CardSection {
    const mapped = { ...section } as CardSection;

    // translate title if it looks like a key
    if (typeof mapped.title === 'string' && mapped.title.includes('.')) {
        mapped.title = t(mapped.title as string, mapped.title as string);
    }

    if (Array.isArray(mapped.fields)) {
        mapped.fields = mapped.fields.map((f) => {
            const nf = { ...f };
            if (typeof nf.label === 'string' && nf.label.includes('.')) {
                nf.label = t(nf.label as string, nf.label as string);
            }
            if (nf.options && Array.isArray(nf.options)) {
                nf.options = nf.options.map((opt) => ({
                    ...opt,
                    label:
                        typeof opt.label === 'string' && opt.label.includes('.')
                            ? t(opt.label as string, opt.label as string)
                            : opt.label,
                }));
            }
            return nf;
        });
    }
    return mapped;
}
