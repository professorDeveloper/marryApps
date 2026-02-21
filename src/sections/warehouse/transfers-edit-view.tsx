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

interface Branch {
  id: string;
  name: string;
}

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
      id={`transfers-tabpanel-${index}`}
      aria-labelledby={`transfers-tab-${index}`}
      {...other}
    >
      <Box sx={{ pt: 0, display: value === index ? 'block' : 'none' }}>{children}</Box>
    </div>
  );
}

interface TransfersEditViewProps {
  isNew?: boolean;
}
  
export function TransfersEditView({ isNew = false }: TransfersEditViewProps) {
  const { t } = useTranslation('menu');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getTransferById, createTransferBatch, updateTransfer, getTransferGroups } = useTransfersAPI();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fromStorages, setFromStorages] = useState<Storage[]>([]);
  const [toStorages, setToStorages] = useState<Storage[]>([]);
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

  const goToTransfers = useCallback(() => {
    navigate(paths.warehouse.transfers.root, { replace: true });
    window.setTimeout(() => {
      window.location.replace(paths.warehouse.transfers.root);
    }, 0);
  }, [navigate]);

  const handleItemsChange = useCallback((nextItems: TransferBatchItemInput[]) => {
    setItems(nextItems);
    itemsRef.current = nextItems;
  }, []);

  const handleFormDataChange = useCallback((data: Record<string, any>) => {
    setFormData(data as TransferFormData);
  }, []);

  const getStoragesByBranch = useCallback(async (branchId: string): Promise<Storage[]> => {
    if (!branchId) return [];

    try {
      const response = await fetcher<BackendResponse<Storage[]>>(endpoints.storage.byBranch(branchId));
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [groupsData, branchesData] = await Promise.all([
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
        ]);

        setGroups(groupsData);
        setBranches(Array.isArray(branchesData.data) ? branchesData.data : []);
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
          toast.error(t('error.notFound', 'Transfer not found'));
          navigate(paths.warehouse.transfers.root);
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

  useEffect(() => {
    let isMounted = true;

    const loadFromStorages = async () => {
      if (!formData.from_branch_id) {
        setFromStorages([]);
        return;
      }

      const branchStorages = await getStoragesByBranch(formData.from_branch_id);
      if (!isMounted) return;

      setFromStorages(branchStorages);

      if (
        formData.from_storage_id &&
        !branchStorages.some((storage) => storage.id === formData.from_storage_id)
      ) {
        setFormData((prev) =>
          prev.from_storage_id ? { ...prev, from_storage_id: '' } : prev
        );
      }
    };

    loadFromStorages();

    return () => {
      isMounted = false;
    };
  }, [formData.from_branch_id, formData.from_storage_id, getStoragesByBranch]);

  useEffect(() => {
    let isMounted = true;

    const loadToStorages = async () => {
      if (!formData.to_branch_id) {
        setToStorages([]);
        return;
      }

      const branchStorages = await getStoragesByBranch(formData.to_branch_id);
      if (!isMounted) return;

      setToStorages(branchStorages);

      if (
        formData.to_storage_id &&
        !branchStorages.some((storage) => storage.id === formData.to_storage_id)
      ) {
        setFormData((prev) => (prev.to_storage_id ? { ...prev, to_storage_id: '' } : prev));
      }
    };

    loadToStorages();

    return () => {
      isMounted = false;
    };
  }, [formData.to_branch_id, formData.to_storage_id, getStoragesByBranch]);

  const saveByBatch = useCallback(async () => {
    if (!itemsRef.current.length) {
      setActiveTab(1);
      throw new Error(t('deductions.itemsRequired', 'Please add at least one item'));
    }
    if (!formData.from_branch_id || !formData.to_branch_id) {
      setActiveTab(0);
      throw new Error(t('warehouse.branch', 'Please select branches'));
    }
    if (!formData.from_storage_id || !formData.to_storage_id) {
      setActiveTab(0);
      throw new Error(t('deductions.storageRequired', 'Please select storages'));
    }
    if (!formData.act_group_id) {
      setActiveTab(0);
      throw new Error(t('deductions.groupRequired', 'Please select group'));
    }

    const payload = {
      act_group_id: formData.act_group_id,
      description: formData.description || '',
      to_branch_id: formData.to_branch_id,
      to_storage_id: formData.to_storage_id,
      from_branch_id: formData.from_branch_id,
      from_storage_id: formData.from_storage_id,
      items: itemsRef.current,
    };

    if (isNew && !effectiveTransferId) {
      await createTransferBatch(payload);
      toast.success(t('common.createSuccess', 'Created successfully'));
      goToTransfers();
      return;
    }

    if (effectiveTransferId) {
      await updateTransfer(effectiveTransferId, {
        act_group_id: payload.act_group_id,
        description: payload.description,
        to_branch_id: payload.to_branch_id,
        to_storage_id: payload.to_storage_id,
        from_branch_id: payload.from_branch_id,
        from_storage_id: payload.from_storage_id,
        status: formData.status,
        date: formData.date,
      });
      toast.success(t('common.updateSuccess', 'Updated successfully'));
      goToTransfers();
    }
  }, [
    createTransferBatch,
    effectiveTransferId,
    formData,
    goToTransfers,
    isNew,
    t,
    updateTransfer,
  ]);

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

  const groupOptions = useMemo(
    () => groups.map((group) => ({ value: group.id, label: group.name })),
    [groups]
  );
  const branchOptions = useMemo(
    () => branches.map((branch) => ({ value: branch.id, label: branch.name })),
    [branches]
  );
  const fromStorageOptions = useMemo(
    () => fromStorages.map((storage) => ({ value: storage.id, label: storage.name })),
    [fromStorages]
  );
  const toStorageOptions = useMemo(
    () => toStorages.map((storage) => ({ value: storage.id, label: storage.name })),
    [toStorages]
  );

  const config = useMemo(
    () => ({
      title: isNew ? t('common.create', 'Create transfer') : t('common.edit', 'Edit transfer'),
      entityName: 'transfer',
      showBreadcrumbs: false,
      showDeleteButton: false,
      breadcrumbs: [
        { name: t('dashboard', 'Dashboard'), href: paths.dashboard.root },
        { name: t('overview.warehouse.title', 'Warehouse'), href: paths.warehouse.root },
        { name: t('overview.warehouse.transfers', 'Transfers'), href: paths.warehouse.transfers.root },
        { name: isNew ? t('common.create', 'Create') : t('common.edit', 'Edit'), href: '' },
      ],
      sections: [
        {
          id: 'basic',
          title: t('deductions.details', 'Details'),
          columns: 2,
          fields: [
            {
              key: 'from_branch_id',
              label: t('warehouse.branch', 'From branch'),
              type: 'select' as const,
              required: true,
              options: branchOptions,
              defaultValue: '',
            },
            {
              key: 'to_branch_id',
              label: t('warehouse.branch', 'To branch'),
              type: 'select' as const,
              required: true,
              options: branchOptions,
              defaultValue: '',
            },
            {
              key: 'from_storage_id',
              label: t('deductions.storage', 'From storage'),
              type: 'select' as const,
              required: true,
              options: fromStorageOptions,
              defaultValue: '',
            },
            {
              key: 'to_storage_id',
              label: t('warehouse.storage', 'To storage'),
              type: 'select' as const,
              required: true,
              options: toStorageOptions,
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
              defaultValue: '',
              rows: 3,
            },
          ],
        },
      ],
      onSubmit: handleSubmit as (formData: Record<string, any>) => Promise<void>,
    }),
    [isNew, t, branchOptions, fromStorageOptions, toStorageOptions, groupOptions, handleSubmit]
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
          <Tab label={t('common.edit', 'Details')} id="transfers-tab-0" />
          <Tab label={t('mealsProducts.calculate', 'Calculation')} id="transfers-tab-1" />
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

export default TransfersEditView;
