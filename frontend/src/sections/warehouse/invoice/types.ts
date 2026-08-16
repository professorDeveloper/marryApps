export interface Ingredient {
    id: string;
    name: string;
    measurement: string;
    price_per_unit: string;
    quantity?: number;
    group_id?: string;
}

export interface InvoiceDetailItem {
    ingredient_id: string;
    ingredient_name?: string;
    quantity: number;
    price_per_unit: number;
    price: number;
    measurement?: string;
}

export interface InvoiceDetailsCalculationProps {
    invoiceId: string;
    invoiceData?: Record<string, any>;
    onSuccess?: () => void;
    onDetailsChange?: (details: any[]) => void;
    isNewInvoice?: boolean;
    persistedDetails?: any[];
    formData?: Record<string, any>;
    onSaveInvoice?: (formData: Record<string, any>, details?: any[]) => Promise<void>;
}

// ── Panel prop types ──────────────────────────────────────────────────────────

export interface AvailableIngredientsPanelProps {
    ingredients: Ingredient[];
    loading: boolean;
    excludedIds?: string[];
    excludedIdSet?: Set<string>;
    onMoveRight: (selectedIds: string[]) => void;
    onAddNewIngredient: () => void;
    onQuickAdd?: (id: string) => void;
}

export interface AddedItemsPanelProps {
    transferredItems: any[];
    quantities: Record<string, number>;
    pricesPerUnit: Record<string, number>;
    prices: Record<string, number>;
    onQuantityChange: (id: string, value: string) => void;
    onPricePerUnitChange: (id: string, value: string) => void;
    onTotalPriceChange: (id: string, value: string) => void;
    onRemoveRow: (id: string) => void;
    onRemoveMany: (ids: string[]) => void;
    rightSearchTerm?: string;
    onRightSearchChange?: (value: string) => void;
}

export interface SummaryPanelProps {
    transferredItemsCount: number;
    totalQuantity: number;
    totalAmount: number;
    transferredIdsLength: number;
    onCancel: () => void;
    onSave: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel: string;
}

// ── Row prop types ────────────────────────────────────────────────────────────

export type AddedInvoiceItemRowProps = {
    rowIndex: number;
    id: string;
    name: string;
    measurement: string;
    quantity: number | '';
    pricePerUnit: number | '';
    price: number | '';
    onQuantityChange: (id: string, value: string) => void;
    onPricePerUnitChange: (id: string, value: string) => void;
    onTotalPriceChange: (id: string, value: string) => void;
    onRemoveRow: (id: string) => void;
    removeTitle: string;
};

export type AvailableIngredientRowProps = {
    ingredient: Ingredient;
    onQuickAdd?: (id: string) => void;
    quickAddTitle: string;
};

// ── Hook types ────────────────────────────────────────────────────────────────

export type TransferredState = {
    transferredIds: string[];
    quantities: Record<string, number>;
    pricesPerUnit: Record<string, number>;
    prices: Record<string, number>;
    showCalculation: boolean;
};

// ── Line-items section types ──────────────────────────────────────────────────

export type InvoiceLineItemsApi = {
    getBatchData: () => Array<{
        ingredient_id: string;
        quantity: string;
        price_per_unit: string;
        price: string;
    }>;
    restoreFromPersisted: (details: any[] | undefined) => void;
    refreshIngredients: () => Promise<void>;
};

export type InvoiceFormLineItemsSectionProps = {
    apiRef: React.RefObject<InvoiceLineItemsApi | null>;
    onHasItemsChange: (hasItems: boolean) => void;
    onIngredientsLoadingChange: (loading: boolean) => void;
    onOpenIngredientDialog: () => void;
    onInvoiceCancel: () => void;
    onInvoiceSave: () => void | Promise<void>;
    invoiceCancelDisabled: boolean;
    invoiceSaveDisabled: boolean;
    saveLabel: string;
    metaFieldsOpen?: boolean;
    tableHeight?: string | number;
};
