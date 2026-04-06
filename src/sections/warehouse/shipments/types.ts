export type {
    Shipment,
    ShipmentItem,
    ShipmentBatchApiData,
    ShipmentBatchItemInput,
    ShipmentBatchApiResponse,
} from 'src/types/shipments';

export interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
}

export interface ShipmentsFormData {
    date: string;
    storage_id: string;
    supplier_id: string;
    description: string;
}

export interface SelectOption {
    id: string;
    name: string;
}
