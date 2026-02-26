import type {
  OutgoingInvoiceBatchItemInput,
  OutgoingInvoiceBatchApiResponse,
} from 'src/types/outgoing-invoices';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Tab,
  Tabs,
  Stack,
  Paper,
  Table,
  Button,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  IconButton,
  Typography,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useStorageAPI } from 'src/hooks/use-storage-api';
import { useDeductionsAPI } from 'src/hooks/use-deductions-api';
import { useOutgoingInvoicesAPI } from 'src/hooks/use-outgoing-invoices-api';

import { fetcher, endpoints } from 'src/lib/axios';

import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import ShipmentsDetailsCalculation from 'src/components/shipments-details-calculation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface OutgoingInvoiceFormData {
  date: string;
  storage_id: string;
  group_id: string;
  description: string;
}

interface Ingredient {
  id: string;
  name: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`outgoing-invoices-tabpanel-${index}`}
      aria-labelledby={`outgoing-invoices-tab-${index}`}
      {...other}
    >
      <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>{children}</Box>
    </div>
  );
}

export function OutgoingInvoicesEditView() {
  const { t } = useTranslation('menu');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNewMode = !id;

  const { getDeductionGroups } = useDeductionsAPI();
  const { getStorages } = useStorageAPI();
  const {
    getOutgoingInvoiceById,
    createOutgoingInvoiceBatch,
    confirmOutgoingInvoice,
    cancelOutgoingInvoice,
    deleteOutgoingInvoice,
    deleteOutgoingInvoiceItem,
  } = useOutgoingInvoicesAPI();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | 'delete' | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [storages, setStorages] = useState<Array<{ id: string; name: string }>>([]);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OutgoingInvoiceFormData>({
    date: dayjs().format('YYYY-MM-DD'),
    storage_id: '',
    group_id: '',
    description: '',
  });

  const [items, setItems] = useState<OutgoingInvoiceBatchItemInput[]>([]);
  const [batchResponse, setBatchResponse] = useState<OutgoingInvoiceBatchApiResponse | null>(null);
  const itemsRef = useRef<OutgoingInvoiceBatchItemInput[]>([]);

  const mapResponseToState = useCallback((response: OutgoingInvoiceBatchApiResponse) => {
    setBatchResponse(response);
    setFormData({
      date: dayjs(response.data.invoice.date).format('YYYY-MM-DD'),
      storage_id: response.data.invoice.storage_id,
      group_id: response.data.invoice.group_id,
      description: response.data.invoice.description || '',
    });
    const mappedItems = response.data.items.map((item) => ({
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
    }));
    setItems(mappedItems);
    itemsRef.current = mappedItems;
  }, []);

  const loadOutgoingInvoiceDetails = useCallback(
    async (outgoingInvoiceId: string) => {
      const details = await getOutgoingInvoiceById(outgoingInvoiceId);
      if (!details) {
        navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
        return;
      }
      mapResponseToState(details);
    },
    [getOutgoingInvoiceById, mapResponseToState, navigate]
  );

  const handleItemsChange = useCallback((nextItems: OutgoingInvoiceBatchItemInput[]) => {
    setItems(nextItems);
    itemsRef.current = nextItems;
  }, []);

  const handleFormDataChange = useCallback((data: Record<string, any>) => {
    setFormData(data as OutgoingInvoiceFormData);
  }, []);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [storagesData, groupsData, ingredientsData] = await Promise.all([
          getStorages(),
          getDeductionGroups(),
          fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list).catch(() => ({
            status: 'error',
            message: 'failed',
            data: [],
            code: 500,
          })),
        ]);
        setStorages(storagesData);
        setGroups(groupsData);
        setIngredientsMap(
          (ingredientsData.data || []).reduce(
            (acc, item) => ({ ...acc, [item.id]: item.name || item.id }),
            {} as Record<string, string>
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [getStorages, getDeductionGroups]);

  useEffect(() => {
    if (!id) return;
    loadOutgoingInvoiceDetails(id);
  }, [id, loadOutgoingInvoiceDetails]);

  const normalizeDateForApi = useCallback((value: string) => {
    if (!value) return new Date().toISOString();
    if (value.includes('T')) return value;
    return `${value}T00:00:00Z`;
  }, []);

  const saveByBatch = useCallback(async () => {
    if (!itemsRef.current.length) {
      setActiveTab(1);
      throw new Error(t('deductions.itemsRequired', 'Please add at least one item'));
    }
    if (!formData.storage_id) {
      setActiveTab(0);
      throw new Error(t('deductions.storageRequired', 'Please select storage'));
    }
    if (!formData.group_id) {
      setActiveTab(0);
      throw new Error(t('outgoingInvoices.groupRequired', 'Please select group'));
    }

    const response = await createOutgoingInvoiceBatch({
      date: normalizeDateForApi(formData.date),
      description: formData.description || '',
      storage_id: formData.storage_id,
      group_id: formData.group_id,
      items: itemsRef.current,
    });

    mapResponseToState(response);
  }, [createOutgoingInvoiceBatch, formData, mapResponseToState, normalizeDateForApi, t]);

  const handleSubmit = useCallback(async () => {
    await saveByBatch();
  }, [saveByBatch]);

  const handleItemsSave = useCallback(async () => {
    try {
      setSavingItems(true);
      await saveByBatch();
    } finally {
      setSavingItems(false);
    }
  }, [saveByBatch]);

  const storageOptions = useMemo(
    () => storages.map((storage) => ({ value: storage.id, label: storage.name })),
    [storages]
  );
  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: group.id, label: group.name })),
    [groups]
  );

  const config = useMemo(
    () => ({
      title: isNewMode
        ? t('outgoingInvoices.create', 'Create outgoing invoice')
        : t('outgoingInvoices.view', 'View outgoing invoice'),
      entityName: 'outgoing-invoice',
      showBreadcrumbs: false,
      showDeleteButton: false,
      breadcrumbs: [
        { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
        { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
        {
          name: t('overview.warehouse.expensesInvoices', 'Expenses invoices'),
          href: paths.warehouse.outgoingInvoices.root,
        },
        { name: isNewMode ? t('common.create', 'Create') : t('common.view', 'View'), href: '' },
      ],
      sections: [
        {
          id: 'basic',
          title: t('deductions.details', 'Details'),
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
              key: 'group_id',
              label: t('outgoingInvoices.group', 'Group'),
              type: 'select' as const,
              required: true,
              options: groupOptions,
              defaultValue: '',
            },
            {
              key: 'description',
              label: t('deductions.description', 'Description'),
              type: 'textarea' as const,
              defaultValue: '',
              rows: 3,
            },
          ],
        },
      ],
      onSubmit: handleSubmit as (submittedFormData: Record<string, any>) => Promise<void>,
    }),
    [handleSubmit, isNewMode, storageOptions, groupOptions, t]
  );

  const outgoingInvoiceId = batchResponse?.data?.invoice?.id;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <CustomBreadcrumbs heading={config.title} links={config.breadcrumbs} sx={{ mb: 3 }} />

        {(isNewMode || (batchResponse && isNewMode)) && (
          <>
            {isNewMode && !batchResponse && (
              <Tabs
                value={activeTab}
                onChange={(_, next) => setActiveTab(next)}
                variant="fullWidth"
                sx={{ mb: 0, width: '100%' }}
              >
                <Tab label={t('common.edit', 'Details')} id="outgoing-invoices-tab-0" />
                <Tab label={t('mealsProducts.calculate', 'Calculation')} id="outgoing-invoices-tab-1" />
              </Tabs>
            )}

            <TabPanel value={activeTab} index={0}>
              <GenericEditView
                config={config}
                data={formData}
                formData={formData}
                onFormDataChange={handleFormDataChange}
                isNew={isNewMode && !batchResponse}
                loading={loading}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3} sx={{ p: 3 }}>
                <ShipmentsDetailsCalculation
                  items={items}
                  onItemsChange={handleItemsChange}
                  onSave={handleItemsSave}
                  saving={savingItems}
                />
              </Stack>
            </TabPanel>
          </>
        )}

        {!isNewMode && !batchResponse && loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!isNewMode && batchResponse && (
          <>
            <Tabs
              value={activeTab}
              onChange={(_, next) => setActiveTab(next)}
              variant="fullWidth"
              sx={{ mb: 0, width: '100%' }}
            >
              <Tab label={t('common.edit', 'Details')} id="outgoing-invoices-tab-0" />
              <Tab label={t('outgoingInvoices.items', 'Items')} id="outgoing-invoices-tab-1" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <GenericEditView
                config={config}
                data={formData}
                formData={formData}
                onFormDataChange={handleFormDataChange}
                isNew={false}
                loading={loading}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3} sx={{ p: 3 }}>
                <ShipmentsDetailsCalculation
                  items={items}
                  onItemsChange={handleItemsChange}
                  onSave={handleItemsSave}
                  saving={savingItems}
                />
              </Stack>
            </TabPanel>
          </>
        )}

        {batchResponse && isNewMode && (
          <Box sx={{ p: 3 }}>
         
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('outgoingInvoices.items', 'Items')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{t('warehouse.ingredient', 'Ingredient')}</TableCell>
                      <TableCell>{t('calculation.quantity', 'Quantity')}</TableCell>
                      <TableCell>{t('outgoingInvoices.pricePerUnit', 'Price / Unit')}</TableCell>
                      <TableCell>{t('outgoingInvoices.totalAmount', 'Total Amount')}</TableCell>
                      <TableCell>{t('outgoingInvoices.stockBefore', 'Stock Before')}</TableCell>
                      <TableCell>{t('outgoingInvoices.stockAfter', 'Stock After')}</TableCell>
                      <TableCell align="right">{t('common.actions', 'Actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchResponse.data.items.map((item, index) => (
                      <TableRow key={item.id || `${item.ingredient_id}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{ingredientsMap[item.ingredient_id] || item.ingredient_id}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price_per_unit}</TableCell>
                        <TableCell>{item.total_amount}</TableCell>
                        <TableCell>{item.stock_before}</TableCell>
                        <TableCell>{item.stock_after}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            size="small"
                            disabled={!outgoingInvoiceId || deletingItemId === item.id}
                            onClick={async () => {
                              if (!outgoingInvoiceId) return;
                              try {
                                setDeletingItemId(item.id);
                                await deleteOutgoingInvoiceItem(outgoingInvoiceId, item.id);
                                await loadOutgoingInvoiceDetails(outgoingInvoiceId);
                              } finally {
                                setDeletingItemId(null);
                              }
                            }}
                          >
                            {deletingItemId === item.id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('outgoingInvoices.totals', 'Totals')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('outgoingInvoices.totalAmount', 'Total Amount')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{Number(batchResponse.data.invoice.total_amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper> */}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                color="success"
                disabled={!outgoingInvoiceId || !!actionLoading}
                onClick={async () => {
                  if (!outgoingInvoiceId) return;
                  try {
                    setActionLoading('confirm');
                    await confirmOutgoingInvoice(outgoingInvoiceId);
                    navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                  } finally {
                    setActionLoading(null);
                  }
                }}
              >
                {actionLoading === 'confirm' ? (
                  <CircularProgress size={18} sx={{ color: '#fff' }} />
                ) : (
                  t('common.confirm', 'Confirm')
                )}
              </Button>
              <Button
                variant="contained"
                color="warning"
                disabled={!outgoingInvoiceId || !!actionLoading}
                onClick={async () => {
                  if (!outgoingInvoiceId) return;
                  try {
                    setActionLoading('cancel');
                    await cancelOutgoingInvoice(outgoingInvoiceId);
                    navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                  } finally {
                    setActionLoading(null);
                  }
                }}
              >
                {actionLoading === 'cancel' ? (
                  <CircularProgress size={18} sx={{ color: '#fff' }} />
                ) : (
                  t('common.cancel', 'Cancel')
                )}
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={!outgoingInvoiceId || !!actionLoading}
                onClick={async () => {
                  if (!outgoingInvoiceId) return;
                  const confirmed = window.confirm(t('common.deleteConfirmMessage', 'Are you sure?'));
                  if (!confirmed) return;

                  try {
                    setActionLoading('delete');
                    await deleteOutgoingInvoice(outgoingInvoiceId);
                    navigate(paths.warehouse.outgoingInvoices.root, { replace: true });
                  } finally {
                    setActionLoading(null);
                  }
                }}
              >
                {actionLoading === 'delete' ? (
                  <CircularProgress size={18} sx={{ color: '#fff' }} />
                ) : (
                  t('common.delete', 'Delete')
                )}
              </Button>
            </Box>
          </Box>
        )}

        {!isNewMode && !batchResponse && loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!isNewMode && !batchResponse && !loading && (
          <Box sx={{ py: 4 }}>
            <Typography color="text.secondary">
              {t('outgoingInvoices.notFound', 'Outgoing invoice not found')}
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              onClick={() => navigate(paths.warehouse.outgoingInvoices.root)}
            >
              {t('overview.warehouse.expensesInvoices', 'Expenses invoices')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default OutgoingInvoicesEditView;
