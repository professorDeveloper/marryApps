import type { ICategory } from 'src/types/category';
import type { CategoryTableFilters } from '../types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { useDeleteCategory, useGetCategoriesPage } from 'src/actions/categories';
import { useMetadata } from 'src/hooks/use-metadata';
import { MetadataEntity } from 'src/types/metadata';

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
    const { data: metadata } = useMetadata([MetadataEntity.STORAGES, MetadataEntity.DEPARTMENTS]);

    // Extract total count from pagination
    const totalCount = pagination?.total || 0;

    const storages = metadata.storages || [];
    const departments = metadata.departments || [];

    // Enrich categories with storage and department names
    const enrichedCategories = useMemo(() => {
        const storageMap = new Map(storages?.map((storage: any) => [storage.id, storage.name]) || []);
        const departmentMap = new Map(departments?.map((dept: any) => [dept.id, dept.name]) || []);

        return categories.map((category: ICategory) => ({
            ...category,
            storage_name: storageMap.get(category.storage_id) || category.storage_name || '-',
            department_name: departmentMap.get(category.department_id) || category.department_name || '-',
        }));
    }, [categories, storages, departments]);

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
        storages,
        departments,
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
