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
