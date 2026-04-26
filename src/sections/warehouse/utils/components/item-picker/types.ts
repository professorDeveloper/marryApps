
// ---------------------------------------------------------------------------
// Generic item that can be displayed in the picker
// ---------------------------------------------------------------------------

export interface PickerItem {
    id: string;
    name: string;
    measurement?: string;
    [key: string]: any;
}

// ---------------------------------------------------------------------------
// Column definition for the added-items panel
// ---------------------------------------------------------------------------

export interface ColumnDef {
    /** Key used to read / write the value on the item object */
    key: string;
    /** Column header text */
    header: string;
    /** CSS grid column width, e.g. "minmax(108px, auto)" */
    width: string;
    /** When true the cell renders an <input> instead of plain text */
    editable?: boolean;
    /** Input type (only relevant when editable) */
    type?: 'number' | 'text';
    /** Step attribute for number inputs */
    step?: string;
    /** Min attribute for number inputs */
    min?: string;
    /** Max attribute for number inputs */
    max?: string;
    /** Alignment of text / input inside the cell */
    align?: 'left' | 'center' | 'right';
    /** Render a suffix inside the input (e.g. measurement unit) */
    suffix?: (item: PickerItem) => string;
    /** Format a value for display-only columns */
    format?: (value: any) => string;
    /** Optional color function for conditional text coloring (e.g. success.main, error.main) */
    colorFn?: (item: PickerItem) => string | undefined;
}

// ---------------------------------------------------------------------------
// Row-level prop types
// ---------------------------------------------------------------------------

export interface AvailableItemRowProps {
    item: PickerItem;
    batchAddArmed?: boolean;
    isSelected?: boolean;
    /** Toggle checkbox selection for this row (stable reference from parent). */
    onToggleSelect?: (itemId: string) => void;
    /** Click row (outside checkbox) to move/add this item — stable reference from parent. */
    onRowActivate?: (itemId: string) => void;
}

export interface AddedItemRowProps {
    rowIndex: number;
    totalRows: number;
    item: PickerItem;
    columns: ColumnDef[];
    onValueChange: (id: string, key: string, value: string) => void;
    onRemove: (id: string) => void;
    removeTitle: string;
    gridTemplate: string;
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
}

// ---------------------------------------------------------------------------
// Panel-level prop types
// ---------------------------------------------------------------------------

export interface AvailableItemsPanelProps {
    items: PickerItem[];
    loading?: boolean;
    excludedIdSet: Set<string>;
    onMoveRight: (ids: string[]) => void;
    onQuickAdd?: (id: string) => void;
    onAddNewItem?: () => void;
    /** Whether the meta fields accordion is open (affects height calculation) */
    metaFieldsOpen?: boolean;
}

export interface AddedItemsPanelProps {
    items: PickerItem[];
    columns: ColumnDef[];
    onValueChange: (id: string, key: string, value: string) => void;
    onRemoveRow: (id: string) => void;
    onRemoveMany: (ids: string[]) => void;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    gridTemplate: string;
    itemCount?: number;
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
    /** Summary entries to display at the bottom of the panel */
    summaryEntries?: SummaryEntry[];
    /** Label for the grand-total line */
    totalLabel?: string;
    /** Formatted grand-total value */
    totalValue?: string;
    /** Cancel button handler */
    onCancel?: () => void;
    /** Save button handler */
    onSave?: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel?: string;
    /** Whether the meta fields accordion is open (affects height calculation) */
    metaFieldsOpen?: boolean;
}

// ---------------------------------------------------------------------------
// Summary panel
// ---------------------------------------------------------------------------

export interface SummaryEntry {
    label: string;
    value: string | number;
}

export interface SummaryPanelProps {
    entries: SummaryEntry[];
    totalLabel: string;
    totalValue: string;
    onCancel?: () => void;
    onSave?: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel?: string;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export interface ItemPickerSectionProps {
    /** All available items (already fetched by parent) */
    items: PickerItem[];
    /** Whether the item list is still loading */
    loading?: boolean;

    /** Items currently on the right (added) side, enriched with current values */
    transferredItems: PickerItem[];
    /** Set of IDs to exclude from the available list */
    excludedIdSet: Set<string>;

    /** Column definitions for the added-items panel */
    columns: ColumnDef[];
    /** Called when a user edits a cell value */
    onValueChange: (id: string, key: string, value: string) => void;

    /** Quick-add a single item (one-click) */
    onQuickAdd: (id: string) => void;
    /** Batch-add selected items from the available panel */
    onMoveRight: (ids: string[]) => void;
    /** Remove a single row from the added panel */
    onRemoveRow: (id: string) => void;
    /** Batch-remove rows */
    onRemoveMany: (ids: string[]) => void;
    /** Open a dialog / form to create a new item */
    onAddNewItem?: () => void;

    /** Rows shown in the summary panel (e.g. Products count, Total Qty) */
    summaryEntries: SummaryEntry[];
    /** Label for the grand-total line */
    totalLabel: string;
    /** Formatted grand-total value */
    totalValue: string;

    /** Cancel button handler */
    onCancel?: () => void;
    /** Save button handler */
    onSave?: () => void | Promise<void>;
    cancelDisabled?: boolean;
    saveDisabled?: boolean;
    saveLabel?: string;
    /** Keyboard navigation handler for moving focus between rows and columns */
    onNavigateFocus?: (direction: 'up' | 'down' | 'left' | 'right', currentRowIndex: number, currentColumnKey: string) => void;
    /** Whether the meta fields accordion is open (affects height calculation) */
    metaFieldsOpen?: boolean;
}
