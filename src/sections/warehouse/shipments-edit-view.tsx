import type { ShipmentBatchItemInput, ShipmentBatchApiResponse } from 'src/types/shipments';

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
import { useSupplierAPI } from 'src/hooks/use-supplier-api';
import { useShipmentsAPI } from 'src/hooks/use-shipments-api';

import { fetcher, endpoints } from 'src/lib/axios';

import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import ShipmentsDetailsCalculation from 'src/components/shipments-details-calculation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ShipmentFormData {
  date: string;
  storage_id: string;
  supplier_id: string;
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
      id={`shipments-tabpanel-${index}`}
      aria-labelledby={`shipments-tab-${index}`}
      {...other}
    >
      <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>{children}</Box>
    </div>
  );
}

export function ShipmentsEditView() {
  const { t } = useTranslation('menu');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNewMode = !id;

  const { getSuppliers } = useSupplierAPI();
  const { getStorages } = useStorageAPI();
  const {
    getShipmentById,
    createShipmentBatch,
    confirmShipment,
    cancelShipment,
    deleteShipment,
    deleteShipmentItem,
  } = useShipmentsAPI();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | 'delete' | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [storages, setStorages] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ShipmentFormData>({
    date: dayjs().format('YYYY-MM-DD'),
    storage_id: '',
    supplier_id: '',
    description: '',
  });

  const [items, setItems] = useState<ShipmentBatchItemInput[]>([]);
  const [batchResponse, setBatchResponse] = useState<ShipmentBatchApiResponse | null>(null);
  const itemsRef = useRef<ShipmentBatchItemInput[]>([]);

  const mapResponseToState = useCallback((response: ShipmentBatchApiResponse) => {
    setBatchResponse(response);
    setFormData({
      date: dayjs(response.data.shipment.date).format('YYYY-MM-DD'),
      storage_id: response.data.shipment.storage_id,
      supplier_id: response.data.shipment.supplier_id,
      description: response.data.shipment.description || '',
    });
    const mappedItems = response.data.items.map((item) => ({
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
    }));
    setItems(mappedItems);
    itemsRef.current = mappedItems;
  }, []);

  const loadShipmentDetails = useCallback(
    async (shipmentId: string) => {
      const details = await getShipmentById(shipmentId);
      if (!details) {
        navigate(paths.warehouse.shipments.root, { replace: true });
        return;
      }
      mapResponseToState(details);
    },
    [getShipmentById, mapResponseToState, navigate]
  );

  const handleItemsChange = useCallback((nextItems: ShipmentBatchItemInput[]) => {
    setItems(nextItems);
    itemsRef.current = nextItems;
  }, []);

  const handleFormDataChange = useCallback((data: Record<string, any>) => {
    setFormData(data as ShipmentFormData);
  }, []);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [storagesData, suppliersData, ingredientsData] = await Promise.all([
          getStorages(),
          getSuppliers(),
          fetcher<BackendResponse<Ingredient[]>>(endpoints.ingredient.list).catch(() => ({
            status: 'error',
            message: 'failed',
            data: [],
            code: 500,
          })),
        ]);
        setStorages(storagesData);
        setSuppliers(suppliersData);
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
  }, [getStorages, getSuppliers]);

  useEffect(() => {
    if (!id) return;
    loadShipmentDetails(id);
  }, [id, loadShipmentDetails]);

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
    if (!formData.supplier_id) {
      setActiveTab(0);
      throw new Error(t('warehouse.invoices.supplierRequired', 'Please select supplier'));
    }

    const response = await createShipmentBatch({
      date: normalizeDateForApi(formData.date),
      description: formData.description || '',
      storage_id: formData.storage_id,
      supplier_id: formData.supplier_id,
      items: itemsRef.current,
    });

    mapResponseToState(response);
  }, [createShipmentBatch, formData, mapResponseToState, normalizeDateForApi, t]);

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
  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
    [suppliers]
  );

  const config = useMemo(
    () => ({
      title: isNewMode ? t('shipments.create', 'Create shipment') : t('shipments.view', 'View shipment'),
      entityName: 'shipment',
      showBreadcrumbs: false,
      showDeleteButton: false,
      breadcrumbs: [
        { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
        { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
        { name: t('overview.warehouse.shipments', 'Shipments'), href: paths.warehouse.shipments.root },
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
              key: 'supplier_id',
              label: t('invoices.name', 'Supplier'),
              type: 'select' as const,
              required: true,
              options: supplierOptions,
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
    [handleSubmit, isNewMode, storageOptions, supplierOptions, t]
  );

  const shipmentId = batchResponse?.data?.shipment?.id;

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
                <Tab label={t('common.edit', 'Details')} id="shipments-tab-0" />
                <Tab label={t('mealsProducts.calculate', 'Calculation')} id="shipments-tab-1" />
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
              <Tab label={t('common.edit', 'Details')} id="shipments-tab-0" />
              <Tab label={t('shipments.items', 'Items')} id="shipments-tab-1" />
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
                {t('shipments.shipment', 'Shipment')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('deductions.number', 'Number')}</TableCell>
                      <TableCell>{t('deductions.date', 'Date')}</TableCell>
                      <TableCell>{t('deductions.status', 'Status')}</TableCell>
                      <TableCell>{t('deductions.storage', 'Storage')}</TableCell>
                      <TableCell>{t('invoices.name', 'Supplier')}</TableCell>
                      <TableCell>{t('shipments.totalAmount', 'Total Amount')}</TableCell>
                      <TableCell>{t('shipments.paidAmount', 'Paid Amount')}</TableCell>
                      <TableCell>{t('deductions.description', 'Description')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{batchResponse.data.shipment.number}</TableCell>
                      <TableCell>{new Date(batchResponse.data.shipment.date).toLocaleString()}</TableCell>
                      <TableCell>{batchResponse.data.shipment.status}</TableCell>
                      <TableCell>
                        {storageOptions.find((s) => s.value === batchResponse.data.shipment.storage_id)?.label
                          || batchResponse.data.shipment.storage_id}
                      </TableCell>
                      <TableCell>
                        {supplierOptions.find((s) => s.value === batchResponse.data.shipment.supplier_id)?.label
                          || batchResponse.data.shipment.supplier_id}
                      </TableCell>
                      <TableCell>{batchResponse.data.shipment.total_amount}</TableCell>
                      <TableCell>{batchResponse.data.shipment.paid_amount}</TableCell>
                      <TableCell>{batchResponse.data.shipment.description}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('shipments.items', 'Items')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{t('warehouse.ingredient', 'Ingredient')}</TableCell>
                      <TableCell>{t('calculation.quantity', 'Quantity')}</TableCell>
                      <TableCell>{t('shipments.pricePerUnit', 'Price / Unit')}</TableCell>
                      <TableCell>{t('shipments.totalAmount', 'Total Amount')}</TableCell>
                      <TableCell>{t('shipments.stockBefore', 'Stock Before')}</TableCell>
                      <TableCell>{t('shipments.stockAfter', 'Stock After')}</TableCell>
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
                            disabled={!shipmentId || deletingItemId === item.id}
                            onClick={async () => {
                              if (!shipmentId) return;
                              try {
                                setDeletingItemId(item.id);
                                await deleteShipmentItem(shipmentId, item.id);
                                await loadShipmentDetails(shipmentId);
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

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t('shipments.totals', 'Totals')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('shipments.totalAmount', 'Total Amount')}</TableCell>
                      <TableCell>{t('shipments.paidAmount', 'Paid Amount')}</TableCell>
                      <TableCell>{t('deductions.balance', 'Balance')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{Number(batchResponse.data.shipment.total_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{Number(batchResponse.data.shipment.paid_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {(
                          Number(batchResponse.data.shipment.total_amount || 0) -
                          Number(batchResponse.data.shipment.paid_amount || 0)
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                color="success"
                disabled={!shipmentId || !!actionLoading}
                onClick={async () => {
                  if (!shipmentId) return;
                  try {
                    setActionLoading('confirm');
                    await confirmShipment(shipmentId);
                    navigate(paths.warehouse.shipments.root, { replace: true });
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
                disabled={!shipmentId || !!actionLoading}
                onClick={async () => {
                  if (!shipmentId) return;
                  try {
                    setActionLoading('cancel');
                    await cancelShipment(shipmentId);
                    navigate(paths.warehouse.shipments.root, { replace: true });
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
                disabled={!shipmentId || !!actionLoading}
                onClick={async () => {
                  if (!shipmentId) return;
                  const confirmed = window.confirm(t('common.deleteConfirmMessage', 'Are you sure?'));
                  if (!confirmed) return;

                  try {
                    setActionLoading('delete');
                    await deleteShipment(shipmentId);
                    navigate(paths.warehouse.shipments.root, { replace: true });
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
              {t('shipments.notFound', 'Shipment not found')}
            </Typography>
            <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(paths.warehouse.shipments.root)}>
              {t('overview.warehouse.shipments', 'Shipments')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ShipmentsEditView;
