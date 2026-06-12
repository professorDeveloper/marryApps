import type { TFunction } from 'i18next';
import type { TransactionType } from 'src/types/transactions';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';

import { useTransactionsAPI } from 'src/hooks/use-transactions-api';

import { toast } from 'src/components/snackbar';
import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

interface TransactionsEditViewProps {
  isNew?: boolean;
}

const getPayTypeOptions = (t: TFunction) => [
  { value: 'cash', label: t('payType.cash') },
  { value: 'card', label: t('payType.card') },
];

const getTransactionTypeOptions = (t: TFunction) => [
  { value: 'income', label: t('transactions.income') },
  { value: 'expense', label: t('transactions.expense') },
  { value: 'transfer', label: t('transactions.transfer') },
];

const getDefaultType = (kind: string | null): TransactionType => {
  if (kind === 'expense' || kind === 'transfer') return kind;
  return 'income';
};

const toApiDate = (value: string) => {
  const date = dayjs(value);
  if (!date.isValid()) return new Date().toISOString();
  return date.startOf('day').toISOString();
};

export function TransactionsEditView({ isNew = false }: TransactionsEditViewProps) {
  const { t } = useTranslation('menu');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kind = searchParams.get('kind');

  const {
    getTransactionById,
    createIncomeExpense,
    createTransfer,
    updateTransaction,
    getTransactionGroups,
    getCashRegisters,
    getCashRegistersByBranch,
    getCurrentUser,
    getBranches,
  } = useTransactionsAPI();

  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(getDefaultType(kind));
  const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);
  const [cashRegisterOptions, setCashRegisterOptions] = useState<{ value: string; label: string }[]>([]);
  const [fromCashRegisterOptions, setFromCashRegisterOptions] = useState<{ value: string; label: string }[]>([]);
  const [toCashRegisterOptions, setToCashRegisterOptions] = useState<{ value: string; label: string }[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
  const [fromBranchOptions, setFromBranchOptions] = useState<{ value: string; label: string }[]>([]);
  const [myBranchId, setMyBranchId] = useState('');

  const [formData, setFormData] = useState<Record<string, any>>({
    type: getDefaultType(kind),
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    description: '',
    pay_type: 'cash',
    group_transaction_id: '',
    cash_register_id: '',
    from_branch_id: '',
    from_cash_register_id: '',
    to_branch_id: '',
    to_cash_register_id: '',
  });

  const loadBaseData = useCallback(async () => {
    try {
      const [groups, cashRegisters, branches, currentUser] = await Promise.all([
        getTransactionGroups(),
        getCashRegisters(),
        getBranches(),
        getCurrentUser(),
      ]);

      const nextBranchOptions = branches.map((item) => ({ value: item.id, label: item.name }));

      setGroupOptions(groups.map((item) => ({ value: item.id, label: item.name })));
      setCashRegisterOptions(cashRegisters.map((item) => ({ value: item.id, label: item.name })));
      setBranchOptions(nextBranchOptions);

      if (currentUser?.branch_id) {
        setMyBranchId(currentUser.branch_id);

        if (isNew) {
          const currentBranch = nextBranchOptions.find((item) => item.value === currentUser.branch_id);
          setFromBranchOptions(currentBranch ? [currentBranch] : []);
          setFormData((prev) => ({
            ...prev,
            from_branch_id: prev.from_branch_id || currentUser.branch_id,
          }));
        } else {
          setFromBranchOptions(nextBranchOptions);
        }
      } else {
        setFromBranchOptions(nextBranchOptions);
      }
    } catch (error) {
      console.error('Error loading base data:', error);
    }
  }, [getBranches, getCashRegisters, getCurrentUser, getTransactionGroups, isNew]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadBaseData();

        if (!isNew && id) {
          const data = await getTransactionById(id);
          if (!data) {
            toast.error('Transaction not found');
            navigate(paths.cashbox.transactions, { replace: true });
            return;
          }

          setTransactionType(data.type);
          setFormData({
            type: data.type,
            amount: data.amount || '',
            date: dayjs(data.date).isValid() ? dayjs(data.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            description: data.description || '',
            pay_type: data.pay_type || 'cash',
            group_transaction_id: data.group_transaction_id || '',
            cash_register_id: data.cash_register_id || '',
            from_branch_id: data.from_branch_id || '',
            from_cash_register_id: data.from_cash_register_id || '',
            to_branch_id: data.to_branch_id || '',
            to_cash_register_id: data.to_cash_register_id || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [getTransactionById, id, isNew, loadBaseData, navigate]);

  useEffect(() => {
    if (!isNew || transactionType !== 'transfer' || !myBranchId) return;

    setFormData((prev) => {
      if (prev.from_branch_id) return prev;
      return {
        ...prev,
        from_branch_id: myBranchId,
      };
    });
  }, [isNew, myBranchId, transactionType]);

  useEffect(() => {
    const loadFromBranchCashRegisters = async () => {
      if (transactionType !== 'transfer') {
        setFromCashRegisterOptions([]);
        return;
      }

      if (!formData.from_branch_id) {
        setFromCashRegisterOptions([]);
        setFormData((prev) => ({
          ...prev,
          from_cash_register_id: '',
        }));
        return;
      }

      try {
        const branchCashRegisters = await getCashRegistersByBranch(formData.from_branch_id);
        const options = branchCashRegisters.map((item) => ({ value: item.id, label: item.name }));
        setFromCashRegisterOptions(options);

        setFormData((prev) => {
          const exists = options.some((item) => item.value === prev.from_cash_register_id);
          if (exists) return prev;
          return {
            ...prev,
            from_cash_register_id: '',
          };
        });
      } catch (error) {
        console.error('Error loading from branch cash registers:', error);
        setFromCashRegisterOptions([]);
      }
    };

    loadFromBranchCashRegisters();
  }, [formData.from_branch_id, getCashRegistersByBranch, transactionType]);

  useEffect(() => {
    const loadToBranchCashRegisters = async () => {
      if (transactionType !== 'transfer') {
        setToCashRegisterOptions([]);
        return;
      }

      if (!formData.to_branch_id) {
        setToCashRegisterOptions([]);
        setFormData((prev) => ({
          ...prev,
          to_cash_register_id: '',
        }));
        return;
      }

      const branchCashRegisters = await getCashRegistersByBranch(formData.to_branch_id);
      const options = branchCashRegisters.map((item) => ({ value: item.id, label: item.name }));
      setToCashRegisterOptions(options);

      setFormData((prev) => {
        const exists = options.some((item) => item.value === prev.to_cash_register_id);
        if (exists) return prev;
        return {
          ...prev,
          to_cash_register_id: '',
        };
      });
    };

    loadToBranchCashRegisters();
  }, [formData.to_branch_id, getCashRegistersByBranch, transactionType]);

  const handleSubmit = useCallback(
    async (data: Record<string, any>) => {
      const type = (data.type || transactionType) as TransactionType;

      if (type === 'transfer') {
        const transferPayload = {
          amount: String(data.amount || 0),
          date: toApiDate(data.date),
          description: data.description || '',
          from_branch_id: data.from_branch_id,
          from_cash_register_id: data.from_cash_register_id,
          group_transaction_id: data.group_transaction_id,
          pay_type: data.pay_type,
          to_branch_id: data.to_branch_id,
          to_cash_register_id: data.to_cash_register_id,
        };

        if (isNew) {
          await createTransfer(transferPayload);
        } else if (id) {
          await updateTransaction(id, { ...transferPayload, type: 'transfer' });
        }
      } else {
        const incomeExpensePayload = {
          amount: String(data.amount || 0),
          cash_register_id: data.cash_register_id,
          date: toApiDate(data.date),
          description: data.description || '',
          group_transaction_id: data.group_transaction_id,
          pay_type: data.pay_type,
          type,
        } as const;

        if (isNew) {
          await createIncomeExpense(incomeExpensePayload);
        } else if (id) {
          await updateTransaction(id, incomeExpensePayload);
        }
      }

      toast.success(isNew ? t('common.createSuccess') : t('common.updateSuccess'));
      navigate(paths.cashbox.transactions, { replace: true });
    },
    [createIncomeExpense, createTransfer, id, isNew, navigate, t, transactionType, updateTransaction]
  );

  const sections = useMemo(() => {
    // Use visible property for dynamic field display - this is required for GenericEditV2
    // The visible callback receives the current form data and should return boolean
    const fields = [
      // Fields with options (selects) - always at the top
      {
        key: 'type',
        label: t('common.type'),
        type: 'select' as const,
        required: true,
        options: getTransactionTypeOptions(t),
        defaultValue: 'income',
      },
      {
        key: 'pay_type',
        label: t('common.paymentType'),
        type: 'select' as const,
        required: true,
        options: getPayTypeOptions(t),
        defaultValue: 'cash',
      },
      {
        key: 'group_transaction_id',
        label: t('deductions.group'),
        type: 'select' as const,
        required: true,
        options: groupOptions,
        defaultValue: '',
      },
      // Income/Expense specific - only visible when type is income or expense
      {
        key: 'cash_register_id',
        label: t('transactions.cashRegister'),
        type: 'select' as const,
        required: true,
        options: cashRegisterOptions,
        defaultValue: '',
        visible: (data: Record<string, any>) => data.type === 'income' || data.type === 'expense',
      },
      // Transfer specific fields - only visible when type is transfer
      // Layout: From branch (left) | To branch (right) on same row
      {
        key: 'from_branch_id',
        label: t('transactions.fromBranch'),
        type: 'select' as const,
        required: true,
        options: fromBranchOptions.length ? fromBranchOptions : branchOptions,
        defaultValue: '',
        visible: (data: Record<string, any>) => data.type === 'transfer',
      },
      {
        key: 'to_branch_id',
        label: t('transactions.toBranch'),
        type: 'select' as const,
        required: true,
        options: branchOptions,
        defaultValue: '',
        visible: (data: Record<string, any>) => data.type === 'transfer',
      },
      // From cash register (left) | To cash register (right) on same row below
      {
        key: 'from_cash_register_id',
        label: t('transactions.fromCashRegister'),
        type: 'select' as const,
        required: true,
        options: fromCashRegisterOptions.length ? fromCashRegisterOptions : cashRegisterOptions,
        defaultValue: '',
        visible: (data: Record<string, any>) => data.type === 'transfer',
      },
      {
        key: 'to_cash_register_id',
        label: t('transactions.toCashRegister'),
        type: 'select' as const,
        required: true,
        options: toCashRegisterOptions,
        defaultValue: '',
        visible: (data: Record<string, any>) => data.type === 'transfer',
      },
      // Non-select fields - below
      {
        key: 'amount',
        label: t('common.total'),
        type: 'number' as const,
        required: true,
        defaultValue: '',
      },
      {
        key: 'date',
        label: t('deductions.date'),
        type: 'date' as const,
        required: true,
        defaultValue: dayjs().format('YYYY-MM-DD'),
      },
      {
        key: 'description',
        label: t('deductions.description'),
        type: 'textarea' as const,
        rows: 3,
        defaultValue: '',
      },
    ];

    return [
      {
        id: 'transaction-details',
        title: t('transactions.transactionDetails'),
        columns: 2,
        fields,
      },
    ];
  }, [branchOptions, cashRegisterOptions, fromBranchOptions, fromCashRegisterOptions, groupOptions, t, toCashRegisterOptions, transactionType]);

  const config = useMemo(
    () => ({
      title: isNew ? 'Create transaction' : 'Edit transaction',
      entityName: 'transaction',
      showBreadcrumbs: false,
      showDeleteButton: false,
      breadcrumbs: [
        { name: t('dashboard'), href: paths.dashboard.root },
        { name: t('cashbox.sidebar.title'), href: paths.cashbox.root },
        { name: t('cashbox.sidebar.transactions'), href: paths.cashbox.transactions },
        { name: isNew ? t('common.create') : t('common.edit'), href: '' },
      ],
      sections,
      onSubmit: handleSubmit as (formData: Record<string, any>) => Promise<void>,
    }),
    [handleSubmit, isNew, sections, t]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <CustomBreadcrumbs heading={config.title} links={config.breadcrumbs} sx={{ mb: 3 }} />

        <GenericEditView
          config={config}
          data={formData}
          formData={formData}
          onFormDataChange={(next) => {
            const nextFormData =
              isNew && next.type === 'transfer' && myBranchId && !next.from_branch_id
                ? { ...next, from_branch_id: myBranchId }
                : next;

            setFormData(nextFormData);
            if ((next.type === 'income' || next.type === 'expense' || next.type === 'transfer') && next.type !== transactionType) {
              setTransactionType(next.type);
            }
          }}
          isNew={isNew}
          loading={loading}
        />
      </Box>
    </Box>
  );
}

export default TransactionsEditView;
