export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ITransaction {
  id: string;
  type: TransactionType;
  cash_register_id?: string;
  from_cash_register_id?: string;
  to_cash_register_id?: string;
  from_branch_id?: string;
  to_branch_id?: string;
  group_transaction_id: string;
  amount: string;
  cash_amount?: string;
  card_amount?: string;
  description: string;
  pay_type: string;
  date: string;
  user_id?: string;
  branch_id?: string;
  customer_paid_amount?: string;
  change_amount?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  type?: TransactionType | '' | string;  // Allow comma-separated values
  pay_type?: string;  // Allow comma-separated values: 'cash', 'card', 'transfer'
  cash_register_id?: string;  // Allow comma-separated values
  group_transaction_id?: string;  // Allow comma-separated values
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface TransactionReportFilters {
  from?: string;
  to?: string;
  cash_register_id?: string;
}

export interface TransactionReportSummaryItem {
  card_total: string;
  cash_total: string;
  total: string;
  type: string;
}

export interface TransactionReportGroupItem {
  card_total: string;
  cash_total: string;
  group_id: string;
  group_name: string;
  total: string;
  type: string;
}

export interface TransactionReportResponse {
  balance: TransactionReportSummaryItem;
  closing_balance: string;
  day_balance: string;
  expense_groups: TransactionReportGroupItem[];
  income_groups: TransactionReportGroupItem[];
  opening_balance: string;
  summary: TransactionReportSummaryItem[];
  total_expense: string;
  total_income: string;
}

export interface IncomeExpensePayload {
  amount: string;
  cash_amount?: string | null;
  card_amount?: string | null;
  cash_register_id: string;
  date: string;
  description: string;
  group_transaction_id: string;
  pay_type: string;
  type: 'income' | 'expense';
}

export interface TransferPayload {
  amount: string;
  cash_amount?: string | null;
  card_amount?: string | null;
  date: string;
  description: string;
  from_branch_id: string;
  from_cash_register_id: string;
  group_transaction_id: string;
  pay_type: string;
  to_branch_id: string;
  to_cash_register_id: string;
}

export interface ITransactionGroup {
  id: string;
  name: string;
}

export interface ICashRegisterOption {
  id: string;
  name: string;
  branch_id?: string;
}

export interface IBranchOption {
  id: string;
  name: string;
}

export interface IUserOption {
  id: string;
  full_name: string;
  username?: string;
}

export interface ICurrentUser {
  id: string;
  full_name: string;
  username: string;
  role: string;
  is_active: boolean;
  phone_number: string;
  brand_id: string;
  branch_id: string;
  created_at: string;
  updated_at: string;
}
