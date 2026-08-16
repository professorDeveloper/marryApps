// ─── Field types ─────────────────────────────────────────────────────────────

export type FieldType =
    | 'text'
    | 'number'
    | 'textarea'
    | 'email'
    | 'url'
    | 'select'
    | 'switch'
    | 'checkbox'
    | 'color'
    | 'image'
    | 'date';

export interface FieldOption {
    value: string | number;
    label: string;
}

export interface FieldConfig<T = Record<string, any>> {
    key: keyof T & string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    options?: FieldOption[];
    defaultValue?: any;
    helperText?: string;
    fullWidth?: boolean;
    colors?: string[];
    height?: number;
    step?: string;
    min?: string;
    visible?: (data: T) => boolean;
    disabled?: (data: T) => boolean;
}

// ─── Section ─────────────────────────────────────────────────────────────────

export interface SectionConfig<T = Record<string, any>> {
    id: string;
    title: string;
    columns?: 1 | 2;
    fields: FieldConfig<T>[];
}

// ─── Top-level config ────────────────────────────────────────────────────────

export interface EditViewConfig<T = Record<string, any>> {
    entityName: string;
    sections: SectionConfig<T>[];
    sidebar?: SectionConfig<T>;
    breadcrumbs?: { name: string; href: string }[];
    showBreadcrumbs?: boolean;
    showDeleteButton?: boolean;
    deleteConfirmMessage?: string;
}

// ─── Component props ─────────────────────────────────────────────────────────

export interface GenericEditV2Props<T = Record<string, any>> {
    data: T | null;
    config: EditViewConfig<T>;
    isNew?: boolean;
    loading?: boolean;
    onSubmit: (data: T) => void | Promise<void>;
    onDelete?: () => void | Promise<void>;
    onCancel?: () => void;
    title?: string;
}
