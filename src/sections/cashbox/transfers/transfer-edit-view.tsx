import type { Transfer, TransferFormData, TransferBatchItemInput } from 'src/types/transfers';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { Box, Tab, Tabs, Stack } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useTransfersAPI } from 'src/hooks/use-transfers-api';

import { fetcher, endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import TransfersDetailsCalculation from 'src/components/transfers-details-calculation';

import type { Branch, Storage } from './types';

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transactions-tabpanel-${index}`}
      aria-labelledby={`transactions-tab-${index}`}
      {...other}
    >
      <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>{children}</Box>
    </div>
  );
}

interface TransactionsEditViewProps {
  isNew?: boolean;
}

export function TransactionsEditView({ isNew = false }: TransactionsEditViewProps) {
  const { t } = useTranslation('menu');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getTransferById,
    createTransferBatch,
    updateTransferItemsBatch,
    getTransferGroups,
  } = useTransfersAPI();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [storages, setStorages] = useState<Storage[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState<TransferFormData>({
    act_group_id: '',
    description: '',
    to_branch_id: '',
    to_storage_id: '',
    from_branch_id: '',
    from_storage_id: '',
    status: 'active',
    date: dayjs().format('YYYY-MM-DD'),
  });

  const [items, setItems] = useState<TransferBatchItemInput[]>([]);
  const itemsRef = useRef<TransferBatchItemInput[]>([]);

  const effectiveTransferId = id || transfer?.id;

  const goToTransactions = useCallback(() => {
    navigate(paths.cashbox.transactions, { replace: true });
    // Fallback for cases when URL changes but stale edit view remains mounted.
    window.setTimeout(() => {
      window.location.replace(paths.cashbox.transactions);
    }, 0);
  }, [navigate]);

  const handleItemsChange = useCallback((nextItems: TransferBatchItemInput[]) => {
    setItems(nextItems);
    itemsRef.current = nextItems;
  }, []);

  const handleFormDataChange = useCallback((data: Record<string, any>) => {
    setFormData(data as TransferFormData);
  }, []);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [groupsData, branchesData, storagesData] = await Promise.all([
          getTransferGroups(),
          fetcher<BackendResponse<Branch[]>>(endpoints.branches.list).catch(
            () =>
              ({
                status: 'error',
                message: 'failed',
                data: [],
                code: 500,
              }) as BackendResponse<Branch[]>
          ),
          fetcher<BackendResponse<Storage[]>>(endpoints.storage.list).catch(
            () =>
              ({
                status: 'error',
                message: 'failed',
                data: [],
                code: 500,
              }) as BackendResponse<Storage[]>
          ),
        ]);

        setGroups(groupsData);
        setBranches(Array.isArray(branchesData.data) ? branchesData.data : []);
        setStorages(Array.isArray(storagesData.data) ? storagesData.data : []);
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [getTransferGroups]);

  useEffect(() => {
    if (isNew || !id) return;

    const loadTransfer = async () => {
      try {
        setLoading(true);
        const data = await getTransferById(id);
        if (!data) {
          toast.error(t('error.notFound'));
          navigate(paths.cashbox.transactions);
          return;
        }

        setTransfer(data);
        setFormData({
          act_group_id: data.act_group_id,
          description: data.description || '',
          to_branch_id: data.to_branch_id,
          to_storage_id: data.to_storage_id,
          from_branch_id: data.from_branch_id,
          from_storage_id: data.from_storage_id,
          status: data.status || 'active',
          date: dayjs(data.date).format('YYYY-MM-DD'),
        });

        const currentItems =
          data.items?.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
          })) || [];
        setItems(currentItems);
        itemsRef.current = currentItems;
      } finally {
        setLoading(false);
      }
    };

    loadTransfer();
  }, [getTransferById, id, isNew, navigate, t]);

  const validateBaseFields = useCallback(() => {
    if (!formData.from_branch_id || !formData.to_branch_id) {
      setActiveTab(0);
      throw new Error(t('warehouse.branch'));
    }
    if (!formData.from_storage_id || !formData.to_storage_id) {
      setActiveTab(0);
      throw new Error(t('deductions.storageRequired'));
    }
    if (!formData.act_group_id) {
      setActiveTab(0);
      throw new Error(t('deductions.groupRequired'));
    }
  }, [formData.act_group_id, formData.from_branch_id, formData.from_storage_id, formData.to_branch_id, formData.to_storage_id, t]);

  const handleSubmit = useCallback(async () => {
    validateBaseFields();

    if (isNew && !effectiveTransferId) {
      if (!itemsRef.current.length) {
        setActiveTab(1);
        throw new Error(t('deductions.itemsRequired'));
      }

      await createTransferBatch({
        act_group_id: formData.act_group_id,
        description: formData.description || '',
        to_branch_id: formData.to_branch_id,
        to_storage_id: formData.to_storage_id,
        from_branch_id: formData.from_branch_id,
        from_storage_id: formData.from_storage_id,
        items: itemsRef.current,
      });
      toast.success(t('common.createSuccess'));
      goToTransactions();
      return;
    }

    if (effectiveTransferId) {
      await updateTransferItemsBatch(effectiveTransferId, {
        act_group_id: formData.act_group_id,
        date: formData.date,
        description: formData.description || '',
        from_storage_id: formData.from_storage_id,
        to_storage_id: formData.to_storage_id,
        status: formData.status,
        items: itemsRef.current,
      });
      toast.success(t('common.updateSuccess'));
      goToTransactions();
    }
  }, [
    createTransferBatch,
    effectiveTransferId,
    formData,
    goToTransactions,
    isNew,
    t,
    updateTransferItemsBatch,
    validateBaseFields,
  ]);

  const handleItemsSave = useCallback(async () => {
    try {
      setSavingItems(true);
      validateBaseFields();

      if (!itemsRef.current.length) {
        setActiveTab(1);
        throw new Error(t('deductions.itemsRequired'));
      }

      if (isNew && !effectiveTransferId) {
        await createTransferBatch({
          act_group_id: formData.act_group_id,
          description: formData.description || '',
          to_branch_id: formData.to_branch_id,
          to_storage_id: formData.to_storage_id,
          from_branch_id: formData.from_branch_id,
          from_storage_id: formData.from_storage_id,
          items: itemsRef.current,
        });
        toast.success(t('common.createSuccess'));
        goToTransactions();
        return;
      }

      if (effectiveTransferId) {
        await updateTransferItemsBatch(effectiveTransferId, {
          act_group_id: formData.act_group_id,
          date: formData.date,
          description: formData.description || '',
          from_storage_id: formData.from_storage_id,
          to_storage_id: formData.to_storage_id,
          status: formData.status,
          items: itemsRef.current,
        });
        toast.success(t('common.updateSuccess'));
        goToTransactions();
      }
    } finally {
      setSavingItems(false);
    }
  }, [
    createTransferBatch,
    effectiveTransferId,
    formData,
    goToTransactions,
    isNew,
    t,
    updateTransferItemsBatch,
    validateBaseFields,
  ]);

  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: group.id, label: group.name })),
    [groups]
  );
  const branchOptions = useMemo(
    () => branches.map((branch) => ({ value: branch.id, label: branch.name })),
    [branches]
  );
  const storageOptions = useMemo(
    () => storages.map((storage) => ({ value: storage.id, label: storage.name })),
    [storages]
  );

  const config = useMemo(
    () => ({
      title: isNew ? t('common.create') : t('common.edit'),
      entityName: 'transfer',
      showBreadcrumbs: false,
      showDeleteButton: false,
      breadcrumbs: [
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('cashbox.sidebar.title'), href: paths.cashbox.root },
        { name: t('cashbox.sidebar.transactions'), href: paths.cashbox.transactions },
        { name: isNew ? t('common.create') : t('common.edit'), href: '' },
      ],
      sections: [
        {
          id: 'basic',
          title: t('deductions.details'),
          columns: 2,
          fields: [
            {
              key: 'from_branch_id',
              label: t('warehouse.branch'),
              type: 'select' as const,
              required: true,
              options: branchOptions,
              defaultValue: '',
            },
            {
              key: 'to_branch_id',
              label: t('warehouse.branch'),
              type: 'select' as const,
              required: true,
              options: branchOptions,
              defaultValue: '',
            },
            {
              key: 'from_storage_id',
              label: t('deductions.storage'),
              type: 'select' as const,
              required: true,
              options: storageOptions,
              defaultValue: '',
            },
            {
              key: 'to_storage_id',
              label: t('warehouse.storage'),
              type: 'select' as const,
              required: true,
              options: storageOptions,
              defaultValue: '',
            },
            {
              key: 'act_group_id',
              label: t('deductions.group'),
              type: 'select' as const,
              required: true,
              options: groupOptions,
              defaultValue: '',
            },
            {
              key: 'status',
              label: t('deductions.status'),
              type: 'select' as const,
              options: [
                { value: 'active', label: t('deductions.active') },
                { value: 'deleted', label: t('deductions.deleted') },
              ],
              defaultValue: 'active',
            },
            {
              key: 'description',
              label: t('deductions.description'),
              type: 'textarea' as const,
              defaultValue: '',
              rows: 3,
            },
          ],
        },
      ],
      onSubmit: handleSubmit as (formData: Record<string, any>) => Promise<void>,
    }),
    [isNew, t, branchOptions, storageOptions, groupOptions, handleSubmit]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <CustomBreadcrumbs heading={config.title} links={config.breadcrumbs} sx={{ mb: 3 }} />

        <Tabs
          value={activeTab}
          onChange={(_, next) => setActiveTab(next)}
          variant="fullWidth"
          sx={{ mb: 0, width: '100%' }}
        >
          <Tab label={t('common.edit')} id="transactions-tab-0" />
          <Tab label={t('mealsProducts.calculate')} id="transactions-tab-1" />
        </Tabs>

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

        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3} sx={{ p: 3 }}>
            <TransfersDetailsCalculation
              items={items}
              onItemsChange={handleItemsChange}
              onSave={handleItemsSave}
              saving={savingItems}
            />
          </Stack>
        </TabPanel>
      </Box>
    </Box>
  );
}

export default TransactionsEditView;
