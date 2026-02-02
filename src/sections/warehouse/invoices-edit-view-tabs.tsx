import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Box, Tabs, Tab, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { InvoiceInfoEditView } from './invoice-info-edit-view';
import { InvoiceDetailsCalculation } from 'src/components/invoice-details-calculation/invoice-details-calculation';
import { useInvoiceAPI } from 'src/hooks/use-invoice-api';
import { fetcher, endpoints } from 'src/lib/axios';

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
            id={`invoice-tabpanel-${index}`}
            aria-labelledby={`invoice-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export function InvoicesEditViewTabs() {
    const { t } = useTranslation('menu');
    const { id } = useParams<{ id?: string }>();
    const router = useRouter();
    const { createInvoiceBatch, getInvoiceById } = useInvoiceAPI(); // ✅ Hook at component level
    const [currentTab, setCurrentTab] = useState(id ? 0 : 1); // Tab 0 for edit, Tab 1 for new
    const [invoiceData, setInvoiceData] = useState<Record<string, any> | null>(null);
    const [detailsData, setDetailsData] = useState<any[]>([]); // Store invoice details
    const [isLoading, setIsLoading] = useState(!!id); // Loading if editing
    const [formData, setFormData] = useState<Record<string, any>>({
        supplier_id: '',
        storage_id: '',
        date: new Date().toISOString(),
        status: 'pending',
        total_amount: '',
    }); // Persist form data across tab switches
    const isCreatingNew = !id;

    // Load invoice data when editing
    useEffect(() => {
        if (id) {
            const loadInvoice = async () => {
                try {
                    setIsLoading(true);
                    // Get invoice info
                    const invoice = await getInvoiceById(id);
                    if (invoice) {
                        setInvoiceData(invoice);
                        setFormData({
                            supplier_id: invoice.supplier_id,
                            storage_id: invoice.storage_id || '',
                            date: invoice.date,
                            status: invoice.status,
                            total_amount: invoice.total_amount?.toString() || '',
                        });
                    }

                    // Get invoice details from /api/v1/invoice-details/invoice/{invoice_id}
                    const response = await fetcher<any>(`/api/v1/invoice-details/invoice/${id}`);
                    if (response.data) {
                        const details = Array.isArray(response.data) ? response.data : [response.data];
                        setDetailsData(details);
                    }
                } catch (error) {
                    console.error('Error loading invoice:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            loadInvoice();
        }
    }, [id, getInvoiceById]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    // Called when form data changes in Tab 1 - stores data for persistence
    const handleFormDataChange = (newFormData: Record<string, any>) => {
        setFormData(newFormData);
    };

    // Called when user adds details in Tab 2
    const handleDetailsChange = (details: any[]) => {
        setDetailsData(details);
    };

    // Called when user submits invoice info in Tab 1 - this is where batch API is called
    const handleInvoiceSubmit = async (formData: Record<string, any>, details?: any[]) => {
        try {
            if (!formData.supplier_id) {
                throw new Error(t('warehouse.invoices.supplierRequired'));
            }
            if (!formData.storage_id) {
                throw new Error(t('warehouse.invoices.storageRequired', 'Storage is required'));
            }
            if (!formData.total_amount) {
                throw new Error(t('warehouse.invoices.amountRequired'));
            }

            setIsLoading(true);

            // If creating new invoice with details, use batch API
            if (isCreatingNew && details && details.length > 0) {
                const batchPayload = {
                    invoice: {
                        supplier_id: formData.supplier_id,
                        storage_id: formData.storage_id,
                        total_amount: formData.total_amount.toString(),
                        status: formData.status || 'pending',
                        date: formData.date || new Date().toISOString(),
                    },
                    details: details.map((item) => ({
                        ingredient_id: item.ingredient_id || item.id,
                        quantity: item.quantity,
                        price_per_unit: item.price_per_unit?.toString() || '0',
                        price: item.price?.toString() || '0',
                    })),
                };

                await createInvoiceBatch(batchPayload);
                // Clear form and details data after successful submission
                setFormData({
                    supplier_id: '',
                    storage_id: '',
                    date: new Date().toISOString(),
                    status: 'pending',
                    total_amount: '',
                });
                setDetailsData([]);
                router.push(paths.warehouse.invoiceDetails.root);
            } else if (isCreatingNew && (!details || details.length === 0)) {
                // If no details added, show error
                throw new Error(t('warehouse.invoiceDetails.addAtLeastOneItem'));
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleBatchSuccess = () => {
        // After successful batch submission, redirect to invoice details
        router.push(paths.warehouse.invoiceDetails.root);
    };

    return (
        <Box sx={{ pl: 4, pt: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* TABS */}
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        mb: 3,
                    }}
                >
                    <Tab
                        label={t('warehouse.invoices.information')}
                        id="invoice-tab-0"
                        aria-controls="invoice-tabpanel-0"
                    />
                    <Tab
                        label={t('warehouse.invoiceDetails.addItems')}
                        id="invoice-tab-1"
                        aria-controls="invoice-tabpanel-1"
                    />
                </Tabs>

                {/* TAB 1: Invoice Information */}
                <TabPanel value={currentTab} index={0}>
                    <InvoiceInfoEditView
                        isNew={!id}
                        onInvoiceSubmit={handleInvoiceSubmit}
                        detailsData={detailsData}
                        currentInvoiceId={id}
                        skipRedirect={true}
                        useBatchFlow={isCreatingNew}
                        onFormDataChange={handleFormDataChange}
                        persistedFormData={formData}
                    />
                </TabPanel>

                {/* TAB 2: Batch Add Items */}
                <TabPanel value={currentTab} index={1}>
                    {true ? (
                        <InvoiceDetailsCalculation
                            invoiceId={id || 'new'}
                            invoiceData={invoiceData || undefined}
                            isNewInvoice={isCreatingNew}
                            onDetailsChange={handleDetailsChange}
                            onSuccess={handleBatchSuccess}
                            persistedDetails={detailsData}
                            formData={formData}
                            onSaveInvoice={handleInvoiceSubmit}
                        />
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <p>{t('warehouse.invoices.fillInfoFirst', 'Please fill invoice information in Tab 1 first')}</p>
                        </Box>
                    )}
                </TabPanel>
            </Box>
        </Box>
    );
}
