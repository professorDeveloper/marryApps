import type { IUser } from 'src/types/user';
import type { EmployeeListProps } from '../types';
import type { RowAction, BatchAction, DataTableColumn } from 'src/sections/common/data-table/types/types';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/common/data-table/components/DataTable';

import { getErrorMessageKey } from 'src/auth/utils';

import { EmployeeUserCell } from './EmployeeUserCell';
import { EmployeeRoleCell } from './EmployeeRoleCell';
import { EmployeeViewModal } from './EmployeeViewModal';
import { useEmployeeApi } from '../hooks/useEmployeeApi';
import { EmployeeStatusCell } from './EmployeeStatusCell';
import { EmployeeDeleteDialog } from './EmployeeDeleteDialog';
import { ROLE_COLORS, STATUS_COLORS, DEFAULT_DATATABLE_CONFIG, EMPLOYEE_DATATABLE_PERSIST_KEY } from '../constants';

export function EmployeeListView({ role, useStaffApi = false, branchId }: EmployeeListProps) {
    const { t } = useTranslation('menu');
    const {
        employees,
        totalCount,
        query,
        page,
        rowsPerPage,
        setQuery,
        setPage,
        setRowsPerPage,
        deleteEmployee,
        deleteMultipleEmployees,
    } = useEmployeeApi(role, useStaffApi, branchId);

    // State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    // View modal hook
    const { isOpen, selectedData: selectedEmployee, openModal, closeModal } = useGenericViewModal<IUser>();

    const handleEdit = useCallback((employeeId: string) => {
        window.location.href = paths.settings.usersEdit(employeeId);
    }, []);

    const handleRequestDelete = useCallback((employeeId: string) => {
        setUserToDelete(employeeId);
        setDeleteDialogOpen(true);
    }, []);

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
            {
                key: 'actions',
                label: t('common.actions'),
                width: 140,
                sortable: false,
                filterable: false,
                reorderable: true,
                align: 'center',
                renderCell: ({ row }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title={t('users.edit')}>
                            <IconButton size="small" onClick={() => handleEdit(row.id)}>
                                <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('users.delete')}>
                            <IconButton size="small" color="error" onClick={() => handleRequestDelete(row.id)}>
                                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
        ],
        [handleEdit, handleRequestDelete, t]
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

    // Row actions
    const rowActions = useMemo<RowAction<IUser>[]>(
        () => [
            {
                label: t('view'),
                icon: <Iconify icon="solar:eye-bold" />,
                onClick: handleView,
            },
        ],
        [handleView, t]
    );

    // Header actions (Add button)
    const headerActions = useMemo(() => (
        <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            component={RouterLink}
            href={paths.settings.usersNew}
        >
            {t('users.add')}
        </Button>
    ), [t]);

    return (
        <Box sx={{m:2}}>
            <DataTable<IUser>
                persistKey={EMPLOYEE_DATATABLE_PERSIST_KEY}
                data={employees}
                columns={columns}
                defaultConfig={DEFAULT_DATATABLE_CONFIG}
                onReset={() => setQuery('')}
                showRowNumbers
                batchActions={batchActions}
                rowActions={rowActions}
                getRowId={(row) => row.id}
                search={{ value: query, onChange: setQuery }}
                pagination={{
                    page,
                    rowsPerPage,
                    totalCount,
                    onPageChange: setPage,
                    onRowsPerPageChange: setRowsPerPage,
                }}
                emptyTitle={t('users.noEmployees')}
                emptySubtitle={t('users.noEmployeesSubtitle')}
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
