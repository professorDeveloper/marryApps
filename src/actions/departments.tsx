import type { SWRConfiguration } from 'swr';
import type {
  IProductItem,
  IStorageItem,
  ICategoryItem,
  IDepartmentItem,
  IStorageFormData,
  ITranslationItem,
  IDepartmentFormData,
  ITranslationFormData,
} from 'src/types/departments.tsx';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { poster, putter, deleter, fetcher, endpoints } from 'src/lib/axios';

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
 * Helper function to enrich departments with storage names and translations
 */
function enrichDepartments(
  departmentsData: IDepartmentItem[],
  storages: IStorageItem[],
  translations: ITranslationItem[],
  currentLang: string
): IDepartmentItem[] {
  const storageMap = new Map(
    storages?.map((storage: IStorageItem) => [storage.id, storage.name]) || []
  );

  const translationMap = new Map(
    translations?.map((translation: ITranslationItem) => [translation.id, translation]) || []
  );

  // Language mapping for translation keys
  // i18n language codes -> translation field keys
  const getLangKey = (lang: string): keyof ITranslationItem => {
    switch (lang) {
      case 'uz-Latn': // Uzbek Latin
        return 'uz-Latn' as keyof ITranslationItem;
      case 'uz-Cyrl': // Uzbek Cyrillic
        return 'uz-Cyrl' as keyof ITranslationItem;
      case 'uz': // Default Uzbek
        return 'uz' as keyof ITranslationItem;
      case 'ru': // Russian
        return 'ru' as keyof ITranslationItem;
      case 'en': // English
        return 'en' as keyof ITranslationItem;
      default:
        return 'en' as keyof ITranslationItem;
    }
  };

  return departmentsData.map((dept) => {
    const translation = dept.name_i18n ? translationMap.get(dept.name_i18n) : null;

    // Get translated name based on current language
    let displayName = dept.name;
    if (translation) {
      const langKey = getLangKey(currentLang);
      if (langKey in translation && translation[langKey]) {
        displayName = translation[langKey] as string;
      } else if (currentLang.startsWith('uz') && translation.uz) {
        // Fallback to default uz if uz-Latn or uz-Cyrl not available
        displayName = translation.uz;
      } else if (translation.en) {
        // Fallback to English as last resort
        displayName = translation.en;
      }
    }

    return {
      ...dept,
      name: displayName,
      storage_name: storageMap.get(dept.storage_id) || '-',
    };
  });
}

/**
 * Get all departments
 */
export function useGetDepartments() {
  const url = endpoints.department.list;
  const { i18n } = useTranslation();

  // Get storages for enrichment
  const { storages } = useGetStorages();

  // Get translations
  const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
    endpoints.translations.list,
    fetcher,
    { ...swrOptions }
  );

  const translations = useMemo(() => {
    if (!translationsData) return [];
    if (Array.isArray(translationsData)) return translationsData;
    return translationsData.data || [];
  }, [translationsData]);

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IDepartmentItem[]>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const enrichedDepartments = useMemo(() => {
    const departments = data?.data || [];
    const currentLang = i18n.resolvedLanguage || 'en';
    return enrichDepartments(departments, storages, translations, currentLang);
  }, [data?.data, storages, translations, i18n.resolvedLanguage]);

  const memoizedValue = useMemo(
    () => ({
      departments: enrichedDepartments,
      departmentsLoading: isLoading,
      departmentsError: error,
      departmentsValidating: isValidating,
      departmentsEmpty: !isLoading && !isValidating && !enrichedDepartments.length,
    }),
    [enrichedDepartments, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Get single department by ID
 */
export function useGetDepartment(departmentId: string) {
  const url = departmentId ? endpoints.department.details(departmentId) : '';
  const { i18n } = useTranslation();

  // Get translations
  const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
    endpoints.translations.list,
    fetcher,
    { ...swrOptions }
  );

  const translations = useMemo(() => {
    if (!translationsData) return [];
    if (Array.isArray(translationsData)) return translationsData;
    return translationsData.data || [];
  }, [translationsData]);

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IDepartmentItem>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const department = useMemo(() => {
    if (!data?.data) return undefined;
    const dept = data.data;
    const currentLang = i18n.resolvedLanguage || 'en';

    // Language mapping for translation keys
    const getLangKey = (lang: string): keyof ITranslationItem => {
      switch (lang) {
        case 'uz-Latn': // Uzbek Latin
          return 'uz-Latn' as keyof ITranslationItem;
        case 'uz-Cyrl': // Uzbek Cyrillic
          return 'uz-Cyrl' as keyof ITranslationItem;
        case 'uz': // Default Uzbek
          return 'uz' as keyof ITranslationItem;
        case 'ru': // Russian
          return 'ru' as keyof ITranslationItem;
        case 'en': // English
          return 'en' as keyof ITranslationItem;
        default:
          return 'en' as keyof ITranslationItem;
      }
    };

    // Apply translation if available
    let enrichedDept: any = { ...dept };
    if (dept.name_i18n) {
      const translation = translations.find((t) => t.id === dept.name_i18n);
      if (translation) {
        // Add all translation versions for editing
        enrichedDept.name_en = translation.en || '';
        enrichedDept.name_ru = translation.ru || '';
        enrichedDept.name = translation.uz || '';

        const langKey = getLangKey(currentLang);
        if (langKey in translation && translation[langKey]) {
          enrichedDept.displayName = translation[langKey] as string;
        } else if (currentLang.startsWith('uz') && translation.uz) {
          // Fallback to default uz if uz-Latn or uz-Cyrl not available
          enrichedDept.displayName = translation.uz;
        } else if (translation.en) {
          // Fallback to English as last resort
          enrichedDept.displayName = translation.en;
        }
      }
    }

    return enrichedDept;
  }, [data?.data, translations, i18n.resolvedLanguage]);

  const memoizedValue = useMemo(
    () => ({
      department,
      departmentLoading: isLoading,
      departmentError: error,
      departmentValidating: isValidating,
    }),
    [department, error, isLoading, isValidating]
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
        let name_i18n = formData.name_i18n;

        // If name_i18n is not provided, create a translation
        if (!name_i18n) {
          // Extract language-specific names from formData if available
          // Default: use the name as English, and name as fallback for other languages
          const translationData: ITranslationFormData = {
            en: formData.name || '',
            ru: formData.name || '',
            uz: formData.name || '',
          };

          try {
            const translationResponse = await poster<any>(
              endpoints.translations.create,
              translationData
            );
            // Extract ID from response
            name_i18n = translationResponse?.data?.id || translationResponse?.id;
          } catch (error) {
            console.error('Failed to create translation:', error);
            throw new Error('Failed to create translation for department');
          }
        }

        const departmentPayload = {
          name: formData.name,
          name_i18n,
          color_code: formData.color_code,
          storage_id: formData.storage_id,
          picture_url: formData.picture_url,
        };

        const response = await poster<BackendResponse<IDepartmentItem>>(
          endpoints.department.create,
          departmentPayload
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
        let name_i18n = formData.name_i18n;

        // If name_i18n is not provided and name changed, create or update translation
        if (!name_i18n) {
          const translationData: ITranslationFormData = {
            en: formData.name || '',
            ru: formData.name || '',
            uz: formData.name || '',
          };

          try {
            const translationResponse = await poster<any>(
              endpoints.translations.create,
              translationData
            );
            name_i18n = translationResponse?.data?.id || translationResponse?.id;
          } catch (error) {
            console.error('Failed to create translation:', error);
            throw new Error('Failed to create translation for department');
          }
        }

        const departmentPayload = {
          name: formData.name,
          name_i18n,
          color_code: formData.color_code,
          storage_id: formData.storage_id,
          picture_url: formData.picture_url,
        };

        const response = await putter<BackendResponse<IDepartmentItem>>(
          endpoints.department.update(departmentId),
          departmentPayload
        );

        // Note: Mutations are now handled by the caller (edit-view) to ensure proper cache ordering
        // await mutate(endpoints.department.list);
        // await mutate(endpoints.department.details(departmentId));

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

/**
 * Get categories by department
 */
export function useGetCategoriesByDepartment(departmentId: string) {
  const url = departmentId ? endpoints.department.categories(departmentId) : '';

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<ICategoryItem[]>>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const memoizedValue = useMemo(
    () => ({
      categories: data?.data || [],
      categoriesLoading: isLoading,
      categoriesError: error,
      categoriesValidating: isValidating,
      categoriesEmpty: !isLoading && !isValidating && !data?.data?.length,
    }),
    [data?.data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ============================================================================
// STORAGE HOOKS
// ============================================================================

/**
 * Get all storages
 */
export function useGetStorages() {
  const url = endpoints.storage.list;
  const { i18n } = useTranslation();

  // Get translations
  const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
    endpoints.translations.list,
    fetcher,
    { ...swrOptions }
  );

  const translations = useMemo(() => {
    if (!translationsData) return [];
    if (Array.isArray(translationsData)) return translationsData;
    return translationsData.data || [];
  }, [translationsData]);

  const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IStorageItem[]> | IStorageItem[]>(
    url,
    fetcher,
    { ...swrOptions }
  );

  const storages = useMemo(() => {
    if (!data) return [];

    let storageList: IStorageItem[] = [];
    if (Array.isArray(data)) {
      storageList = data;
    } else if (Array.isArray((data as BackendResponse<IStorageItem[]>).data)) {
      storageList = (data as BackendResponse<IStorageItem[]>).data;
    }

    const currentLang = i18n.resolvedLanguage || 'en';

    // Language mapping for translation keys
    const getLangKey = (lang: string): keyof ITranslationItem => {
      switch (lang) {
        case 'uz-Latn': // Uzbek Latin
          return 'uz-Latn' as keyof ITranslationItem;
        case 'uz-Cyrl': // Uzbek Cyrillic
          return 'uz-Cyrl' as keyof ITranslationItem;
        case 'uz': // Default Uzbek
          return 'uz' as keyof ITranslationItem;
        case 'ru': // Russian
          return 'ru' as keyof ITranslationItem;
        case 'en': // English
          return 'en' as keyof ITranslationItem;
        default:
          return 'en' as keyof ITranslationItem;
      }
    };

    // Enrich storages with translations
    return storageList.map((storage) => {
      const translation = storage.name_i18n ? translations.find((t) => t.id === storage.name_i18n) : null;

      let displayName = storage.name;
      if (translation) {
        const langKey = getLangKey(currentLang);
        if (langKey in translation && translation[langKey]) {
          displayName = translation[langKey] as string;
        } else if (currentLang.startsWith('uz') && translation.uz) {
          displayName = translation.uz;
        } else if (translation.en) {
          displayName = translation.en;
        }
      }

      return {
        ...storage,
        name: displayName,
      };
    });
  }, [data, translations, i18n.resolvedLanguage]);

  const memoizedValue = useMemo(
    () => ({
      storages,
      storagesLoading: isLoading,
      storagesError: error,
      storagesValidating: isValidating,
      storagesEmpty: !isLoading && !isValidating && !storages.length,
    }),
    [storages, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Get single storage by ID
 */
export function useGetStorage(storageId: string) {
  const url = storageId ? endpoints.storage.details(storageId) : '';
  const { i18n } = useTranslation();

  // Get translations
  const { data: translationsData } = useSWR<BackendResponse<ITranslationItem[]>>(
    endpoints.translations.list,
    fetcher,
    { ...swrOptions }
  );

  const translations = useMemo(() => {
    if (!translationsData) return [];
    if (Array.isArray(translationsData)) return translationsData;
    return translationsData.data || [];
  }, [translationsData]);

  const { data, isLoading, error, isValidating } = useSWR<
    BackendResponse<IStorageItem> | IStorageItem
  >(url, fetcher, { ...swrOptions });

  const storage = useMemo(() => {
    if (!data) return undefined;

    let storageData: IStorageItem;
    if ('data' in (data as any)) {
      storageData = (data as BackendResponse<IStorageItem>).data;
    } else {
      storageData = data as IStorageItem;
    }

    const currentLang = i18n.resolvedLanguage || 'en';

    // Language mapping for translation keys
    const getLangKey = (lang: string): keyof ITranslationItem => {
      switch (lang) {
        case 'uz-Latn': // Uzbek Latin
          return 'uz-Latn' as keyof ITranslationItem;
        case 'uz-Cyrl': // Uzbek Cyrillic
          return 'uz-Cyrl' as keyof ITranslationItem;
        case 'uz': // Default Uzbek
          return 'uz' as keyof ITranslationItem;
        case 'ru': // Russian
          return 'ru' as keyof ITranslationItem;
        case 'en': // English
          return 'en' as keyof ITranslationItem;
        default:
          return 'en' as keyof ITranslationItem;
      }
    };

    // Build response with translation data for form editing
    let responseData: any = {
      ...storageData,
    };

    // Apply translation if available
    if (storageData.name_i18n) {
      const translation = translations.find((t) => t.id === storageData.name_i18n);
      if (translation) {
        const langKey = getLangKey(currentLang);
        if (langKey in translation && translation[langKey]) {
          responseData.name = translation[langKey] as string;
        } else if (currentLang.startsWith('uz') && translation.uz) {
          responseData.name = translation.uz;
        } else if (translation.en) {
          responseData.name = translation.en;
        }

        // Add translation fields for form editing
        responseData.name_en = translation.en || '';
        responseData.name_ru = translation.ru || '';
        responseData.name_uz = translation.uz || '';
      }
    }

    return responseData;
  }, [data, translations, i18n.resolvedLanguage]);

  const memoizedValue = useMemo(
    () => ({
      storage,
      storageLoading: isLoading,
      storageError: error,
      storageValidating: isValidating,
    }),
    [storage, error, isLoading, isValidating]
  );

  return memoizedValue;
}

/**
 * Create new storage
 */
export function useCreateStorage() {
  const createStorage = useCallback(
    async (formData: IStorageFormData) => {
      try {
        let name_i18n = formData.name_i18n;

        // Create or use provided translation
        if (!name_i18n && (formData.name_en || formData.name_ru)) {
          const translationData: ITranslationFormData = {
            en: formData.name_en || formData.name || '',
            ru: formData.name_ru || formData.name || '',
            uz: formData.name || '',
          };

          try {
            const translationResponse = await poster<any>(
              endpoints.translations.create,
              translationData
            );
            name_i18n = translationResponse?.data?.id || translationResponse?.id;
          } catch (error) {
            console.error('Failed to create translation:', error);
            throw new Error('Failed to create translation for storage');
          }
        } else if (!name_i18n) {
          // If no translation data provided, create default translation
          const translationData: ITranslationFormData = {
            en: formData.name || '',
            ru: formData.name || '',
            uz: formData.name || '',
          };

          try {
            const translationResponse = await poster<any>(
              endpoints.translations.create,
              translationData
            );
            name_i18n = translationResponse?.data?.id || translationResponse?.id;
          } catch (error) {
            console.error('Failed to create translation:', error);
            throw new Error('Failed to create translation for storage');
          }
        }

        const storagePayload = {
          name: formData.name,
          name_i18n,
          branch_id: formData.branch_id,
          color_code: formData.color_code,
          picture_url: formData.picture_url,
        };

        const response = await poster<BackendResponse<IStorageItem>>(
          endpoints.storage.create,
          storagePayload
        );
        await mutate(endpoints.storage.list);
        return response.data;
      } catch (error) {
        console.error('Failed to create storage:', error);
        throw error;
      }
    },
    []
  );

  return { createStorage };
}

/**
 * Update translation by ID
 */
export function useUpdateTranslation() {
  const updateTranslation = useCallback(
    async (translationId: string, translationData: Partial<ITranslationFormData>) => {
      try {
        const response = await putter<BackendResponse<ITranslationItem>>(
          endpoints.translations.update(translationId),
          translationData
        );
        await mutate(endpoints.translations.list);
        return response.data;
      } catch (error) {
        console.error('Failed to update translation:', error);
        throw error;
      }
    },
    []
  );

  return { updateTranslation };
}

/**
 * Update storage
 */
export function useUpdateStorage() {
  const updateStorage = useCallback(
    async (storageId: string, formData: IStorageFormData) => {
      try {
        let name_i18n = formData.name_i18n;

        // Create or use provided translation
        if (!name_i18n && (formData.name_en || formData.name_ru)) {
          const translationData: ITranslationFormData = {
            en: formData.name_en || formData.name || '',
            ru: formData.name_ru || formData.name || '',
            uz: formData.name || '',
          };

          try {
            const translationResponse = await poster<any>(
              endpoints.translations.create,
              translationData
            );
            name_i18n = translationResponse?.data?.id || translationResponse?.id;
          } catch (error) {
            console.error('Failed to create translation:', error);
            throw new Error('Failed to create translation for storage');
          }
        } else if (!name_i18n) {
          // If no translation data provided, create default translation
          const translationData: ITranslationFormData = {
            en: formData.name || '',
            ru: formData.name || '',
            uz: formData.name || '',
          };

          try {
            const translationResponse = await poster<any>(
              endpoints.translations.create,
              translationData
            );
            name_i18n = translationResponse?.data?.id || translationResponse?.id;
          } catch (error) {
            console.error('Failed to create translation:', error);
            throw new Error('Failed to create translation for storage');
          }
        }

        const storagePayload = {
          name: formData.name,
          name_i18n,
          branch_id: formData.branch_id,
          color_code: formData.color_code,
          picture_url: formData.picture_url,
        };

        const response = await putter<BackendResponse<IStorageItem>>(
          endpoints.storage.update(storageId),
          storagePayload
        );
        await mutate(endpoints.storage.list);
        await mutate(endpoints.storage.details(storageId));
        return response.data;
      } catch (error) {
        console.error('Failed to update storage:', error);
        throw error;
      }
    },
    []
  );

  return { updateStorage };
}

/**
 * Delete storage
 */
export function useDeleteStorage() {
  const deleteStorage = useCallback(
    async (storageId: string) => {
      await deleter(endpoints.storage.delete(storageId));
      await mutate(endpoints.storage.list);
      return true;
    },
    []
  );

  return { deleteStorage };
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
