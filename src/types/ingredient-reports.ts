export interface IIngredientReportItem {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    storage_id: string;
    storage_name: string;
    measurement: string;
    begin_qty: string;
    end_qty: string;
    invoice_in_qty: string;
    order_out_qty: string;
    deduction_out_qty: string;
    surplus_qty: string;
    shortage_qty: string;
    cost_start: string;
    cost_end: string;
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
    storage_id: string; // majburiy
    start: string; // RFC3339 yoki YYYY-MM-DD
    end: string; // RFC3339 yoki YYYY-MM-DD
    ingredient_id?: string; // ixtiyoriy
    limit?: number;
    offset?: number;
}

export interface IIngredientReportsResponse {
    status: string;
    message: string;
    data: IIngredientReportItem[];
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
