export type IBillStatus = 'opened' | 'closed' | 'paid';
export type IPaymentType = 'cash' | 'card';
export type IBillItemStatus = 'pending' | 'completed' | 'cancelled';

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
    waiter_id: string;
    waiter_name: string;
    table_number: number;
    guest_count: number;
    food_cost: string;
    food_total: string;
    service_percent: string;
    service_amount: string;
    discount_percent: string;
    discount_amount: string;
    grand_total: string;
}

export interface IBillDetail extends IBillItem {
    table_id: string;
    comment?: string;
    items: IBillItemDetail[];
}

export interface IBillsResponse {
    status: string;
    message: string;
    data: IBillItem[];
    code: number;
}

export interface IBillDetailResponse {
    status: string;
    message: string;
    data: IBillDetail;
    code: number;
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
