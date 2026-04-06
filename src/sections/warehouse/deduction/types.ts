export type {
    Deduction,
    DeductionItem,
    DeductionGroup,
    DeductionBatchItemInput,
} from 'src/hooks/use-deductions-api';

export interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
}

export interface DeductionFormData {
    date: string;
    status: string;
    storage_id: string;
    description: string;
    act_group_id: string;
}

export interface SelectOption {
    id: string;
    name: string;
}
