// ============================================================================
// GENERIC EDIT VIEW - TYPES
// ============================================================================

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'color' | 'email' | 'url' | 'image';

export interface FieldOption {
    value: string | number;
    label: string;
}

export interface FieldConfig {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    options?: FieldOption[];
    defaultValue?: any;
    validation?: (value: any) => string | null;
    helperText?: string;
    fullWidth?: boolean;
    grid?: number; // 1-12 for grid layout
    colors?: string[]; // For color picker type
    height?: number; // For image field height
}

export interface CardSection {
    id: string;
    title: string;
    fields: FieldConfig[];
    columns?: number; // 1 or 2
}

export interface GenericEditViewConfig {
    title: string;
    entityName: string;
    breadcrumbs: { name: string; href: string }[];
    leftSidecard?: CardSection;
    sections: CardSection[];
    // Controls rendering of the internal header/breadcrumbs block.
    // Defaults to true to keep backwards compatibility.
    showBreadcrumbs?: boolean;
    onSubmit: (formData: Record<string, any>) => Promise<void>;
    onDelete?: () => Promise<void>;
    deleteConfirmMessage?: string;
    showDeleteButton?: boolean;
}

export interface GenericEditViewProps {
    config: GenericEditViewConfig;
    data?: Record<string, any>;
    isNew?: boolean;
    loading?: boolean;
}
