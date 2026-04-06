export type {
    Transfer,
    TransferFormData,
    TransferBatchItemInput,
} from 'src/types/transfers';

export interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
}

export interface SelectOption {
    id: string;
    name: string;
}

export interface Branch {
    id: string;
    name: string;
}

export interface Storage {
    id: string;
    name: string;
    branch_id?: string;
}
