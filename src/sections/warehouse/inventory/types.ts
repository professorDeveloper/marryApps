import type { IInventory, IInventoryItem, IInventoryFormData, IBackendPagination } from 'src/types/inventory';

export type { IInventory, IInventoryItem, IInventoryFormData, IBackendPagination };

export type Inventory = IInventory;
export type InventoryItem = IInventoryItem;
export type InventoryPagination = IBackendPagination;

export interface InventoryFilters {
  search?: string;
  status?: string[];
  storage_id?: string[];
  date_from?: string;
  date_to?: string;
}

export interface InventorySpecifications {
  number?: string;
  date?: string;
  storage_id?: string;
  description?: string;
  status?: string;
  remaining_amount?: number;
  shortage_amount?: number;
  surplus_amount?: number;
  items?: InventoryItem[];
}

export type InventoryItemsState = {
    transferredIds: string[];
    quantities: Record<string, number>;
};

export type InventoryDisplayItem = {
    id: string;
    name: string;
    measurement: string;
};

export type AddedInventoryItemRowProps = {
    rowIndex: number;
    id: string;
    name: string;
    measurement: string;
    quantity: number | '';
    hasReport: boolean;
    systemQuantity?: number;
    difference?: number;
    impact?: number;
    onQuantityChange: (id: string, value: string) => void;
    onRemoveRow: (id: string) => void;
    removeTitle: string;
};

export type AddedInventoryItemsPanelProps = {
    transferredItems: InventoryDisplayItem[];
    quantities: Record<string, number>;
    reportLookup: IngredientReportLookup;
    onQuantityChange: (id: string, value: string) => void;
    onRemoveRow: (id: string) => void;
    onRemoveMany: (ids: string[]) => void;
    rightSearchTerm?: string;
    onRightSearchChange?: (value: string) => void;
};

export type InventoryMetaFieldsProps = {
    date: string;
    storageId: string;
    status: string;
    description: string;
    onDateChange: (v: string) => void;
    onStorageChange: (v: string) => void;
    onStatusChange: (v: string) => void;
    onDescriptionChange: (v: string) => void;
    storages: Array<{ id: string; name: string }>;
    disabled: boolean;
};

export type InventoryResultsTableProps = {
    items: IInventoryItem[];
};

export type InventorySummaryPanelProps = {
    itemCount: number;
    reportLookup: IngredientReportLookup;
    quantities: Record<string, number>;
    transferredIds: string[];
    onCancel: () => void;
    onSave: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    isSaving?: boolean;
};

// ── Items section types ───────────────────────────────────────────────────────

export type InventoryItemsApi = {
    getBatchData: () => import('src/types/inventory').IInventoryItemInput[];
    restoreFromPersisted: (items: any[] | undefined) => void;
    refreshIngredients: () => Promise<void>;
};

export type IngredientReportLookup = Record<string, { systemQuantity: number; pricePerUnit: number }>;

export type InventoryItemsSectionProps = {
    apiRef: React.RefObject<InventoryItemsApi | null>;
    storageId: string;
    date: string;
    onHasItemsChange: (has: boolean) => void;
    onIngredientsLoadingChange: (loading: boolean) => void;
    onOpenIngredientDialog: () => void;
    onCancel: () => void;
    onSave: () => void | Promise<void>;
    cancelDisabled: boolean;
    saveDisabled: boolean;
    isSaving: boolean;
};
