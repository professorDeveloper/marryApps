export type {
    SeparationActBatchApiResponse,
    SeparationActCalculationItemInput,
} from 'src/types/separation-acts';

export interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
}

export interface SeparationActFormData {
    date: string;
    storage_id: string;
    group_id: string;
    source_ingredient_id: string;
    source_quantity: string;
    description: string;
}

export interface SelectOption {
    id: string;
    name: string;
}
