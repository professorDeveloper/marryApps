export const ROLE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
    admin: 'error',
    manager: 'warning',
    cashier: 'info',
    waiter: 'primary',
    kitchen: 'secondary',
    user: 'default',
};

export const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    active: 'success',
    inactive: 'error',
};

export const DEFAULT_DATATABLE_CONFIG = {
    order: ['full_name', 'username', 'role', 'phone_number', 'status', 'created_at', 'actions'],
    visibility: {
        full_name: true,
        username: true,
        role: true,
        phone_number: true,
        status: true,
        created_at: true,
        actions: true,
    },
    widths: {
        full_name: 250,
        username: 180,
        role: 120,
        phone_number: 140,
        status: 100,
        created_at: 130,
        actions: 100,
    },
};

export const EMPLOYEE_DATATABLE_PERSIST_KEY = 'employee-list-table-config';
