import type { TFunction } from 'i18next';
import type { TransactionType } from 'src/types/transactions';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  DialogTitle,
  CardContent,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useTransactionsAPI } from 'src/hooks/use-transactions-api';
import {
  useBranchesList,
  useCashRegistersList,
  useTransactionGroupsList,
} from 'src/hooks/use-reference-data';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type TransactionCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const PAY_TYPE_OPTIONS = (t: TFunction) => [
  { value: 'cash', label: t('payType.cash') },
  { value: 'card', label: t('payType.card') },
  { value: 'transfer', label: t('payType.transfer') },
];

export function TransactionCreateDialog({ open, onClose, onSuccess }: TransactionCreateDialogProps) {
  const { t } = useTranslation('menu');
  const {
    createIncomeExpense,
    createTransfer,
    getCashRegistersByBranch,
    getCurrentUser,
  } = useTransactionsAPI();

  // Shared reference data (SWR-deduped across views/mounts)
  const { transactionGroups } = useTransactionGroupsList();
  const { cashRegisters } = useCashRegistersList();
  const { branches } = useBranchesList();

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType | null>(null);

  const [toCashRegisterOptions, setToCashRegisterOptions] = useState<{ value: string; label: string }[]>([]);
  const [myBranchId, setMyBranchId] = useState('');

  const groupOptions = useMemo(
    () => transactionGroups.map((item) => ({ value: item.id, label: item.name })),
    [transactionGroups]
  );
  const cashRegisterOptions = useMemo(
    () => cashRegisters.map((item) => ({ value: item.id, label: item.name })),
    [cashRegisters]
  );
  const branchOptions = useMemo(
    () => branches.map((item) => ({ value: item.id, label: item.name })),
    [branches]
  );

  const [formData, setFormData] = useState<Record<string, any>>({
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadBaseData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const currentUser = await getCurrentUser();

      if (currentUser?.branch_id) {
        setMyBranchId(currentUser.branch_id);
        setFormData((prev) => ({
          ...prev,
          from_branch_id: currentUser.branch_id,
        }));
      }
    } catch (error) {
      console.error('Error loading base data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load data';
      setLoadError(errorMsg);
      toast.error(t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [getCurrentUser, t]);

  useEffect(() => {
    if (open) {
      loadBaseData();
      setTransactionType(null);
      setFormData({
        amount: '',
        date: dayjs().format('YYYY-MM-DD'),
        description: '',
        pay_type: 'cash',
        group_transaction_id: '',
        cash_register_id: '',
        from_branch_id: myBranchId || '',
        from_cash_register_id: '',
        to_branch_id: '',
        to_cash_register_id: '',
      });
      setErrors({});
    }
  }, [open, loadBaseData]);

  useEffect(() => {
    const loadToBranchCashRegisters = async () => {
      if (!formData.to_branch_id) {
        setToCashRegisterOptions([]);
        setFormData((prev) => ({
          ...prev,
          to_cash_register_id: '',
        }));
        return;
      }

      const branchCashRegisters = await getCashRegistersByBranch(formData.to_branch_id);
      setToCashRegisterOptions(branchCashRegisters.map((item) => ({ value: item.id, label: item.name })));
    };

    if (transactionType === 'transfer') {
      loadToBranchCashRegisters();
    }
  }, [formData.to_branch_id, getCashRegistersByBranch, transactionType]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = t('validation.required');
    }

    if (!formData.date) {
      newErrors.date = t('validation.required');
    }

    if (!formData.group_transaction_id) {
      newErrors.group_transaction_id = t('validation.required');
    }

    if (transactionType === 'transfer') {
      if (!formData.from_branch_id) {
        newErrors.from_branch_id = t('validation.required');
      }
      if (!formData.to_branch_id) {
        newErrors.to_branch_id = t('validation.required');
      }
      if (!formData.from_cash_register_id) {
        newErrors.from_cash_register_id = t('validation.required');
      }
      if (!formData.to_cash_register_id) {
        newErrors.to_cash_register_id = t('validation.required');
      }
      if (formData.from_branch_id === formData.to_branch_id && 
          formData.from_cash_register_id === formData.to_cash_register_id) {
        newErrors.to_cash_register_id = t('validation.sameRegister');
      }
    } else {
      if (!formData.cash_register_id) {
        newErrors.cash_register_id = t('validation.required');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, transactionType, t]);

  const toApiDate = useCallback((value: string) => {
    const date = dayjs(value);
    if (!date.isValid()) return new Date().toISOString();
    // Format as ISO string (dayjs defaults to local time, which is what we want for dates)
    return date.startOf('day').toISOString();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !transactionType) return;

    setSubmitting(true);
    try {
      if (transactionType === 'transfer') {
        await createTransfer({
          amount: String(formData.amount),
          date: toApiDate(formData.date),
          description: formData.description || '',
          from_branch_id: formData.from_branch_id,
          from_cash_register_id: formData.from_cash_register_id,
          group_transaction_id: formData.group_transaction_id,
          pay_type: formData.pay_type,
          to_branch_id: formData.to_branch_id,
          to_cash_register_id: formData.to_cash_register_id,
        });
      } else {
        await createIncomeExpense({
          amount: String(formData.amount),
          cash_register_id: formData.cash_register_id,
          date: toApiDate(formData.date),
          description: formData.description || '',
          group_transaction_id: formData.group_transaction_id,
          pay_type: formData.pay_type,
          type: transactionType,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('transactions.createError', { message: errorMsg }));
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, transactionType, formData, createTransfer, createIncomeExpense, toApiDate, onSuccess, onClose]);

  const handleTypeSelect = useCallback((type: TransactionType) => {
    setTransactionType(type);
    setErrors({});
  }, []);

  const handleBack = useCallback(() => {
    setTransactionType(null);
    setErrors({});
  }, []);

  const renderTypeSelection = () => (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t('transactions.selectType')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card
          role="button"
          tabIndex={0}
          sx={{
            flex: 1,
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'success.main',
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => handleTypeSelect('income')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTypeSelect('income');
            }
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Iconify icon="solar:import-bold" width={28} color="success.main" />
            </Box>
            <Typography variant="h6" color="success.main">
              {t('transactions.income')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('transactions.incomeDesc')}
            </Typography>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          sx={{
            flex: 1,
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'error.main',
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => handleTypeSelect('expense')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTypeSelect('expense');
            }
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'error.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Iconify icon="solar:export-bold" width={28} color="error.main" />
            </Box>
            <Typography variant="h6" color="error.main">
              {t('transactions.expense')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('transactions.expenseDesc')}
            </Typography>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          sx={{
            flex: 1,
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => handleTypeSelect('transfer')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTypeSelect('transfer');
            }
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Iconify icon="solar:forward-bold" width={28} color="primary.main" />
            </Box>
            <Typography variant="h6" color="primary.main">
              {t('transactions.transfer')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('transactions.transferDesc')}
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );

  const renderForm = () => {
    const isTransfer = transactionType === 'transfer';

    return (
      <Stack spacing={2} sx={{ py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Button
            size="small"
            startIcon={<Iconify icon="solar:reply-bold" />}
            onClick={handleBack}
          >
            {t('common.back')}
          </Button>
          <Typography variant="subtitle1">
            {isTransfer
              ? t('transactions.newTransfer')
              : transactionType === 'income'
              ? t('transactions.newIncome')
              : t('transactions.newExpense')}
          </Typography>
        </Stack>

        <TextField
          label={t('common.total')}
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          error={!!errors.amount}
          helperText={errors.amount}
          required
          fullWidth
        />

        <TextField
          label={t('deductions.date')}
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          error={!!errors.date}
          helperText={errors.date}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth required error={!!errors.pay_type}>
          <InputLabel>{t('common.paymentType')}</InputLabel>
          <Select
            value={formData.pay_type}
            onChange={(e) => handleChange('pay_type', e.target.value)}
            label={t('common.paymentType')}
          >
            {PAY_TYPE_OPTIONS(t).map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required error={!!errors.group_transaction_id}>
          <InputLabel>{t('deductions.group')}</InputLabel>
          <Select
            value={formData.group_transaction_id}
            onChange={(e) => handleChange('group_transaction_id', e.target.value)}
            label={t('deductions.group')}
          >
            {groupOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {errors.group_transaction_id && (
            <Typography variant="caption" color="error">
              {errors.group_transaction_id}
            </Typography>
          )}
        </FormControl>

        {isTransfer ? (
          <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required error={!!errors.from_branch_id}>
                <InputLabel>{t('transactions.fromBranch')}</InputLabel>
                <Select
                  value={formData.from_branch_id}
                  onChange={(e) => handleChange('from_branch_id', e.target.value)}
                  label={t('transactions.fromBranch')}
                >
                  {branchOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.from_branch_id && (
                  <Typography variant="caption" color="error">
                    {errors.from_branch_id}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth required error={!!errors.to_branch_id}>
                <InputLabel>{t('transactions.toBranch')}</InputLabel>
                <Select
                  value={formData.to_branch_id}
                  onChange={(e) => handleChange('to_branch_id', e.target.value)}
                  label={t('transactions.toBranch')}
                >
                  {branchOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.to_branch_id && (
                  <Typography variant="caption" color="error">
                    {errors.to_branch_id}
                  </Typography>
                )}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required error={!!errors.from_cash_register_id}>
                <InputLabel>{t('transactions.fromRegister')}</InputLabel>
                <Select
                  value={formData.from_cash_register_id}
                  onChange={(e) => handleChange('from_cash_register_id', e.target.value)}
                  label={t('transactions.fromRegister')}
                >
                  {cashRegisterOptions
                    .filter((opt) => {
                      // If from_branch_id is selected, filter by branch association
                      if (!formData.from_branch_id) return true;
                      // Note: In a real implementation, cash registers would have branch_id
                      // For now, show all options if no branch filtering available
                      return true;
                    })
                    .map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.from_cash_register_id && (
                  <Typography variant="caption" color="error">
                    {errors.from_cash_register_id}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth required error={!!errors.to_cash_register_id}>
                <InputLabel>{t('transactions.toRegister')}</InputLabel>
                <Select
                  value={formData.to_cash_register_id}
                  onChange={(e) => handleChange('to_cash_register_id', e.target.value)}
                  label={t('transactions.toRegister')}
                  disabled={!formData.to_branch_id}
                >
                  {toCashRegisterOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.to_cash_register_id && (
                  <Typography variant="caption" color="error">
                    {errors.to_cash_register_id}
                  </Typography>
                )}
              </FormControl>
            </Stack>
          </>
        ) : (
          <FormControl fullWidth required error={!!errors.cash_register_id}>
            <InputLabel>{t('cashbox.cashiers.title')}</InputLabel>
            <Select
              value={formData.cash_register_id}
              onChange={(e) => handleChange('cash_register_id', e.target.value)}
              label={t('cashbox.cashiers.title')}
            >
              {cashRegisterOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {errors.cash_register_id && (
              <Typography variant="caption" color="error">
                {errors.cash_register_id}
              </Typography>
            )}
          </FormControl>
        )}

        <TextField
          label={t('deductions.description')}
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          fullWidth
        />
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {transactionType === null
          ? t('transactions.createTransaction')
          : transactionType === 'transfer'
          ? t('transactions.newTransfer')
          : transactionType === 'income'
          ? t('transactions.newIncome')
          : t('transactions.newExpense')}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : loadError ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={loadBaseData} variant="outlined">
                {t('common.retry')}
              </Button>
            </Box>
          </Box>
        ) : transactionType === null ? (
          renderTypeSelection()
        ) : (
          renderForm()
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          {t('common.cancel')}
        </Button>
        {transactionType !== null && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting
              ? t('common.creating')
              : t('common.create')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
