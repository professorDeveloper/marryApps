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
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
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
  },
} as const;
