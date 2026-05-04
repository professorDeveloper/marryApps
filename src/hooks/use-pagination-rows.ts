import { useAppSelector, useAppDispatch } from 'src/store';
import { setRowsPerPage as setRowsPerPageAction } from 'src/store/slices/paginationSlice';

/**
 * Hook to manage global rows per page setting across all DataTable components.
 * Uses Redux as the source of truth with localStorage persistence.
 */
export function usePaginationRows() {
  const rowsPerPage = useAppSelector((state) => state.pagination.rowsPerPage);
  const dispatch = useAppDispatch();

  const setRowsPerPage = (value: number) => {
    dispatch(setRowsPerPageAction(value));
  };

  return {
    rowsPerPage,
    setRowsPerPage,
  };
}
