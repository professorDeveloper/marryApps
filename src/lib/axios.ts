import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Token interceptor
 */
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
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

// ----------------------------------------------------------------------

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
  department: {
    list: '/api/v1/departments',
    details: (id: string) => `/api/v1/departments/${id}`,
    create: '/api/v1/departments',
    update: (id: string) => `/api/v1/departments/${id}`,
    delete: (id: string) => `/api/v1/departments/${id}`,
    categories: (departmentId: string) => `/api/v1/categories/department/${departmentId}`,
  },
  compound: {
    list: '/api/v1/compounds',
    details: (id: string) => `/api/v1/compounds/${id}`,
    withCalculations: (id: string) => `/api/v1/compounds/${id}/with-calculations`,
    create: '/api/v1/compounds',
    update: (id: string) => `/api/v1/compounds/${id}`,
    delete: (id: string) => `/api/v1/compounds/${id}`,
    calculations: (compoundId: string) => `/api/v1/compounds/calculations?compound_id=${compoundId}`,
    createCalculation: '/api/v1/compounds/calculations',
    deleteCalculation: (calculationId: string) => `/api/v1/compounds/calculations/${calculationId}`,
  },
  storage: {
    list: '/api/v1/storages',
    details: (id: string) => `/api/v1/storages/${id}`,
    create: '/api/v1/storages',
    update: (id: string) => `/api/v1/storages/${id}`,
    delete: (id: string) => `/api/v1/storages/${id}`,
  },
  meals: {
    list: '/api/v1/goods',
    details: (id: string) => `/api/v1/goods/${id}`,
    withCalculations: (id: string) => `/api/v1/goods/${id}/with-calculations`,
    create: '/api/v1/goods',
    update: (id: string) => `/api/v1/goods/${id}`,
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
  ingredientGroups: {
    list: '/api/v1/ingredient-groups',
    details: (id: string) => `/api/v1/ingredient-groups/${id}`,
  },
  branches: {
    list: '/api/v1/branches',
    details: (id: string) => `/api/v1/branches/${id}`,
    create: '/api/v1/branches',
    update: (id: string) => `/api/v1/branches/${id}`,
    delete: (id: string) => `/api/v1/branches/${id}`,
  },
  invoice: {
    details: '/api/v1/invoice-details',
  },
  users: {
    list: '/api/v1/users',
    byRole: (role: string) => `/api/v1/users/by-role?role=${role}`,
    details: (id: string) => `/api/v1/users/${id}`,
    create: '/api/v1/users',
    update: (id: string) => `/api/v1/user/update/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
    register: '/api/v1/auth/register',
  },
} as const;
