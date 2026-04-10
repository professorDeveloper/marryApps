import type { TFunction } from 'i18next';
import type { IUser , UserRole } from 'src/types/user';

// ── Employee Management Types ───────────────────────────────────────────────────

export interface EmployeeListProps {
    role: string;
    title: string;
    useStaffApi?: boolean;
}

export interface EmployeeRowActionProps {
    employee: IUser;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export interface EmployeeDeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeName?: string;
}

export interface EmployeeSpecificationsProps {
    employee: IUser;
    t: TFunction;
}

// ── Employee Cell Renderer Types ───────────────────────────────────────────────

export interface EmployeeCellRendererProps {
    employee: IUser;
}

export interface EmployeeRoleCellProps extends EmployeeCellRendererProps {
    roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'>;
}

export interface EmployeeStatusCellProps extends EmployeeCellRendererProps {
    statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'>;
}

// ── Employee API Types ────────────────────────────────────────────────────────

export interface EmployeeApi {
    employees: IUser[];
    employeesLoading: boolean;
    deleteEmployee: (id: string) => Promise<void>;
    deleteMultipleEmployees: (ids: string[]) => Promise<void>;
}

// ── Employee View Modal Types ───────────────────────────────────────────────────

export interface EmployeeViewModalProps {
    isOpen: boolean;
    selectedEmployee: IUser | null;
    onClose: () => void;
    t: TFunction;
}

// ── Employee DataTable Configuration Types ─────────────────────────────────────

export interface EmployeeDataTableConfig {
    persistKey: string;
    defaultConfig: {
        order: string[];
        visibility: Record<string, boolean>;
        widths?: Record<string, number | string>;
    };
}

// ── Employee Specification Row Types ───────────────────────────────────────────

export interface EmployeeSpecificationRow {
    label: string;
    value: string;
}

// ── Employee Constants Types ───────────────────────────────────────────────────

export type EmployeeRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'user';
export type EmployeeStatus = 'active' | 'inactive';



export type CashRegisterOption = { value: string; label: string };

export interface EmployeeFormProps {
    isNew?: boolean;
    userId?: string;
}

export type EmployeeFormState = {
    full_name: string;
    username: string;
    phone_number: string;
    password: string;
    role: UserRole | '';
    pincode: string;
    terminal: string;
    cash_register_id: string;
};
