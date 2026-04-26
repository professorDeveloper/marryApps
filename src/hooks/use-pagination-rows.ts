import { useState, useEffect } from 'react';

const STORAGE_KEY = 'global-rows-per-page';
const DEFAULT_ROWS_PER_PAGE = 20;

/**
 * Hook to manage global rows per page setting across all DataTable components.
 * Persists the value to localStorage and provides a reactive state.
 */
export function usePaginationRows() {
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setRowsPerPage(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load rows per page from localStorage:', error);
    }
  }, []);

  // Update localStorage when rowsPerPage changes
  const setRowsPerPageWithStorage = (value: number) => {
    setRowsPerPage(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      console.error('Failed to save rows per page to localStorage:', error);
    }
  };

  return {
    rowsPerPage,
    setRowsPerPage: setRowsPerPageWithStorage,
  };
}
