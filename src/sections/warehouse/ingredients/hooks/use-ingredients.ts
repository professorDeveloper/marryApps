import type { GridPaginationModel } from '@mui/x-data-grid';
import type { Ingredient, IngredientFilters } from '../types';

import { useState, useEffect, useCallback } from 'react';

import { useGetIngredients, useDeleteIngredient } from 'src/actions/ingredients';

import { toast } from 'src/components/snackbar';

export interface UseIngredientsOptions {
  initialPageSize?: number;
  initialFilters?: IngredientFilters;
}

export interface UseIngredientsReturn {
  ingredients: Ingredient[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  searchQuery: string;
  filters: IngredientFilters;
  setPaginationModel: (model: GridPaginationModel) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: IngredientFilters) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => Promise<void>;
  handleView: (ingredient: Ingredient) => void;
  refreshData: () => void;
}

export const useIngredients = (options: UseIngredientsOptions = {}): UseIngredientsReturn => {
  const { initialPageSize = 20, initialFilters = {} } = options;
  
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<IngredientFilters>(initialFilters);
  
  const { ingredients, ingredientsLoading, ingredientsTotal } = useGetIngredients(
    debouncedSearchQuery,
    {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
    }
  );
  
  const { deleteIngredient } = useDeleteIngredient();

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Reset page when search or filters change
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [debouncedSearchQuery, filters]);

  const handleEdit = useCallback((id: string) => {
    // This will be handled by the component using router
    window.location.href = `/warehouse/ingredients/${id}/edit`;
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteIngredient(id);
      toast.success('Ingredient deleted successfully');
      // Note: Since useGetIngredients doesn't have refetch, 
      // the component will need to handle refresh
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      toast.error('Failed to delete ingredient');
    }
  }, [deleteIngredient]);

  const handleView = useCallback((ingredient: Ingredient) => {
    // This will be handled by the component for modal/view logic
    console.log('View ingredient:', ingredient);
  }, []);

  const refreshData = useCallback(() => {
    // Note: Since useGetIngredients doesn't have refetch, 
    // the component will need to handle refresh
    window.location.reload();
  }, []);

  return {
    ingredients: ingredients || [],
    loading: ingredientsLoading,
    total: ingredientsTotal || 0,
    paginationModel,
    searchQuery,
    filters,
    setPaginationModel,
    setSearchQuery,
    setFilters,
    handleEdit,
    handleDelete,
    handleView,
    refreshData,
  };
};
