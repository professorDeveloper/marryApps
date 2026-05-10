import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const PICKER_FORM_NAMES = {
  mealEditForm: 'mealEditForm',
  compoundEditForm: 'compoundEditForm',
  modifierEditForm: 'modifierEditForm',
  inventoryForm: 'inventoryForm',
  invoiceForm: 'invoiceForm',
  transfersForm: 'transfersForm',
  shipmentsForm: 'shipmentsForm',
  outgoingInvoiceForm: 'outgoingInvoiceForm',
  deductionForm: 'deductionForm',
  separationActsForm: 'separationActsForm',
} as const;

export type PickerFormName = (typeof PICKER_FORM_NAMES)[keyof typeof PICKER_FORM_NAMES];

export type PickerFormItem = {
  id: string;
  itemType?: string;
  isAdded: boolean;
  quantity?: string;
  pricePerUnit?: string;
  total?: string;
  [key: string]: unknown;
};

type PickerFormEntry = {
  formName: string;
  items: PickerFormItem[];
  meta: Record<string, unknown>;
  updatedAt: number | null;
};

type PickerFormSliceState = {
  forms: Record<string, PickerFormEntry | undefined>;
};

type SetFormStatePayload = {
  formName: string;
  items: PickerFormItem[];
  meta?: Record<string, unknown>;
};

type PatchFormItemPayload = {
  formName: string;
  itemId: string;
  patch: Partial<PickerFormItem>;
};

type ToggleItemAddedPayload = {
  formName: string;
  itemId: string;
  isAdded: boolean;
};

const initialState: PickerFormSliceState = {
  forms: {},
};

function ensureFormEntry(state: PickerFormSliceState, formName: string): PickerFormEntry {
  if (!state.forms[formName]) {
    state.forms[formName] = {
      formName,
      items: [],
      meta: {},
      updatedAt: null,
    };
  }
  return state.forms[formName] as PickerFormEntry;
}

function createPickerFormSlice(sliceName: string) {
  return createSlice({
    name: sliceName,
    initialState,
    reducers: {
      setFormState: (state, action: PayloadAction<SetFormStatePayload>) => {
        const { formName, items, meta } = action.payload;
        state.forms[formName] = {
          formName,
          items,
          meta: meta ?? {},
          updatedAt: Date.now(),
        };
      },
      setFormItems: (
        state,
        action: PayloadAction<{ formName: string; items: PickerFormItem[] }>
      ) => {
        const { formName, items } = action.payload;
        const entry = ensureFormEntry(state, formName);
        entry.items = items;
        entry.updatedAt = Date.now();
      },
      patchFormItem: (state, action: PayloadAction<PatchFormItemPayload>) => {
        const { formName, itemId, patch } = action.payload;
        const entry = ensureFormEntry(state, formName);
        const index = entry.items.findIndex((item) => item.id === itemId);
        if (index === -1) return;
        entry.items[index] = { ...entry.items[index], ...patch };
        entry.updatedAt = Date.now();
      },
      toggleItemAdded: (state, action: PayloadAction<ToggleItemAddedPayload>) => {
        const { formName, itemId, isAdded } = action.payload;
        const entry = ensureFormEntry(state, formName);
        const item = entry.items.find((row) => row.id === itemId);
        if (!item) return;
        item.isAdded = isAdded;
        entry.updatedAt = Date.now();
      },
      resetFormState: (state, action: PayloadAction<{ formName: string }>) => {
        delete state.forms[action.payload.formName];
      },
    },
  });
}

export function mapMealCalculationsToPickerItems(payload: {
  ingredient_calculations: { ingredient_id: string; quantity: string }[];
  compound_calculations: { compound_id: string; quantity: string }[];
}): PickerFormItem[] {
  const ingredientItems = payload.ingredient_calculations.map((row) => ({
    id: `ingredient:${row.ingredient_id}`,
    itemType: 'ingredient',
    ingredient_id: row.ingredient_id,
    quantity: row.quantity,
    isAdded: true,
  }));
  const compoundItems = payload.compound_calculations.map((row) => ({
    id: `compound:${row.compound_id}`,
    itemType: 'compound',
    compound_id: row.compound_id,
    quantity: row.quantity,
    isAdded: true,
  }));
  return [...ingredientItems, ...compoundItems];
}

export function mapBatchItemsToPickerItems(
  items: Array<Record<string, unknown>>,
  idKey: string = 'ingredient_id'
): PickerFormItem[] {
  return items.map((item, index) => {
    const baseId = String(item[idKey] ?? item.id ?? index);
    return {
      id: `${idKey}:${baseId}`,
      itemType: idKey.replace('_id', ''),
      isAdded: true,
      ...item,
      quantity: item.quantity != null ? String(item.quantity) : undefined,
      pricePerUnit:
        item.price_per_unit != null ? String(item.price_per_unit) : undefined,
      total: item.price != null ? String(item.price) : undefined,
    };
  });
}

const mealFormPickerSlice = createPickerFormSlice('mealFormPicker');
const compoundFormPickerSlice = createPickerFormSlice('compoundFormPicker');
const modifierFormPickerSlice = createPickerFormSlice('modifierFormPicker');
const inventoryFormPickerSlice = createPickerFormSlice('inventoryFormPicker');
const invoiceFormPickerSlice = createPickerFormSlice('invoiceFormPicker');
const transfersFormPickerSlice = createPickerFormSlice('transfersFormPicker');
const shipmentsFormPickerSlice = createPickerFormSlice('shipmentsFormPicker');
const outgoingInvoiceFormPickerSlice = createPickerFormSlice('outgoingInvoiceFormPicker');
const deductionFormPickerSlice = createPickerFormSlice('deductionFormPicker');
const separationActsFormPickerSlice = createPickerFormSlice('separationActsFormPicker');

export const mealFormPickerActions = mealFormPickerSlice.actions;
export const compoundFormPickerActions = compoundFormPickerSlice.actions;
export const modifierFormPickerActions = modifierFormPickerSlice.actions;
export const inventoryFormPickerActions = inventoryFormPickerSlice.actions;
export const invoiceFormPickerActions = invoiceFormPickerSlice.actions;
export const transfersFormPickerActions = transfersFormPickerSlice.actions;
export const shipmentsFormPickerActions = shipmentsFormPickerSlice.actions;
export const outgoingInvoiceFormPickerActions = outgoingInvoiceFormPickerSlice.actions;
export const deductionFormPickerActions = deductionFormPickerSlice.actions;
export const separationActsFormPickerActions = separationActsFormPickerSlice.actions;

export const mealFormPickerReducer = mealFormPickerSlice.reducer;
export const compoundFormPickerReducer = compoundFormPickerSlice.reducer;
export const modifierFormPickerReducer = modifierFormPickerSlice.reducer;
export const inventoryFormPickerReducer = inventoryFormPickerSlice.reducer;
export const invoiceFormPickerReducer = invoiceFormPickerSlice.reducer;
export const transfersFormPickerReducer = transfersFormPickerSlice.reducer;
export const shipmentsFormPickerReducer = shipmentsFormPickerSlice.reducer;
export const outgoingInvoiceFormPickerReducer = outgoingInvoiceFormPickerSlice.reducer;
export const deductionFormPickerReducer = deductionFormPickerSlice.reducer;
export const separationActsFormPickerReducer = separationActsFormPickerSlice.reducer;
