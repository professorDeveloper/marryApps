import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

import paginationReducer from './slices/paginationSlice';
import {
  mealFormPickerReducer,
  invoiceFormPickerReducer,
  compoundFormPickerReducer,
  modifierFormPickerReducer,
  inventoryFormPickerReducer,
  transfersFormPickerReducer,
  shipmentsFormPickerReducer,
  deductionFormPickerReducer,
  outgoingInvoiceFormPickerReducer,
  separationActsFormPickerReducer,
} from './slices/pickerFormSlices';

export const store = configureStore({
  reducer: {
    pagination: paginationReducer,
    mealFormPicker: mealFormPickerReducer,
    compoundFormPicker: compoundFormPickerReducer,
    modifierFormPicker: modifierFormPickerReducer,
    inventoryFormPicker: inventoryFormPickerReducer,
    invoiceFormPicker: invoiceFormPickerReducer,
    transfersFormPicker: transfersFormPickerReducer,
    shipmentsFormPicker: shipmentsFormPickerReducer,
    outgoingInvoiceFormPicker: outgoingInvoiceFormPickerReducer,
    deductionFormPicker: deductionFormPickerReducer,
    separationActsFormPicker: separationActsFormPickerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
