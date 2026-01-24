import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Box, Tabs, Tab, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { InvoicesEditView } from './supplier-edit-view';
import { InvoiceDetailsCalculation } from 'src/components/invoice-details-calculation/invoice-details-calculation';

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
    const [currentTab, setCurrentTab] = useState(0);
    const [invoiceId, setInvoiceId] = useState<string | null>(id || null);
    const [isLoading, setIsLoading] = useState(false);

    // If creating new invoice, user can't go to batch tab until invoice is saved
    const canAccessBatchTab = !!invoiceId;

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        if (newValue === 1 && !canAccessBatchTab) {
            return; // Prevent tab change if no invoice ID
        }
        setCurrentTab(newValue);
    };

    const handleInvoiceCreated = (newInvoiceId: string) => {
        setInvoiceId(newInvoiceId);
        // Automatically move to batch tab after creating invoice
        setTimeout(() => {
            setCurrentTab(1);
        }, 500);
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
                        disabled={!canAccessBatchTab}
                    />
                </Tabs>

                {/* TAB 1: Invoice Information */}
                <TabPanel value={currentTab} index={0}>
                    <InvoicesEditView
                        isNew={!id}
                        onInvoiceCreated={handleInvoiceCreated}
                        currentInvoiceId={invoiceId}
                        skipRedirect={true}
                    />
                </TabPanel>

                {/* TAB 2: Batch Add Items */}
                <TabPanel value={currentTab} index={1}>
                    {invoiceId && (
                        <InvoiceDetailsCalculation
                            invoiceId={invoiceId}
                            onSuccess={handleBatchSuccess}
                        />
                    )}
                    {!invoiceId && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                </TabPanel>
            </Box>
        </Box>
    );
}
