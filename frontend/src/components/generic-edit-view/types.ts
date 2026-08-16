// ============================================================================
// GENERIC EDIT VIEW - TYPES
// ============================================================================

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'color' | 'email' | 'url' | 'image' | 'date';

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

// export interface GenericEditViewProps {
//     config: GenericEditViewConfig;
//     data?: Record<string, any>;
//     isNew?: boolean;
//     loading?: boolean;
//     // Controlled form props - if provided, form will be controlled externally
//     formData?: Record<string, any>;
//     onFormDataChange?: (formData: Record<string, any>) => void;
// }

// Defines the structure for a single form field
export interface FormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'switch' | 'date' | 'number' | 'url' | 'image' | 'color' | 'email' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    defaultValue?: any;
    options?: { value: string | number; label: string }[];
    validation?: (value: any) => string | null;
    helperText?: string;
    fullWidth?: boolean;
    grid?: number; // 1-12 for grid layout
    colors?: string[]; // For color picker type
    height?: number; // For image field height
}

// Defines a section of the form, containing a title and a group of fields
export interface CardSection {
    id: string;
    title: string;
    columns?: number; // 1 or 2
    fields: FormField[];
}

// Defines the configuration for the entire edit view
export interface GenericEditViewConfig {
    entityName: string;
    title: string;
    breadcrumbs: { name: string; href: string }[];
    sections: CardSection[];
    leftSidecard?: CardSection;
    showBreadcrumbs?: boolean;
    showDeleteButton?: boolean;
    deleteConfirmMessage?: string;
    onSubmit: (formData: Record<string, any>) => Promise<void>;
    onDelete?: () => Promise<void>;
}

// Props for the main GenericEditView component
export interface GenericEditViewProps {
    config: GenericEditViewConfig;
    data?: Record<string, any> | null;
    isNew?: boolean;
    loading?: boolean;
    formData?: Record<string, any>;
    onFormDataChange?: (formData: Record<string, any>) => void;
}