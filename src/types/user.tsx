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
    phone_number?: string;
    brand_id?: string;
    branch_id?: string;
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
    phone_number?: string;
    phoneNumber?: string;
    pincode?: string;
    terminal?: string;
    brand_id?: string;
    branch_id?: string;
}

export interface IUserRegisterData {
    brand_id: string;
    branch_id: string;
    fullName: string;
    username: string;
    password: string;
    phoneNumber: string;
    pincode: string;
    role: UserRole;
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
