// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'user';

export type UserStatus = 'active' | 'inactive';

export interface IUser {
    id: string;
    full_name: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    is_active?: boolean;
    phone_number?: string;
    brand_id?: string;
    branch_id?: string;
    cash_register_id?: string;
    pincode?: string;
    terminal?: string;
    created_at: string;
    updated_at: string;
}

export interface IUserFormData {
    full_name?: string;
    fullName?: string;
    username: string;
    password?: string;
    role: UserRole;
    status?: UserStatus;
    is_active?: boolean;
    phone_number?: string;
    phoneNumber?: string;
    pincode?: string;
    terminal?: string;
    brand_id?: string;
    branch_id?: string;
    cash_register_id?: string;
}

export interface IUserRegisterData {
    id: string;
    brand_id: string;
    branch_id: string;
    cash_register_id?: string;
    full_name: string;
    username: string;
    password?: string;
    phone_number: string;
    pincode?: string;
    role: UserRole;
    is_active?: boolean;
}

export interface IUserTableFilters {
    status: string[];
    role: string[];
}

export interface IUserResponse {
    status: string;
    message: string;
    data: IUser[];
    code: number;
}
