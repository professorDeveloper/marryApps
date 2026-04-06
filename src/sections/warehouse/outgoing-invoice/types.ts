export type { OutgoingInvoiceBatchItemInput, OutgoingInvoiceBatchApiResponse } from 'src/types/outgoing-invoices';

export interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
}

export interface OutgoingInvoiceFormData {
    date: string;
    storage_id: string;
    group_id: string;
    description: string;
}

export interface SelectOption {
    id: string;
    name: string;
}
