export type IBillStatus = 'opened' | 'closed' | 'paid';
export type IPaymentType = 'cash' | 'card';
export type IBillItemStatus = 'pending' | 'completed' | 'cancelled';
export type IAmountValue = string | number;

export interface IBillItemDetail {
    id: string;
    good_id: string;
    good_name: string;
    quantity: number;
    price: string;
    status: IBillItemStatus;
    comment?: string;
}

export interface IBillItem {
    id: string;
    bill_no: number;
    bill_status: IBillStatus;
    opened_at: string;
    closed_at?: string | null;
    paid_at?: string | null;
    waiter_id?: string;
    waiter_name?: string;
    table_number?: number | null;
    hall_name?: string;
    guest_count?: number;
    food_cost: IAmountValue;
    food_total: IAmountValue;
    service_percent: IAmountValue;
    service_amount: IAmountValue;
    discount_percent: IAmountValue;
    discount_amount: IAmountValue;
    grand_total: IAmountValue;
    quantity: number;
}

export interface IBillDetail extends IBillItem {
    table_id: string;
    comment?: string;
    items: IBillItemDetail[];
}

export interface IBillsListData {
    total: number;
    limit: number;
    offset: number;
    items: IBillItem[];
}

export interface IBillsResponse {
    status: string;
    message: string;
    data: IBillsListData;
    code?: number;
}

export interface IBillDetailResponse {
    status: string;
    message: string;
    data: IBillDetail;
    code?: number;
}

export interface IBillsFilterParams {
    start?: string;
    end?: string;
    bill_status?: IBillStatus;
    payment_type?: IPaymentType;
    waiter_id?: string;
    hall_id?: string;
    table_id?: string;
    limit?: number;
    offset?: number;
}
