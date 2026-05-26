import type { IInventory, IInventoryFormData } from 'src/types/inventory';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useState, useEffect, useCallback } from 'react';

import { Box, Tab, Tabs, Stack, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useInventoryAPI } from 'src/hooks/use-inventory-api';

import { useGetStorages } from 'src/actions/departments';

import { toast } from 'src/components/snackbar';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { InventoryDetailsCalculation } from 'src/components/inventory-details-calculation';

interface InventoryEditViewProps {
    isNew?: boolean;
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
            id={`inventory-tabpanel-${index}`}
            aria-labelledby={`inventory-tab-${index}`}
            {...other}
        >
            <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>
                {children}
            </Box>
        </div>
    );
}

export function InventoryEditView({ isNew = false }: InventoryEditViewProps) {
    const { t } = useTranslation('menu');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { storages } = useGetStorages();

    const { getInventoryById, updateInventory, getInventoryItems } = useInventoryAPI();

    // Tab state
    const [activeTab, setActiveTab] = useState(0);

    // Form state
    const [formData, setFormData] = useState<Record<string, any>>({
        counted_at: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'),
        status: 'draft',
        storage_id: '',
        description: '',
    });

    const [inventory, setInventory] = useState<IInventory | null>(null);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [createdInventoryId, setCreatedInventoryId] = useState<string | undefined>(undefined);

    // Effective inventory ID
    const effectiveInventoryId = id || inventory?.id || createdInventoryId;

    // Refresh inventory data
    const refreshInventoryData = useCallback(async (inventoryId: string) => {
        try {
            const data = await getInventoryById(inventoryId);
            if (data) {
                setInventory(data);
                setFormData({
                    counted_at: dayjs(data.date).format('YYYY-MM-DDTHH:mm:ssZ'),
                    status: data.status,
                    storage_id: data.storage_id,
                    description: data.description || '',
                });

                // Load inventory items
                const items = await getInventoryItems(inventoryId);
                setInventoryItems(items);
            }
        } catch (error) {
            console.error('Error refreshing inventory data:', error);
        }
    }, [getInventoryById, getInventoryItems]);

    // Load inventory data if editing
    useEffect(() => {
        if (!isNew && id) {
            const loadData = async () => {
                try {
                    setLoading(true);
                    const data = await getInventoryById(id);
                    if (data) {
                        setInventory(data);
                        setFormData({
                            counted_at: dayjs(data.date).format('YYYY-MM-DDTHH:mm:ssZ'),
                            status: data.status,
                            storage_id: data.storage_id,
                            description: data.description || '',
                        });

                        // Load inventory items
                        const items = await getInventoryItems(id);
                        setInventoryItems(items);
                    } else {
                        toast.error(t('error.notFound'));
                        navigate(paths.menu.inventory.root);
                    }
                } catch (error) {
                    console.error('Error loading inventory:', error);
                    toast.error(t('error.loadFailed'));
                } finally {
                    setLoading(false);
                }
            };

            loadData();
        }
    }, [isNew, id, getInventoryById, getInventoryItems, navigate, t]);

    // Handle form submission
    const handleSubmit = useCallback(
        async (data: Record<string, any>) => {
            if (!data.storage_id) {
                toast.error(t('inventory.selectStorage') || 'Please select storage');
                throw new Error('Storage required');
            }

            try {
                if (isNew && !createdInventoryId) {
                    // New flow: inventory and items are created together in Tab 2 (/inventories/batch)
                    setFormData(data);
                    setActiveTab(1);
                    toast.info(t('inventory.itemsToCount') || 'Please add inventory items');
                } else if (createdInventoryId) {
                    const result = await updateInventory(createdInventoryId, data as IInventoryFormData);
                    if (result) {
                        setInventory(result);
                        toast.success(t('success.updated'));
                    }
                } else if (id) {
                    const result = await updateInventory(id, data as IInventoryFormData);
                    if (result) {
                        setInventory(result);
                        toast.success(t('success.updated'));
                        navigate(paths.menu.inventory.root);
                    }
                }
            } catch (error) {
                console.error('Error saving inventory:', error);
                throw error;
            }
        },
        [isNew, id, createdInventoryId, updateInventory, navigate, t]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        toast.error('Delete not implemented yet');
        throw new Error('Delete not implemented');
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    const storageOptions = Array.isArray(storages)
        ? storages.map((storage: any) => ({
            value: storage.id,
            label: storage.name,
        }))
        : [];

    const config = {
        title: isNew ? t('inventory.create') : t('inventory.edit'),
        entityName: 'Inventory',
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('inventory.title'), href: paths.menu.inventory.root },
            { name: isNew ? t('inventory.new') : String(inventory?.number || 'Inventory'), href: '' },
        ],
        showBreadcrumbs: false,
        showDeleteButton: false,
        sections: [
            {
                id: 'basic-info',
                title: t('inventory.details'),
                columns: 2,
                fields: [
                    {
                        key: 'counted_at',
                        label: t('inventory.date'),
                        type: 'date' as const,
                        required: true,
                        defaultValue: dayjs().format('YYYY-MM-DD'),
                    },
                    {
                        key: 'storage_id',
                        label: t('inventory.storage'),
                        type: 'select' as const,
                        required: true,
                        options: storageOptions,
                        defaultValue: '',
                    },
                    {
                        key: 'description',
                        label: t('inventory.description'),
                        type: 'textarea' as const,
                        rows: 3,
                        defaultValue: '',
                    },
                    {
                        key: 'status',
                        label: t('inventory.status'),
                        type: 'select' as const,
                        options: [
                            { value: 'active', label: t('inventory.active') },
                            { value: 'draft', label: t('inventory.draft') },
                            { value: 'deleted', label: t('inventory.deleted') },
                            // { value: 'cancelled', label: t('inventory.cancelled') },
                        ],
                        defaultValue: 'active',
                    },
                ],
            },
        ],
        onSubmit: handleSubmit,
        onDelete: handleDelete,
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
                                width: '100%',
                            },
                        }}
                        variant="fullWidth"
                    >
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('inventory.details')}
                            id="inventory-tab-0"
                            aria-controls="inventory-tabpanel-0"
                        />
                        <Tab
                            sx={{ minWidth: 0, flex: 1 }}
                            label={t('inventory.items')}
                            id="inventory-tab-1"
                            aria-controls="inventory-tabpanel-1"
                            disabled={!isNew && !effectiveInventoryId}
                        />
                    </Tabs>
                </Box>

                {/* Tab 0: Inventory Details Form */}
                <TabPanel value={activeTab} index={0}>
                    <GenericEditView
                        config={config}
                        data={formData}
                        formData={formData}
                        onFormDataChange={setFormData}
                        isNew={isNew}
                        loading={loading}
                    />
                </TabPanel>

                {/* Tab 1: Calculation/Items */}
                <TabPanel value={activeTab} index={1}>
                    {isNew || effectiveInventoryId ? (
                        <Stack spacing={3}>
                            <InventoryDetailsCalculation
                                inventoryId={effectiveInventoryId}
                                formData={formData as IInventoryFormData}
                                isNewInventory={isNew}
                                persistedDetails={inventoryItems}
                                onDetailsChange={(details) => setInventoryItems(details)}
                                onSuccess={() => {
                                    toast.success(t('success.itemsAdded'));
                                }}
                                onBatchCreateSuccess={(createdInventory, createdItems) => {
                                    setCreatedInventoryId(createdInventory.id);
                                    setInventory(createdInventory);
                                    setInventoryItems(createdItems);
                                }}
                                onApplySuccess={(updatedItems: any) => {
                                    // Update inventory items with the POST response data
                                    if (updatedItems) {
                                        setInventoryItems(updatedItems);
                                    }
                                }}
                            />
                        </Stack>
                    ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <CircularProgress />
                        </Box>
                    )}
                </TabPanel>
            </Box>
        </Box>
    );
}

export default InventoryEditView;
