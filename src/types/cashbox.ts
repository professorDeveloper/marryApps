/**
 * Cashbox API Types
 */

export interface IGroupTransaction {
    id: string;
    name: string;
    branch_id: string;
    created_at: string;
    updated_at: string;
}

export interface IGroupTransactionFormData {
    name: string;
}

export interface ICashier {
    id: string;
    name: string;
    branch_id: string;
    created_at: string;
    updated_at: string;
}

export interface ICashierFormData {
    name: string;
}

export interface ITransaction {
    id: string;
    name: string;
    group_transaction_id: string;
    branch_id: string;
    created_at: string;
    updated_at: string;
}

export interface ITransactionFormData {
    name: string;
    group_transaction_id: string;
}
