import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'global-rows-per-page';
const DEFAULT_ROWS_PER_PAGE = 20;

function getInitialRowsPerPage(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_ROWS_PER_PAGE;
}

interface PaginationState {
  rowsPerPage: number;
}

const initialState: PaginationState = {
  rowsPerPage: getInitialRowsPerPage(),
};

const paginationSlice = createSlice({
  name: 'pagination',
  initialState,
  reducers: {
    setRowsPerPage: (state, action: PayloadAction<number>) => {
      const value = action.payload;
      // Validate: must be a positive finite number
      if (!Number.isFinite(value) || value <= 0) {
        console.warn(`Invalid rowsPerPage: ${value}. Must be a positive number.`);
        return;
      }
      state.rowsPerPage = value;
      try {
        localStorage.setItem(STORAGE_KEY, String(value));
      } catch {
        // Ignore localStorage errors
      }
    },
  },
});

export const { setRowsPerPage } = paginationSlice.actions;
export default paginationSlice.reducer;
