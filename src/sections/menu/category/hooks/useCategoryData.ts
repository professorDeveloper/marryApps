import type { ICategory } from 'src/types/category';
import type { CategoryTableFilters } from '../types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { useGetStorages, useGetDepartments } from 'src/actions/departments';
import { useDeleteCategory, useGetCategoriesPage } from 'src/actions/categories';

/**
 * Hook for managing category data with filtering, pagination, and CRUD operations
 */
export function useCategoryData() {
    const { t } = useTranslation('menu');
    const [filters, setFilters] = useState<CategoryTableFilters>({
        limit: 20,
        offset: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
    const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);
    const [goodsModalOpen, setGoodsModalOpen] = useState(false);

    // API hooks
    const { categories, categoriesLoading, pagination } = useGetCategoriesPage({
        ...filters,
        sort_by: sortState.key || undefined,
        sort_order: sortState.dir || undefined,
    });
    const { deleteCategory } = useDeleteCategory();
    const { storages } = useGetStorages();
    const { departments } = useGetDepartments();

    // Extract total count from pagination
    const totalCount = pagination?.total || 0;

    // Enrich categories with storage and department names
    const enrichedCategories = useMemo(() => {
        const departmentMap = new Map(departments?.map((dept: any) => [dept.id, 
            { "deparment_id": dept.id, "department_name": dept.name,
                "storage_id":dept._expand.storage_id.id, "storage_name":dept._expand.storage_id.name
            
             }
        ]) || []);

        return categories.map((category: ICategory) => ({
            ...category,
            storage_name: departmentMap.get(category.department_id || '')?.storage_name || category.storage_name || '-',
            department_name: departmentMap.get(category.department_id || '')?.department_name || category.department_name || '-',
        }));
    }, [categories, departments]);

    // Handle search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setFilters((prev) => ({
            ...prev,
            search: query.trim() || undefined,
            offset: 0, // Reset to first page when searching
        }));
    }, []);

    // Handle pagination
    const handlePageChange = useCallback((page: number, pageSize: number) => {
        setFilters((prev) => ({
            ...prev,
            offset: page * pageSize,
            limit: pageSize,
        }));
    }, []);

    // Handle filter changes
    const handleFilterChange = useCallback((newFilters: Partial<CategoryTableFilters>) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
            offset: 0, // Reset to first page when filtering
        }));
    }, []);

    // Handle delete
    const handleDelete = useCallback(async (categoryId: string) => {
        try {
            await deleteCategory(categoryId);
            return true;
        } catch (error) {
            console.error('Failed to delete category:', error);
            return false;
        }
    }, [deleteCategory]);

    // Handle view goods
    const handleViewGoods = useCallback((category: ICategory) => {
        setSelectedCategory(category);
        setGoodsModalOpen(true);
    }, []);

    // Handle close goods modal
    const handleCloseGoodsModal = useCallback(() => {
        setGoodsModalOpen(false);
        setSelectedCategory(null);
    }, []);

    // Handle edit
    const handleEdit = useCallback((category: ICategory) => {
        // Navigate to edit page
        window.location.href = paths.menu.category.edit(category.id);
    }, []);

    // Handle sort
    const handleSortChange = useCallback((sort: { key: string | null; dir: 'asc' | 'desc' | null }) => {
        setSortState({ key: sort.key, dir: sort.dir });
        setFilters((prev) => ({ ...prev, offset: 0 })); // Reset to first page when sorting
    }, []);

    return {
        // Data
        categories: enrichedCategories,
        loading: categoriesLoading,
        totalCount,
        storages: storages || [],
        departments: departments || [],
        selectedCategory,
        goodsModalOpen,
        searchQuery,
        filters,
        sortState,

        // Actions
        handleSearch,
        handlePageChange,
        handleFilterChange,
        handleDelete,
        handleViewGoods,
        handleCloseGoodsModal,
        handleEdit,
        handleSortChange,

        // Setters
        setSelectedCategory,
        setGoodsModalOpen,
    };
}
