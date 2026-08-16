import type { EmployeeApi } from '../types';

import { useState, useCallback } from 'react';

import { useGetUsers, useDeleteUser } from 'src/actions/users';

/**
 * Hook for employee management operations
 */
export function useEmployeeApi(role?: string, useStaffApi = false, branchId?: string): EmployeeApi {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const usersData = useGetUsers({
        query,
        role,
        staff: useStaffApi || undefined,
        branch_id: branchId,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
    });
    const deleteUser = useDeleteUser();

    const deleteEmployee = async (id: string): Promise<void> => {
        await deleteUser(id);
    };

    const deleteMultipleEmployees = async (ids: string[]): Promise<void> => {
        await Promise.all(ids.map(id => deleteUser(id)));
    };

    const handleSetQuery = useCallback((value: string) => {
        setQuery(value);
        setPage(0);
    }, []);

    const handleSetRowsPerPage = useCallback((value: number) => {
        setRowsPerPage(value);
        setPage(0);
    }, []);

    return {
        employees: usersData.users,
        totalCount: usersData.totalCount,
        employeesLoading: usersData.usersLoading,
        query,
        page,
        rowsPerPage,
        setQuery: handleSetQuery,
        setPage,
        setRowsPerPage: handleSetRowsPerPage,
        deleteEmployee,
        deleteMultipleEmployees,
    };
}
