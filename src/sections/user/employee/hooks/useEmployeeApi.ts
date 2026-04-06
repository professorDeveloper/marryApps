import type { EmployeeApi } from '../types';

import { useDeleteUser, useGetUsersByRole } from 'src/actions/users';

/**
 * Hook for employee management operations
 */
export function useEmployeeApi(role: string, useStaffApi = false): EmployeeApi {
    const usersData = useGetUsersByRole(role, useStaffApi);
    const deleteUser = useDeleteUser();

    const deleteEmployee = async (id: string): Promise<void> => {
        await deleteUser(id);
    };

    const deleteMultipleEmployees = async (ids: string[]): Promise<void> => {
        await Promise.all(ids.map(id => deleteUser(id)));
    };

    return {
        employees: usersData.users,
        employeesLoading: usersData.usersLoading,
        deleteEmployee,
        deleteMultipleEmployees,
    };
}
