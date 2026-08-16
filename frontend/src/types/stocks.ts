export interface IStock {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    location: string;
    created_at: string;
    updated_at: string;
}

export interface IStockFormData {
    sku: string;
    name: string;
    quantity: number;
    location: string;
}

export interface IStockResponse {
    status: string;
    message: string;
    data: IStock | IStock[];
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
    };
    code: number;
}
