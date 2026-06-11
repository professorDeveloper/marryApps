import type { GridPaginationModel } from '@mui/x-data-grid';
import type { Inventory, InventoryFilters } from '../types';

import { useState, useEffect, useCallback } from 'react';

import { useInventoryAPI } from 'src/hooks/use-inventory-api';

import { toast } from 'src/components/snackbar';

export interface UseInventoryOptions {
  initialPageSize?: number;
  initialFilters?: InventoryFilters;
}

export interface UseInventoryReturn {
  inventories: Inventory[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  searchQuery: string;
  filters: InventoryFilters;
  setPaginationModel: (model: GridPaginationModel) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: InventoryFilters) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => Promise<void>;
  handleView: (inventory: Inventory) => void;
  refreshData: () => void;
}

export const useInventory = (options: UseInventoryOptions = {}): UseInventoryReturn => {
  const { initialPageSize = 20, initialFilters = {} } = options;
  
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { getInventories, deleteInventory } = useInventoryAPI();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

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

  // Load inventories
  const loadInventories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getInventories({
        search: debouncedSearchQuery,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
      });
      setInventories(response.items || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading inventories:', error);
      setInventories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, getInventories, paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    loadInventories();
  }, [loadInventories, refreshKey]);

  const handleEdit = useCallback((id: string) => {
    // This will be handled by the component using router
    window.location.href = `/menu/inventory/${id}/edit`;
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteInventory(id);
      toast.success('Inventory deleted successfully');
      setRefreshKey(prev => prev + 1); // Trigger refetch
    } catch (error) {
      console.error('Failed to delete inventory:', error);
      toast.error('Failed to delete inventory');
    }
  }, [deleteInventory]);

  const handleView = useCallback((inventory: Inventory) => {
    // This will be handled by the component for modal/view logic
  }, []);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    inventories,
    loading,
    total,
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
