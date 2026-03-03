import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { Box, Tab, Tabs, Stack } from '@mui/material';
import dayjs from 'dayjs';
import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { DeductionsDetailsCalculation } from 'src/components/deductions-details-calculation';
import { fetcher, endpoints } from 'src/lib/axios';
import type { Deduction } from 'src/hooks/use-deductions-api';

interface Storage {
    id: string;
    name: string;
}

interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

interface DeductionsFormData {
    date: string;
    status: string;
    storage_id: string;
    description: string;
    act_group_id: string;
}

interface DeductionItem {
    ingredient_id: string;
    quantity: string;
}

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
            id={`deductions-tabpanel-${index}`}
            aria-labelledby={`deductions-tab-${index}`}
            {...other}
        >
            <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>
                {children}
            </Box>
        </div>
    );
}


interface DeductionsEditViewProps {
    isNew?: boolean;
}

export function DeductionsEditView({ isNew = false }: DeductionsEditViewProps) {
    const { t } = useTranslation('menu');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        getDeductionById,
        createDeduction,
        updateDeduction,
        updateDeductionItemsBatch,
        getDeductionGroups,
    } = useDeductionsAPI();
    // Tab state
    const [activeTab, setActiveTab] = useState(0);
    // Form state
    const [formData, setFormData] = useState<DeductionsFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        status: 'active',
        storage_id: '',
        description: '',
        act_group_id: '',
    });

    // Items state (from calculation tab)
    const [items, setItems] = useState<DeductionItem[]>([]);
    const itemsRef = useRef<DeductionItem[]>([]);
    const [deduction, setDeduction] = useState<Deduction | null>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [storages, setStorages] = useState<Storage[]>([]);
    const [loading, setLoading] = useState(false);
    const [createdDeductionId, setCreatedDeductionId] = useState<string | undefined>(undefined);

    // Effective deduction ID
    const effectiveDeductionId = id || deduction?.id || createdDeductionId;

    // FIX 1: useCallback for items change to prevent infinite loops in child component
    const handleItemsChange = useCallback((newItems: DeductionItem[]) => {
        console.log('Items changed:', newItems);
        itemsRef.current = newItems;
        setItems(newItems);
    }, []);

    // FIX 2: useCallback for form data change
    const handleFormDataChange = useCallback((data: Record<string, any>) => {
        console.log('Form data changed:', data);
        setFormData(data as DeductionsFormData);
    }, []);

    // Load groups and storages
    useEffect(() => {
        const loadBaseData = async () => {
            try {
                const [groupsData, storagesData] = await Promise.all([
                    getDeductionGroups(),
                    fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(() => ({
                        data: [],
                    })),
                ]);

                setGroups(Array.isArray(groupsData) ? groupsData : []);
                setStorages(Array.isArray(storagesData?.data) ? storagesData.data : []);
            } catch (error) {
                console.error('Error loading base data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBaseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load deduction data if editing
    useEffect(() => {
        if (!isNew && id) {
            const loadData = async () => {
                try {
                    setLoading(true);
                    const data = await getDeductionById(id);
                    if (data) {
                        setDeduction(data);
                        setFormData({
                            date: dayjs(data.date).format('YYYY-MM-DD'),
                            status: data.status,
                            storage_id: data.storage_id,
                            description: data.description || '',
                            act_group_id: data.act_group_id,
                        });
                        if (data.items) {
                            setItems(data.items);
                            itemsRef.current = data.items;
                        }
                    } else {
                        toast.error(t('error.notFound'));
                        navigate(paths.warehouse.deductions.root);
                    }
                } catch (error) {
                    console.error('Error loading deduction:', error);
                    toast.error(t('error.loadFailed'));
                } finally {
                    setLoading(false);
                }
            };

            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNew, id]);

    // Handle form submission from GenericEditView (Tab 0) - save to backend
    const handleSubmit = useCallback(
        async (data: DeductionsFormData) => {
            console.log('handleSubmit called with data:', data);
            console.log('Current items:', itemsRef.current);

            // Update form data state first
            setFormData(data);

            // Check if items are empty
            if (itemsRef.current.length === 0) {
                setActiveTab(1);
                throw new Error(t('deductions.itemsRequired', 'Please add at least one item'));
            }

            // Validate required fields
            if (!data.storage_id) {
                throw new Error(t('deductions.storageRequired', 'Please select storage'));
            }

            if (!data.act_group_id) {
                throw new Error(t('deductions.groupRequired', 'Please select group'));
            }

            // Prepare payload with current items
            const payload = {
                date: data.date,
                status: data.status,
                storage_id: data.storage_id,
                description: data.description,
                act_group_id: data.act_group_id,
                items: itemsRef.current,
            };

            console.log('Submitting payload:', payload);

            try {
                if (isNew && !createdDeductionId) {
                    console.log('Creating new deduction...');
                    const result = await createDeduction(payload);
                    if (result) {
                        setCreatedDeductionId(result.id);
                        setDeduction(result);
                        toast.success(t('deductions.created', 'Deduction created successfully'));
                        navigate(paths.warehouse.deductions.root);
                    }
                } else if (createdDeductionId) {
                    console.log('Updating created deduction:', createdDeductionId);
                    const result = await updateDeduction(createdDeductionId, payload);
                    if (result) {
                        setDeduction(result);
                        toast.success(t('deductions.updated', 'Deduction updated successfully'));
                        navigate(paths.warehouse.deductions.root);
                    }
                } else if (id) {
                    console.log('Updating existing deduction:', id);
                    const result = await updateDeduction(id, payload);
                    if (result) {
                        setDeduction(result);
                        toast.success(t('deductions.updated', 'Deduction updated successfully'));
                        navigate(paths.warehouse.deductions.root);
                    }
                }
            } catch (error) {
                console.error('Error saving deduction:', error);
                throw error;
            }
        },
        [isNew, createdDeductionId, id, createDeduction, updateDeduction, navigate, t]
    );

    // NEW: Handle items tab save - this will be called from DeductionsDetailsCalculation
    const handleItemsSave = useCallback(async () => {

        try {
            // Validate that we have items
            if (!itemsRef.current || itemsRef.current.length === 0) {
                console.error('No items found');
                toast.error(t('deductions.itemsRequired', 'Please add at least one item'));
                return;
            }

            // Validate required fields from form data
            if (!formData.storage_id) {
                console.error('No storage selected');
                toast.error(t('deductions.storageRequired', 'Please select storage in Details tab'));
                setActiveTab(0);
                return;
            }

            if (!formData.act_group_id) {
                console.error('No group selected');
                toast.error(t('deductions.groupRequired', 'Please select group in Details tab'));
                setActiveTab(0);
                return;
            }

            // Prepare payload with all data
            const payload = {
                date: formData.date,
                status: formData.status,
                storage_id: formData.storage_id,
                description: formData.description,
                act_group_id: formData.act_group_id,
                items: itemsRef.current,
            };

            console.log('Payload to send:', payload);

            setLoading(true);

            let result;
            const targetDeductionId = createdDeductionId || id;

            if (isNew && !targetDeductionId) {
                // Create new deduction from items tab (Details tab was not saved yet)
                console.log('Creating NEW deduction with items...');
                result = await createDeduction(payload);
                console.log('Create result:', result);

                if (result) {
                    setCreatedDeductionId(result.id);
                    setDeduction(result);
                    toast.success(t('deductions.created', 'Deduction created successfully'));
                    // Redirect to deductions list
                    navigate(paths.warehouse.deductions.root);
                }
            } else if (targetDeductionId) {
                // Edit flow: update only items through batch endpoint
                console.log('Updating deduction items batch:', targetDeductionId);
                result = await updateDeductionItemsBatch(targetDeductionId, itemsRef.current);

                if (result) {
                    setDeduction(result);
                    toast.success(t('deductions.updated', 'Deduction updated successfully'));
                    navigate(paths.warehouse.deductions.root);
                }
            }
        } catch (error) {
            console.error('Error saving items:', error);
            toast.error(t('error.saveFailed', 'Failed to save deduction'));
        } finally {
            setLoading(false);
        }
    }, [isNew, createdDeductionId, id, formData, createDeduction, updateDeductionItemsBatch, navigate, t]);

    // Tab change handler
    const handleTabChange = useCallback(
        (event: React.SyntheticEvent, newValue: number) => {
            console.log('Tab changed to:', newValue);
            setActiveTab(newValue);
        },
        []
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        toast.error('Delete not implemented yet');
        throw new Error('Delete not implemented');
    }, []);

    const groupOptions = useMemo(
        () => groups.map((group) => ({
            value: group.id,
            label: group.name,
        })),
        [groups]
    );

    const storageOptions = useMemo(
        () => storages.map((storage) => ({
            value: storage.id,
            label: storage.name,
        })),
        [storages]
    );

    const config = useMemo(
        () => ({
            title: isNew ? t('deductions.createNew', 'Create New Deduction') : t('deductions.edit', 'Edit Deduction'),
            entityName: 'Deduction',
            breadcrumbs: [
                { name: t('app'), href: paths.menu.root },
                { name: t('deductions.title', 'Deductions'), href: paths.warehouse.deductions.root },
                { name: isNew ? t('deductions.new', 'New') : String(deduction?.number || 'Deduction'), href: '' },
            ],
            showBreadcrumbs: false,
            showDeleteButton: false,
            sections: [
                {
                    id: 'basic-info',
                    title: t('deductions.details', 'Deduction Details'),
                    columns: 2,
                    fields: [
                        {
                            key: 'date',
                            label: t('deductions.date', 'Date'),
                            type: 'text' as const,
                            required: true,
                            defaultValue: dayjs().format('YYYY-MM-DD'),
                        },
                        {
                            key: 'storage_id',
                            label: t('deductions.storage', 'Storage'),
                            type: 'select' as const,
                            required: true,
                            options: storageOptions,
                            defaultValue: '',
                        },
                        {
                            key: 'act_group_id',
                            label: t('deductions.group', 'Group'),
                            type: 'select' as const,
                            required: true,
                            options: groupOptions,
                            defaultValue: '',
                        },
                        {
                            key: 'status',
                            label: t('deductions.status', 'Status'),
                            type: 'select' as const,
                            options: [
                                { value: 'active', label: t('deductions.active', 'Active') },
                                { value: 'deleted', label: t('deductions.deleted', 'Deleted') },
                            ],
                            defaultValue: 'active',
                        },
                        {
                            key: 'description',
                            label: t('deductions.description', 'Description'),
                            type: 'textarea' as const,
                            rows: 3,
                            defaultValue: '',
                        },
                    ],
                },
            ],
            onSubmit: handleSubmit as (formData: Record<string, any>) => Promise<void>,
            onDelete: handleDelete as () => Promise<void>,
        }),
        [isNew, t, deduction?.number, storageOptions, groupOptions, handleSubmit, handleDelete]
    );

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
                <Box sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            px: 2,
                            // borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Tab
                            label={t('deductions.details', 'Details')}
                            id="deductions-tab-0"
                            aria-controls="deductions-tabpanel-0"
                        />
                        <Tab
                            label={t('deductions.items', 'Items')}
                            id="deductions-tab-1"
                            aria-controls="deductions-tabpanel-1"
                        />
                    </Tabs>


                    {/* Tab 0: Deduction Details Form */}
                    <TabPanel value={activeTab} index={0}>
                        <GenericEditView
                            config={config}
                            data={formData}
                            formData={formData}
                            onFormDataChange={handleFormDataChange}
                            isNew={isNew}
                            loading={loading}
                        />
                    </TabPanel>

                    {/* Tab 1: Calculation/Items */}
                    <TabPanel value={activeTab} index={1}>
                        <Stack spacing={3} sx={{ p: 3 }}>
                            <DeductionsDetailsCalculation
                                deductionId={effectiveDeductionId}
                                storageId={formData.storage_id}
                                actGroupId={formData.act_group_id}
                                isNewDeduction={isNew}
                                items={items}
                                onItemsChange={handleItemsChange}
                                onSuccess={handleItemsSave}
                                formData={formData}
                            />
                        </Stack>
                    </TabPanel>
                </Box>
            </Box>
        </Box>
    );
}

export default DeductionsEditView;
