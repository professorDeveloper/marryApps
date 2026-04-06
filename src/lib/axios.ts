import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Token interceptor
 */
function decodeJwtPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

axiosInstance.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('jwt_access_token') ||
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken');
  const decoded = decodeJwtPayload(token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const storedRole = localStorage.getItem('user_role');
  const storedBrandId = localStorage.getItem('brand_id');
  const storedBranchId = localStorage.getItem('branch_id');
  const selectedBranchId = localStorage.getItem('selectedBranchId');

  const role = (storedRole || decoded?.role || '').toLowerCase();
  const brandId = decoded?.brand_id || decoded?.brandId || storedBrandId;
  const fallbackBranchId = storedBranchId || decoded?.branch_id || decoded?.branchId;
  const branchId = role === 'superadmin' ? selectedBranchId : fallbackBranchId;

  if (brandId) {
    (config.headers as any)['X-Brand-Id'] = String(brandId);
  }

  if (branchId) {
    (config.headers as any)['X-Branch-ID'] = String(branchId);
  }

  // Force pagination defaults for legacy list endpoints that are still called without params.
  const forcedListEndpoints = new Set([
    '/api/v1/departments',
    '/api/v1/categories',
    '/api/v1/compounds',
    '/api/v1/goods',
    '/api/v1/storages',
    '/api/v1/ingredient-groups',
    '/api/v1/ingredients',
    '/api/v1/ingredient-stock',
    '/api/v1/transfers',
    '/api/v1/suppliers',
    '/api/v1/deductions',
    '/api/v1/deductions/group',
    '/api/v1/orders',
  ]);

  const method = (config.method || 'get').toLowerCase();
  const rawUrl = config.url || '';
  const [pathOnly, queryString = ''] = rawUrl.split('?');
  const hasLimitInUrl = new URLSearchParams(queryString).has('limit');
  const paramsObj = (config.params || {}) as Record<string, unknown>;
  const hasLimitInParams = Object.prototype.hasOwnProperty.call(paramsObj, 'limit');

  if (method === 'get' && forcedListEndpoints.has(pathOnly) && !hasLimitInUrl && !hasLimitInParams) {
    config.params = {
      ...paramsObj,
      limit: 1000,
      offset: typeof paramsObj.offset === 'number' ? paramsObj.offset : 0,
    };
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong!';
    console.error('Axios error:', message);
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    console.log('Fetcher called with:', { url, config });
    console.log('Final URL will be:', url, config.params ? `?${new URLSearchParams(config.params as any).toString()}` : '');

    const res = await axiosInstance.get<T>(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// POST request helper
export const poster = async <T = unknown>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const res = await axiosInstance.post<T>(url, data, config);
    return res.data;
  } catch (error) {
    console.error('Poster failed:', error);
    throw error;
  }
};

// PUT request helper
export const putter = async <T = unknown>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const res = await axiosInstance.put<T>(url, data, config);
    return res.data;
  } catch (error) {
    console.error('Putter failed:', error);
    throw error;
  }
};

// DELETE request helper
export const deleter = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const res = await axiosInstance.delete<T>(url, config);
    return res.data;
  } catch (error) {
    console.error('Deleter failed:', error);
    throw error;
  }
};

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/v1/auth/me',
    signIn: '/api/v1/auth/login',
    signUp: '/api/v1/auth/register',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  category: {
    list: '/api/v1/categories',
    search: '/api/v1/categories/search',
    details: (id: string) => `/api/v1/categories/${id}`,
    create: '/api/v1/categories',
    update: (id: string) => `/api/v1/categories/${id}`,
    delete: (id: string) => `/api/v1/categories/${id}`,
    goods: (categoryId: string) => `/api/v1/categories/${categoryId}/goods`,
  },
  user: {
    list: '/api/user/list',
    details: '/api/user/details',
    search: '/api/user/search',
  },
  order: {
    list: '/api/order/list',
    details: '/api/order/details',
    search: '/api/order/search',
  },
  orders: {
    list: '/api/v1/orders',
    create: '/api/v1/orders',
  },
  department: {
    list: '/api/v1/departments',
    search: '/api/v1/departments/search',
    details: (id: string) => `/api/v1/departments/${id}`,
    create: '/api/v1/departments',
    update: (id: string) => `/api/v1/departments/${id}`,
    delete: (id: string) => `/api/v1/departments/${id}`,
    categories: (departmentId: string) => `/api/v1/categories/department/${departmentId}`,
  },
  compound: {
    list: '/api/v1/compounds-lang',
    search: '/api/v1/compounds/search',
    details: (id: string) => `/api/v1/compounds/${id}`,
    withCalculations: (id: string) => `/api/v1/compounds/${id}/with-calculations`,
    create: '/api/v1/compounds',
    createWithCalculations: '/api/v1/compounds/with-calculations',
    update: (id: string) => `/api/v1/compounds/${id}`,
    updateWithCalculations: (id: string) => `/api/v1/compounds/${id}/with-calculations`,
    delete: (id: string) => `/api/v1/compounds/${id}`,
    calculations: (compoundId: string) => `/api/v1/compounds/calculations?compound_id=${compoundId}`,
    createCalculation: '/api/v1/compounds/calculations',
    deleteCalculation: (calculationId: string) => `/api/v1/compounds/calculations/${calculationId}`,
  },
  storage: {
    list: '/api/v1/storages',
    search: '/api/v1/storages/search',
    byBranch: (branchId: string) => `/api/v1/storages/branch/${branchId}`,
    details: (id: string) => `/api/v1/storages/${id}`,
    create: '/api/v1/storages',
    update: (id: string) => `/api/v1/storages/${id}`,
    delete: (id: string) => `/api/v1/storages/${id}`,
  },
  meals: {
    list: '/api/v1/goods-lang',
    search: '/api/v1/goods/search',
    details: (id: string) => `/api/v1/goods/${id}`,
    withCalculations: (id: string) => `/api/v1/goods/${id}/with-calculations`,
    create: '/api/v1/goods',
    createWithCalculations: '/api/v1/goods/with-calculations',
    update: (id: string) => `/api/v1/goods/${id}`,
    updateWithCalculations: (id: string) => `/api/v1/goods/${id}/with-calculations`,
    delete: (id: string) => `/api/v1/goods/${id}`,
    calculations: (goodId: string) => `/api/v1/goods/calculations?good_id=${goodId}`,
    createCalculation: '/api/v1/goods/calculations',
    deleteCalculation: (calculationId: string) => `/api/v1/goods/calculations/${calculationId}`,
  },
  media: {
    uploadImage: '/api/v1/media/image',
    getImage: (objectName: string) => `/api/v1/media/image/${objectName}`,
  },
  ingredient: {
    list: '/api/v1/ingredients',
    details: (id: string) => `/api/v1/ingredients/${id}`,
    create: '/api/v1/ingredients',
    update: (id: string) => `/api/v1/ingredients/${id}`,
    delete: (id: string) => `/api/v1/ingredients/${id}`,
  },
  supplier: {
    list: '/api/v1/suppliers',
    create: '/api/v1/suppliers',
    details: (id: string) => `/api/v1/suppliers/${id}`,
    update: (id: string) => `/api/v1/suppliers/${id}`,
    delete: (id: string) => `/api/v1/suppliers/${id}`,
  },
  ingredientGroups: {
    list: '/api/v1/ingredient-groups',
    details: (id: string) => `/api/v1/ingredient-groups/${id}`,
    create: '/api/v1/ingredient-groups',
    update: (id: string) => `/api/v1/ingredient-groups/${id}`,
    delete: (id: string) => `/api/v1/ingredient-groups/${id}`,
  },
  branches: {
    list: '/api/v1/branches',
    details: (id: string) => `/api/v1/branches/${id}`,
    create: '/api/v1/branches',
    update: (id: string) => `/api/v1/branches/${id}`,
    delete: (id: string) => `/api/v1/branches/${id}`,
  },
  halls: {
    list: '/api/v1/halls',
    details: (id: string) => `/api/v1/halls/${id}`,
    create: '/api/v1/halls',
    update: (id: string) => `/api/v1/halls/${id}`,
    delete: (id: string) => `/api/v1/halls/${id}`,
  },
  cafeTables: {
    list: '/api/v1/cafe-tables',
    listByHall: (hallId: string) => `/api/v1/cafe-tables/hall/${hallId}`,
    details: (id: string) => `/api/v1/cafe-tables/${id}`,
    create: '/api/v1/cafe-tables',
    update: (id: string) => `/api/v1/cafe-tables/${id}`,
    delete: (id: string) => `/api/v1/cafe-tables/${id}`,
  },
  invoice: {
    list: '/api/v1/invoices',
    search: '/api/v1/invoices/search',
    details: (id: string) => `/api/v1/invoices/${id}`,
    create: '/api/v1/invoices',
    update: (id: string) => `/api/v1/invoices/${id}`,
    updateDetailsBatch: (id: string) => `/api/v1/invoices/${id}/details/batch`,
    delete: (id: string) => `/api/v1/invoices/${id}`,
    detailsList: '/api/v1/invoice-details',
    detailsCreate: '/api/v1/invoice-details',
    detailsUpdate: (id: string) => `/api/v1/invoice-details/${id}`,
    detailsDelete: (id: string) => `/api/v1/invoice-details/${id}`,
    detailsBatch: '/api/v1/invoice-details/batch',
    batch: '/api/v1/invoices/batch',
  },
  users: {
    list: '/api/v1/users',
    me: '/api/v1/user/me',
    byRole: (role: string) => `/api/v1/users/by-role?role=${role}`,
    staff: '/api/v1/users/staff',
    details: (id: string) => `/api/v1/users/${id}`,
    create: '/api/v1/users',
    update: (id: string) => `/api/v1/user/update/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
    register: '/api/v1/auth/register',
  },
  translations: {
    list: '/api/v1/translations?limit=1000&offset=0', // Get all translations with high limit
    create: '/api/v1/translations',
    update: (id: string) => `/api/v1/translations/${id}`,
    delete: (id: string) => `/api/v1/translations/${id}`,
  },
  inventory: {
    list: '/api/v1/inventories',
    search: '/api/v1/inventories/search',
    details: (id: string) => `/api/v1/inventories/${id}`,
    create: '/api/v1/inventories',
    batch: '/api/v1/inventories/batch',
    update: (id: string) => `/api/v1/inventories/${id}`,
    delete: (id: string) => `/api/v1/inventories/${id}`,
    apply: (id: string) => `/api/v1/inventories/${id}/apply`,
    items: (inventoryId: string) => `/api/v1/inventories/${inventoryId}/items`,
    createItems: (inventoryId: string) => `/api/v1/inventories/${inventoryId}/items`,
    updateItemsBatch: (inventoryId: string) => `/api/v1/inventories/${inventoryId}/items/batch`,
    updateItem: (inventoryId: string, itemId: string) => `/api/v1/inventories/${inventoryId}/items/${itemId}`,
    deleteItem: (inventoryId: string, itemId: string) => `/api/v1/inventories/${inventoryId}/items/${itemId}`,
  },
  deductions: {
    list: '/api/v1/deductions',
    details: (id: string) => `/api/v1/deductions/${id}`,
    create: '/api/v1/deductions',
    update: (id: string) => `/api/v1/deductions/${id}`,
    updateItemsBatch: (id: string) => `/api/v1/deductions/${id}/items/batch`,
    delete: (id: string) => `/api/v1/deductions/${id}`,
    groups: '/api/v1/deductions/group',
    createGroup: '/api/v1/deductions/group',
    updateGroup: (id: string) => `/api/v1/deductions/group/${id}`,
    deleteGroup: (id: string) => `/api/v1/deductions/group/${id}`,
  },
  transfers: {
    list: '/api/v1/transfers',
    details: (id: string) => `/api/v1/transfers/${id}`,
    create: '/api/v1/transfers',
    update: (id: string) => `/api/v1/transfers/${id}`,
    updateItemsBatch: (id: string) => `/api/v1/transfers/${id}/items/batch`,
    delete: (id: string) => `/api/v1/transfers/${id}`,
    batch: '/api/v1/transfers/batch',
  },
  shipments: {
    list: '/api/v1/shipments',
    batch: '/api/v1/shipments/batch',
    details: (id: string) => `/api/v1/shipments/${id}`,
    update: (id: string) => `/api/v1/shipments/${id}`,
    delete: (id: string) => `/api/v1/shipments/${id}`,
    deleteItem: (id: string, itemId: string) => `/api/v1/shipments/${id}/items/${itemId}`,
    items: (id: string) => `/api/v1/shipments/${id}/items`,
    confirm: (id: string) => `/api/v1/shipments/${id}/confirm`,
    cancel: (id: string) => `/api/v1/shipments/${id}/cancel`,
  },
  outgoingInvoices: {
    list: '/api/v1/outgoing-invoices',
    batch: '/api/v1/outgoing-invoices/batch',
    details: (id: string) => `/api/v1/outgoing-invoices/${id}`,
    update: (id: string) => `/api/v1/outgoing-invoices/${id}`,
    delete: (id: string) => `/api/v1/outgoing-invoices/${id}`,
    deleteItem: (id: string, itemId: string) => `/api/v1/outgoing-invoices/${id}/items/${itemId}`,
    items: (id: string) => `/api/v1/outgoing-invoices/${id}/items`,
    confirm: (id: string) => `/api/v1/outgoing-invoices/${id}/confirm`,
    cancel: (id: string) => `/api/v1/outgoing-invoices/${id}/cancel`,
  },
  separationActs: {
    list: '/api/v1/separation-acts',
    batch: '/api/v1/separation-acts/batch',
    details: (id: string) => `/api/v1/separation-acts/${id}`,
    update: (id: string) => `/api/v1/separation-acts/${id}`,
    delete: (id: string) => `/api/v1/separation-acts/${id}`,
    deleteItem: (id: string, itemId: string) => `/api/v1/separation-acts/${id}/items/${itemId}`,
    items: (id: string) => `/api/v1/separation-acts/${id}/items`,
    confirm: (id: string) => `/api/v1/separation-acts/${id}/confirm`,
    cancel: (id: string) => `/api/v1/separation-acts/${id}/cancel`,
  },
  ingredientStock: {
    list: '/api/v1/ingredient-stock',
    details: (id: string) => `/api/v1/ingredient-stock/${id}`,
    update: (id: string) => `/api/v1/ingredient-stock/${id}`,
    delete: (id: string) => `/api/v1/ingredient-stock/${id}`,
  },
  ingredientReports: {
    list: '/api/v1/ingredient-reports',
    details: (ingredientId: string) => `/api/v1/ingredient-reports/${ingredientId}`,
  },
  goodsReports: {
    list: '/api/v1/reports/goods',
    orders: (id: string) => `/api/v1/reports/goods/${id}/orders`,
  },
  bills: {
    list: '/api/v1/bills',
  },
  cashbox: {
    groupTransactions: {
      root: '/api/v1/group-transactions',
      details: (id: string) => `/api/v1/group-transactions/${id}`,
    },
    cashiers: {
      root: '/api/v1/cash-registers',
      details: (id: string) => `/api/v1/cash-registers/${id}`,
    },
    cashRegisters: {
      root: '/api/v1/cash-registers',
      byBranch: (branchId: string) => `/api/v1/cash-registers/branch/${branchId}`,
      details: (id: string) => `/api/v1/cash-registers/${id}`,
    },
    transactions: {
      root: '/api/v1/transactions',
      details: (id: string) => `/api/v1/transactions/${id}`,
    },
    report: '/api/v1/transactions/report',
  },
} as const;
