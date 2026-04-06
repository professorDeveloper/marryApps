import type { IUser } from 'src/types/user';
import type { EmployeeListProps } from './types';
import type { RowAction, BatchAction, DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';

import { getErrorMessageKey } from 'src/auth/utils';

import { useEmployeeApi } from './hooks/useEmployeeApi';
import { EmployeeUserCell } from './components/EmployeeUserCell';
import { EmployeeRoleCell } from './components/EmployeeRoleCell';
import { EmployeeViewModal } from './components/EmployeeViewModal';
import { EmployeeStatusCell } from './components/EmployeeStatusCell';
import { EmployeeDeleteDialog } from './components/EmployeeDeleteDialog';
import { ROLE_COLORS, STATUS_COLORS, DEFAULT_DATATABLE_CONFIG, EMPLOYEE_DATATABLE_PERSIST_KEY } from './constants';

export function EmployeeListView({ role, title, useStaffApi = false }: EmployeeListProps) {
    const theme = useTheme();
    const { t } = useTranslation('menu');

    // API hooks
    const { employees, employeesLoading, deleteEmployee, deleteMultipleEmployees } = useEmployeeApi(role, useStaffApi);

    // State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    // View modal hook
    const { isOpen, selectedData: selectedEmployee, openModal, closeModal } = useGenericViewModal<IUser>();

    // DataTable columns configuration
    const columns = useMemo<DataTableColumn<IUser>[]>(
        () => [
            {
                key: 'full_name',
                label: t('users.fullName'),
                width: 280,
                sortable: true,
                filterable: true,
                reorderable: true,
                renderCell: ({ row }) => (
                    <EmployeeUserCell employee={row} />
                ),
            },
            {
                key: 'username',
                label: t('users.username'),
                width: 150,
                sortable: true,
                filterable: true,
                reorderable: true,
                align: 'left',
            },
            {
                key: 'role',
                label: t('users.role'),
                width: 140,
                sortable: true,
                filterable: true,
                reorderable: true,
                filter: {
                    type: 'multi',
                    options: Object.keys(ROLE_COLORS),
                },
                renderCell: ({ row }) => (
                    <EmployeeRoleCell employee={row} roleColors={ROLE_COLORS} />
                ),
            },
            {
                key: 'phone_number',
                label: t('users.phoneNumber'),
                width: 150,
                sortable: true,
                filterable: true,
                reorderable: true,
                align: 'left',
            },
            {
                key: 'status',
                label: t('users.status'),
                width: 120,
                sortable: true,
                filterable: true,
                reorderable: true,
                filter: {
                    type: 'multi',
                    options: Object.keys(STATUS_COLORS),
                },
                renderCell: ({ row }) => (
                    <EmployeeStatusCell employee={row} statusColors={STATUS_COLORS} />
                ),
            },
        ],
        [t]
    );

    // Row actions
    const rowActions = useMemo<RowAction<IUser>[]>(
        () => [
            {
                label: t('users.edit'),
                icon: <Iconify icon="solar:pen-bold" />,
                onClick: (row) => {
                    const editPath = role === 'user'
                        ? paths.menu.user.restaurantStaffEdit(row.id)
                        : paths.menu.user.edit(row.id);
                    window.location.href = editPath;
                },
            },
            {
                label: t('users.delete'),
                icon: <Iconify icon="solar:trash-bin-trash-bold" />,
                onClick: (row) => {
                    setUserToDelete(row.id);
                    setDeleteDialogOpen(true);
                },
            },
        ],
        [role, t]
    );

    // Batch actions
    const batchActions = useMemo<BatchAction<IUser>[]>(
        () => [
            {
                label: t('users.delete'),
                icon: <Iconify icon="solar:trash-bin-trash-bold" />,
                color: 'error',
                onClick: async (selectedRows) => {
                    try {
                        await deleteMultipleEmployees(selectedRows.map(row => row.id));
                        toast.success(t('success.deleteSuccess'));
                    } catch (error) {
                        console.error('Error deleting users:', error);
                        const { key, fallback } = getErrorMessageKey(error);
                        const errorMessage = t(key, fallback);
                        toast.error(errorMessage);
                    }
                },
            },
        ],
        [deleteMultipleEmployees, t]
    );

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(async () => {
        if (userToDelete) {
            try {
                await deleteEmployee(userToDelete);
                toast.success(t('success.deleteSuccess'));
            } catch (error) {
                console.error('Error deleting user:', error);
                const { key, fallback } = getErrorMessageKey(error);
                const errorMessage = t(key, fallback);
                toast.error(errorMessage);
            } finally {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
            }
        }
    }, [userToDelete, deleteEmployee, t]);

    // Handle view action
    const handleView = useCallback((employee: IUser) => {
        openModal(employee);
    }, [openModal]);

    // Add view action to row actions
    const enhancedRowActions = useMemo<RowAction<IUser>[]>(
        () => [
            {
                label: t('view'),
                icon: <Iconify icon="solar:eye-bold" />,
                onClick: handleView,
            },
            ...rowActions,
        ],
        [handleView, rowActions]
    );

    // Header actions (Add button)
    const headerActions = useMemo(() => (
        <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            href={role === 'user'
                ? paths.menu.user.restaurantStaffNew
                : paths.menu.user.new
            }
        >
            {t('users.add')}
        </Button>
    ), [role, t]);

    return (
        <Box sx={{m:2}}>
            {/* DataTable */}
            <DataTable<IUser>
                persistKey={EMPLOYEE_DATATABLE_PERSIST_KEY}
                data={employees}
                columns={columns}
                defaultConfig={DEFAULT_DATATABLE_CONFIG}
                onReset={() => {/* Handle reset if needed */}}
                showRowNumbers
                batchActions={batchActions}
                rowActions={enhancedRowActions}
                getRowId={(row) => row.id}
                emptyTitle={t('users.noEmployees', 'No employees found')}
                emptySubtitle={t('users.noEmployeesSubtitle', 'Try adjusting filters or check if employees exist for this role.')}
                headerActions={headerActions}
            />

            <EmployeeDeleteDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setUserToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                employeeName={employees.find(emp => emp.id === userToDelete)?.full_name}
            />

            <EmployeeViewModal
                isOpen={isOpen}
                selectedEmployee={selectedEmployee}
                onClose={closeModal}
                t={t}
            />
        </Box>
    );
}
