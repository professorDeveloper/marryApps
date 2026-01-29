export interface ICafeTableItem {
    id: string;
    hall_id: string;
    number: number;
    capacity: number;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
    rotation: number;
    status: 'free' | 'occupied' | 'reserved';
    created_at: string;
    updated_at: string;
}

export interface ICafeTableFormData {
    number: number;
    capacity: number;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
    rotation: number;
    status?: 'free' | 'occupied' | 'reserved';
}
