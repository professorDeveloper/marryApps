import type { SWRConfiguration } from 'swr';
import type { IUser, IUserFormData, IUserRegisterData } from 'src/types/user';

import useSWR, { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { poster, putter, fetcher, deleter, endpoints } from 'src/lib/axios';

const swrOptions: SWRConfiguration = {
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

/**
 * Backend response structure
 */
interface BackendResponse<T> {
    status: string;
    message: string;
    data: T;
    code: number;
}

function normalizeUser(rawUser: any): IUser {
    return {
        ...rawUser,
        full_name: rawUser?.full_name ?? rawUser?.fullName ?? '',
        phone_number: rawUser?.phone_number ?? rawUser?.phoneNumber ?? '',
        brand_id: rawUser?.brand_id ?? rawUser?.brandId ?? '',
        branch_id: rawUser?.branch_id ?? rawUser?.branchId ?? '',
        pincode: rawUser?.pincode ?? rawUser?.pinCode ?? '',
        terminal: rawUser?.terminal ?? rawUser?.terminal_name ?? '',
        status:
            rawUser?.status ??
            (typeof rawUser?.is_active === 'boolean'
                ? (rawUser.is_active ? 'active' : 'inactive')
                : undefined),
    };
}

function extractUserPayload(input: any): any {
    if (!input) return undefined;

    if (Array.isArray(input)) {
        return input[0];
    }

    if (typeof input !== 'object') {
        return undefined;
    }

    if (input.user && typeof input.user === 'object') return input.user;
    if (input.item && typeof input.item === 'object') return input.item;
    if (input.result && typeof input.result === 'object') return extractUserPayload(input.result);
    if (input.data && typeof input.data === 'object') return extractUserPayload(input.data);

    // If this object already looks like a user record, return it directly.
    if ('id' in input || 'username' in input || 'full_name' in input || 'fullName' in input) {
        return input;
    }

    return undefined;
}

function getBrandIdFromToken(): string {
    const token =
        sessionStorage.getItem('jwt_access_token')
        || sessionStorage.getItem('accessToken')
        || localStorage.getItem('accessToken');

    if (!token) return '';

    try {
        const [, payload] = token.split('.');
        if (!payload) return '';
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(normalized));
        return decoded?.brand_id || decoded?.brandId || '';
    } catch {
        return '';
    }
}


/**
 * Get users by role
 */
export function useGetUsersByRole(role: string, useStaffApi = false) {
    const url = useStaffApi ? endpoints.users.staff : (role ? endpoints.users.byRole(role) : '');

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IUser[]> | IUser[]>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const users = useMemo(() => {
        const rawUsers = Array.isArray(data) ? data : (data?.data || []);

        return rawUsers.map((user: any) => normalizeUser(user));
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            users,
            usersLoading: isLoading,
            usersError: error,
            usersValidating: isValidating,
            usersEmpty: !isLoading && !isValidating && !users.length,
        }),
        [error, isLoading, isValidating, users]
    );

    return memoizedValue;
}

/**
 * Get all users
 */
export function useGetUsers() {
    const url = endpoints.users.list;

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IUser[]>>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const memoizedValue = useMemo(
        () => ({
            users: data?.data || [],
            usersLoading: isLoading,
            usersError: error,
            usersValidating: isValidating,
            usersEmpty: !isLoading && !isValidating && !data?.data?.length,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Get single user by ID
 */
export function useGetUser(userId: string) {
    const url = userId ? endpoints.users.details(userId) : '';

    const { data, isLoading, error, isValidating } = useSWR<BackendResponse<IUser> | IUser | { data?: IUser }>(
        url,
        fetcher,
        { ...swrOptions }
    );

    const user = useMemo(() => {
        if (!data) return undefined;
        const rawUser = extractUserPayload(data);
        if (!rawUser) return undefined;
        return normalizeUser(rawUser);
    }, [data]);

    const memoizedValue = useMemo(
        () => ({
            user,
            userLoading: isLoading,
            userError: error,
            userValidating: isValidating,
        }),
        [user, error, isLoading, isValidating]
    );

    return memoizedValue;
}

/**
 * Create user (via register API)
 */
export function useCreateUser() {
    const callback = useCallback(
        async (formData: IUserFormData) => {
            const tokenBrandId = getBrandIdFromToken();

            // Transform form data to register API format
            const registerData: IUserRegisterData = {
                // Token ichidagi brand_id ustuvor (UUID id emas, haqiqiy tenant kodi bo'lishi uchun)
                brand_id: tokenBrandId || formData.brand_id || localStorage.getItem('brand_id') || '',
                // selectedBranchId ustuvor, bo'lmasa tokendan kelgan branch_id ishlatiladi
                branch_id:
                    formData.branch_id
                    || localStorage.getItem('selectedBranchId')
                    || localStorage.getItem('branch_id')
                    || '',
                fullName: formData.full_name || formData.fullName || '',
                username: formData.username,
                password: formData.password || Math.random().toString(36).slice(-8), // Generate random if not provided
                phoneNumber: formData.phone_number || formData.phoneNumber || '',
                pincode: formData.pincode || '',
                role: formData.role,
            };

            const response = await poster<IUser>(endpoints.users.register, registerData);
            // Revalidate list
            mutate(endpoints.users.list);
            return response;
        },
        []
    );

    return callback;
}

/**
 * Update user
 */
export function useUpdateUser() {
    const callback = useCallback(
        async (userId: string, formData: IUserFormData) => {
            const response = await putter<IUser>(endpoints.users.update(userId), formData);
            // Revalidate list and details
            mutate(endpoints.users.list);
            mutate(endpoints.users.details(userId));
            return response;
        },
        []
    );

    return callback;
}

/**
 * Delete user
 */
export function useDeleteUser() {
    const callback = useCallback(
        async (userId: string) => {
            await deleter(endpoints.users.delete(userId));
            await mutate(endpoints.users.list);
            const roles = ['admin', 'manager', 'cashier', 'waiter', 'kitchen', 'user'];
            roles.forEach(role => {
                const roleUrl = endpoints.users.byRole(role);
                mutate(roleUrl, undefined, { revalidate: true });
            });
            mutate(endpoints.users.staff, undefined, { revalidate: true });
        },
        []
    );

    return callback;
}
