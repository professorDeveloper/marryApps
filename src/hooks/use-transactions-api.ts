import type { AxiosError } from 'axios';
import type {
  ICurrentUser,
  ITransaction,
  IBranchOption,
  IUserOption,
  TransferPayload,
  ITransactionGroup,
  TransactionFilters,
  ICashRegisterOption,
  IncomeExpensePayload,
  TransactionReportFilters,
  TransactionReportResponse,
} from 'src/types/transactions';

import { toast } from 'sonner';
import { useCallback } from 'react';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError?.response?.data?.message || (error as Error)?.message || fallback;
};

export function useTransactionsAPI() {
  const getTransactionsReport = useCallback(
    async (filters: TransactionReportFilters = {}): Promise<TransactionReportResponse> => {
      const fallback: TransactionReportResponse = {
        balance: { card_total: '0', cash_total: '0', total: '0', type: '' },
        closing_balance: '0',
        day_balance: '0',
        expense_groups: [],
        income_groups: [],
        opening_balance: '0',
        summary: [],
        total_expense: '0',
        total_income: '0',
      };

      try {
        const params = Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null)
        );

        const response = await fetcher<TransactionReportResponse>([
          endpoints.cashbox.report,
          { params },
        ]);

        return response || fallback;
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to fetch transactions report'));
        return fallback;
      }
    },
    []
  );

  const getTransactions = useCallback(async (filters: TransactionFilters = {}): Promise<ITransaction[]> => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null)
      );

      const response = await fetcher<BackendResponse<ITransaction[]>>([
        endpoints.cashbox.transactions.root,
        { params },
      ]);

      return response.data || [];
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch transactions'));
      return [];
    }
  }, []);

  const getTransactionById = useCallback(async (id: string): Promise<ITransaction | null> => {
    try {
      const response = await fetcher<BackendResponse<ITransaction>>(endpoints.cashbox.transactions.details(id));
      return response.data || null;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch transaction'));
      return null;
    }
  }, []);

  const createIncomeExpense = useCallback(async (payload: IncomeExpensePayload): Promise<ITransaction> => {
    try {
      const response = await poster<BackendResponse<ITransaction>>(
        '/api/v1/transactions/income-expense',
        payload
      );
      toast.success('Transaction created successfully');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create transaction');
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  const createTransfer = useCallback(async (payload: TransferPayload): Promise<ITransaction> => {
    try {
      const response = await poster<BackendResponse<ITransaction>>('/api/v1/transactions/transfer', payload);
      toast.success('Transfer created successfully');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create transfer');
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, payload: Record<string, any>): Promise<ITransaction> => {
    try {
      const response = await putter<BackendResponse<ITransaction>>(
        endpoints.cashbox.transactions.details(id),
        payload
      );
      toast.success('Transaction updated successfully');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update transaction');
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      await deleter(endpoints.cashbox.transactions.details(id));
      toast.success('Transaction deleted successfully');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete transaction');
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  const getTransactionGroups = useCallback(async (): Promise<ITransactionGroup[]> => {
    try {
      const response = await fetcher<BackendResponse<ITransactionGroup[]>>(endpoints.cashbox.groupTransactions.root);
      return response.data || [];
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch transaction groups'));
      return [];
    }
  }, []);

  const getCashRegisters = useCallback(async (): Promise<ICashRegisterOption[]> => {
    try {
      const response = await fetcher<BackendResponse<ICashRegisterOption[]>>(endpoints.cashbox.cashRegisters.root);
      return response.data || [];
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch cash registers'));
      return [];
    }
  }, []);

  const getCashRegistersByBranch = useCallback(async (branchId: string): Promise<ICashRegisterOption[]> => {
    if (!branchId) return [];

    try {
      const response = await fetcher<BackendResponse<ICashRegisterOption[]> | ICashRegisterOption[]>(
        endpoints.cashbox.cashRegisters.byBranch(branchId)
      );

      if (Array.isArray(response)) return response;
      return response.data || [];
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch branch cash registers'));
      return [];
    }
  }, []);

  const getCurrentUser = useCallback(async (): Promise<ICurrentUser | null> => {
    try {
      const response = await fetcher<BackendResponse<ICurrentUser>>(endpoints.users.me);
      return response.data || null;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch current user'));
      return null;
    }
  }, []);

  const getBranches = useCallback(async (): Promise<IBranchOption[]> => {
    try {
      const response = await fetcher<BackendResponse<IBranchOption[]>>(endpoints.branches.list);
      return response.data || [];
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch branches'));
      return [];
    }
  }, []);

  const getStaffUsers = useCallback(async (): Promise<IUserOption[]> => {
    try {
      const response = await fetcher<BackendResponse<IUserOption[]> | IUserOption[]>(endpoints.users.staff);
      if (Array.isArray(response)) return response;
      return response.data || [];
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch staff users'));
      return [];
    }
  }, []);

  return {
    getTransactionsReport,
    getTransactions,
    getTransactionById,
    createIncomeExpense,
    createTransfer,
    updateTransaction,
    deleteTransaction,
    getTransactionGroups,
    getCashRegisters,
    getCashRegistersByBranch,
    getCurrentUser,
    getBranches,
    getStaffUsers,
  };
}
