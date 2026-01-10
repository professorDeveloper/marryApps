import type { SWRConfiguration } from 'swr';
import type { IProductItem, IStorageItem, IDepartmentItem, IDepartmentFormData } from 'src/types/departments.tsx';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ============================================================================
// DEPARTMENTS HOOKS
// ============================================================================

/**
 * Backend response structure
 */
interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}

/**
 * Get all departments
 */
export function useGetDepartments() {
  const url = endpoints.department.list;

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IDepartmentItem[]>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const memoizedValue = useMemo(
    () => ({
      departments: data?.data || [],
      departmentsLoading: isLoading,
      departmentsError: error,
      departmentsValidating: isValidating,
      departmentsEmpty: !isLoading && !isValidating && !data?.data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Get single department by ID
 */
export function useGetDepartment(departmentId: string) {
  const url = departmentId ? endpoints.department.details(departmentId) : '';

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IDepartmentItem>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const memoizedValue = useMemo(
    () => ({
      department: data?.data,
      departmentLoading: isLoading,
      departmentError: error,
      departmentValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Create new department
 */
export function useCreateDepartment() {
  const createDepartment = useCallback(
    async (formData: IDepartmentFormData) => {
      try {
        const response = await poster<BackendResponse<IDepartmentItem>>(
          endpoints.department.create,
          formData
        );

        // Revalidate departments list
        await mutate(endpoints.department.list);

        return response.data;
      } catch (error) {
        console.error('Failed to create department:', error);
        throw error;
      }
    },
    []
  );

  return { createDepartment };
}

/**
 * Update department
 */
export function useUpdateDepartment() {
  const updateDepartment = useCallback(
    async (departmentId: string, formData: IDepartmentFormData) => {
      try {
        const response = await putter<BackendResponse<IDepartmentItem>>(
          endpoints.department.update(departmentId),
          formData
        );

        // Revalidate departments list and single department
        await mutate(endpoints.department.list);
        await mutate(endpoints.department.details(departmentId));

        return response.data;
      } catch (error) {
        console.error('Failed to update department:', error);
        throw error;
      }
    },
    []
  );

  return { updateDepartment };
}

/**
 * Delete department
 */
export function useDeleteDepartment() {
  const deleteDepartment = useCallback(
    async (departmentId: string) => {
      try {
        await deleter(endpoints.department.delete(departmentId));

        // Revalidate departments list
        await mutate(endpoints.department.list);

        return true;
      } catch (error) {
        console.error('Failed to delete department:', error);
        throw error;
      }
    },
    []
  );

  return { deleteDepartment };
}

// ============================================================================
// STORAGE HOOKS
// ============================================================================

/**
 * Get all storages
 */
export function useGetStorages() {
  const url = endpoints.storage.list;

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IStorageItem[]>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const memoizedValue = useMemo(
    () => ({
      storages: Array.isArray(data?.data) ? data.data : [],
      storagesLoading: isLoading,
      storagesError: error,
      storagesValidating: isValidating,
      storagesEmpty: !isLoading && !isValidating && !data?.data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Get storage name by ID
 */
export function useGetStorageName(storageId: string) {
  const { storages } = useGetStorages();

  const storageName = useMemo(() => {
    if (!storageId || !Array.isArray(storages) || storages.length === 0) {
      return storageId || '-';
    }
    const storage = storages.find((s) => s.id === storageId);
    return storage?.name || storageId;
  }, [storages, storageId]);

  return storageName;
}

/**
 * Get department name by ID
 */
export function useGetDepartmentName(departmentId: string) {
  const { departments } = useGetDepartments();

  const departmentName = useMemo(() => {
    if (!departmentId || !Array.isArray(departments) || departments.length === 0) {
      return departmentId || '-';
    }
    const department = departments.find((d) => d.id === departmentId);
    return department?.name || departmentId;
  }, [departments, departmentId]);

  return departmentName;
}

// ============================================================================
// PRODUCTS HOOKS (EXISTING)
// ============================================================================

type ProductsData = {
  products: IProductItem[];
};

export function useGetProducts() {
  const url = endpoints.product.list;

  const { data, isLoading, error, isValidating } = useSWR<ProductsData>(url, fetcher, {
    ...swrOptions,
  });

  const memoizedValue = useMemo(
    () => ({
      products: data?.products || [],
      productsLoading: isLoading,
      productsError: error,
      productsValidating: isValidating,
      productsEmpty: !isLoading && !isValidating && !data?.products.length,
    }),
    [data?.products, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

type ProductData = {
  product: IProductItem;
};

export function useGetProduct(productId: string) {
  const url = productId ? [endpoints.product.details, { params: { productId } }] : '';

  const { data, isLoading, error, isValidating } = useSWR<ProductData>(url, fetcher, {
    ...swrOptions,
  });

  const memoizedValue = useMemo(
    () => ({
      product: data?.product,
      productLoading: isLoading,
      productError: error,
      productValidating: isValidating,
    }),
    [data?.product, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

type SearchResultsData = {
  results: IProductItem[];
};

export function useSearchProducts(query: string) {
  const url = query ? [endpoints.product.search, { params: { query } }] : '';

  const { data, isLoading, error, isValidating } = useSWR<SearchResultsData>(url, fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !isValidating && !data?.results.length,
    }),
    [data?.results, error, isLoading, isValidating]
  );

  return memoizedValue;
}
