export interface IIngredientReportItem {
    id?: string;
    ingredient_id: string;
    ingredient_name: string;
    color_code?: string;
    storage_id?: string;
    storage_name?: string;
    measurement: string;
    begin_quantity: string;
    end_quantity: string;
    in: string;
    out: string;
    surplus: string;
    shortage: string;
    begin_price: string;
    end_price: string;
    begin_amount: string;
    end_amount: string;
    invoice_in_amount: string;
    order_out_amount: string;
    deduction_out_amount: string;
    surplus_amount: string;
    shortage_amount: string;
    date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface IIngredientReportsFilterParams {
    storage_id?: string;
    start: string;
    end: string;
    ingredient_id?: string;
    ingredient_ids?: string[];
    measurement?: string;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
}

export interface IIngredientReportsResponse {
    status: string;
    message: string;
    data: IIngredientReportItem[];
    totals?: {
        total_count: number;
        total_order_out_amount: string;
    };
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
    };
    code: number;
}

export interface IIngredientReportDetail extends IIngredientReportItem {
    details?: Record<string, any>;
}

export interface IIngredientReportDetailResponse {
    status: string;
    message: string;
    data: IIngredientReportDetail;
    code: number;
}

export enum IngredientMovementEventType {
    Invoice = 'invoice',
    OrderOut = 'order_out',
    DeductionIn = 'deduction_in',
    DeductionOut = 'deduction_out',
    TransferIn = 'transfer_in',
    TransferOut = 'transfer_out',
    OutgoingInvoice = 'outgoing_invoice',
    SeparationActIn = 'separation_act_in',
    SeparationActOut = 'separation_act_out',
    ShipmentIn = 'shipment_in',
    ShipmentOut = 'shipment_out',
    InventorySurplus = 'inventory_surplus',
    InventoryShortage = 'inventory_shortage',
    ManualIn = 'manual_in',
    ManualOut = 'manual_out',
    ManualAdjustment = 'manual_adjustment',
}

// Groups for the filter dropdown — each group maps to one or more event types
export const MOVEMENT_FILTER_GROUPS: { label: string; values: IngredientMovementEventType[] }[] = [
    { label: 'Invoice', values: [IngredientMovementEventType.Invoice] },
    { label: 'Order Out', values: [IngredientMovementEventType.OrderOut] },
    { label: 'Outgoing Invoice', values: [IngredientMovementEventType.OutgoingInvoice] },
    { label: 'Transfer', values: [IngredientMovementEventType.TransferIn, IngredientMovementEventType.TransferOut] },
    { label: 'Deduction', values: [IngredientMovementEventType.DeductionIn, IngredientMovementEventType.DeductionOut] },
    { label: 'Shipment', values: [IngredientMovementEventType.ShipmentIn, IngredientMovementEventType.ShipmentOut] },
    { label: 'Separation Act', values: [IngredientMovementEventType.SeparationActIn, IngredientMovementEventType.SeparationActOut] },
    { label: 'Inventory', values: [IngredientMovementEventType.InventorySurplus, IngredientMovementEventType.InventoryShortage] },
    { label: 'Manual', values: [IngredientMovementEventType.ManualIn, IngredientMovementEventType.ManualOut, IngredientMovementEventType.ManualAdjustment] },
];

export interface IMovementAdditionalDataInvoice {
    supplier_id?: string;
    total_amount?: string;
    date?: string;
    status?: string;
}
export interface IMovementAdditionalDataOrderOut {
    bill_no?: number;
    goods?: { id: string; name: string }[];
}
export interface IMovementAdditionalDataNumbered {
    number?: number;
    date?: string;
    description?: string;
    status?: string;
    // transfer extras
    from_storage_id?: string;
    to_storage_id?: string;
    // shipment extras
    supplier_id?: string;
    total_amount?: string;
}

export interface IIngredientMovement {
    id?: string;
    ingredient_id?: string;
    storage_id?: string;
    event_type: IngredientMovementEventType | string;
    qty_in: string;
    qty_out: string;
    stock_before: string;
    stock_after: string;
    price_per_unit?: string;
    source_type?: string;
    source_id?: string;
    effective_at?: string;
    created_at?: string;
    additional_data?: IMovementAdditionalDataInvoice | IMovementAdditionalDataOrderOut | IMovementAdditionalDataNumbered | null;
    [key: string]: any;
}

export interface IIngredientMovementsFilterParams {
    storage_id: string;
    start?: string;
    end?: string;
    event_types?: (IngredientMovementEventType | string)[];
    limit?: number;
    offset?: number;
}

export interface IIngredientMovementsTotals {
    total_count: number;
    begin_qty: string;
    end_qty: string;
    total_qty_in: string;
    total_qty_out: string;
    shortage_qty: string;
    surplus_qty: string;
    begin_price: string;
    end_price: string;
}

export interface IIngredientMovementsResponse {
    status: string;
    message: string;
    data: {
        items: IIngredientMovement[];
        totals: IIngredientMovementsTotals;
    };
    code: number;
}
