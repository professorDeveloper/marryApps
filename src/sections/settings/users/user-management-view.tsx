import type { IUser } from 'src/types/user';
import type { RowAction, BatchAction, DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { Chip } from '@mui/material';

import { paths } from 'src/routes/paths';

import { getStatusColor, formatStatusLabel } from 'src/utils/status-colors';
import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';

import { useEmployeeApi } from '../../user/employee/hooks/useEmployeeApi';
import { DEFAULT_DATATABLE_CONFIG, EMPLOYEE_DATATABLE_PERSIST_KEY } from '../../user/employee/constants';
import { RouterLink } from 'src/routes/components';

export function UserManagementView() {
  const { t } = useTranslation('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  // API hooks for both user types with server-side search
  const {
    employees: adminUsers,
    employeesLoading: adminUsersLoading,
    totalCount: adminTotalCount,
    setQuery: setAdminQuery,
    deleteEmployee: deleteAdminUser,
  } = useEmployeeApi('admin', false);

  const {
    employees: staffUsers,
    employeesLoading: staffUsersLoading,
    totalCount: staffTotalCount,
    setQuery: setStaffQuery,
    deleteEmployee: deleteStaffUser,
  } = useEmployeeApi('user', true);

  // Pass search query to both API hooks for server-side search
  useEffect(() => {
    setAdminQuery(searchQuery);
    setStaffQuery(searchQuery);
  }, [searchQuery, setAdminQuery, setStaffQuery]);

  // Combine results from both API calls
  const allUsers = useMemo(() => [...(adminUsers || []), ...(staffUsers || [])], [adminUsers, staffUsers]);

  const totalCount = (adminTotalCount || 0) + (staffTotalCount || 0);

  const isLoading = adminUsersLoading || staffUsersLoading;

  // DataTable columns configuration
  const columns = useMemo<DataTableColumn<IUser>[]>(
    () => [
      {
        key: 'full_name',
        label: t('users.fullName', 'Full Name'),
        width: '5fr',
        sortable: true,
        getValue: (row) => row.full_name || '',
      },
      {
        key: 'username',
        label: t('users.username', 'Username'),
        width: '12fr',
        sortable: true,
        getValue: (row) => row.username || '',
      },
      {
        key: 'role',
        label: t('users.role', 'Role'),
        width: '0.8fr',
        sortable: true,
        getValue: (row) => row.role || '',
      },
      {
        key: 'phone_number',
        label: t('users.phone', 'Phone'),
        width: '1fr',
        sortable: true,
        getValue: (row) => row.phone_number || '',
      },
      {
        key: 'status',
        label: t('users.status', 'Status'),
        width: '0.7fr',
        sortable: true,
        getValue: (row) => row.status || '',
        renderCell: ({ value }) => {
          const status = String(value || '');
          return (
            <Chip
              size="small"
              label={formatStatusLabel(status)}
              color={getStatusColor(status)}
              sx={{ textTransform: 'capitalize' }}
            />
          );
        },
      },
      {
        key: 'created_at',
        label: t('users.createdAt', 'Created Date'),
        width: '0.9fr',
        sortable: true,
        getValue: (row) => row.created_at || '',
        renderCell: ({ value }) => value ? new Date(value as string).toLocaleDateString() : '',
      },
      {
        key: 'actions',
        label: t('common.actions', 'Actions'),
        width: '0.7fr',
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => {
                window.location.href = paths.settings.usersEdit(row.id);
              }}
              title={t('common.edit', 'Edit')}
            >
              <Iconify icon="solar:pen-bold" width={16} />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                const userToDelete = adminUsers?.find(u => u.id === row.id) || 
                                    staffUsers?.find(u => u.id === row.id);
                if (userToDelete) {
                  if (userToDelete.role === 'admin') {
                    deleteAdminUser(row.id);
                  } else {
                    deleteStaffUser(row.id);
                  }
                }
              }}
              title={t('common.delete', 'Delete')}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
            </IconButton>
          </Box>
        ),
      },
    ],
    [t, adminUsers, staffUsers, deleteAdminUser, deleteStaffUser]
  );

  // Row actions
  const rowActions = useMemo<RowAction<IUser>[]>(
    () => [
      {
        label: t('common.edit', 'Edit'),
        icon: 'solar:pen-bold',
        onClick: (user) => {
          window.location.href = paths.settings.usersEdit(user.id);
        },
      },
      {
        label: t('common.delete', 'Delete'),
        icon: 'solar:trash-bin-trash-bold',
        onClick: (user) => {
          const userToDelete = adminUsers?.find(u => u.id === user.id) || 
                              staffUsers?.find(u => u.id === user.id);
          if (userToDelete) {
            if (userToDelete.role === 'admin') {
              deleteAdminUser(user.id);
            } else {
              deleteStaffUser(user.id);
            }
          }
        },
        color: 'error',
      },
    ],
    [t, adminUsers, staffUsers, deleteAdminUser, deleteStaffUser]
  );

  // Batch actions
  const batchActions = useMemo<BatchAction<IUser>[]>(
    () => [
      {
        label: t('common.delete', 'Delete'),
        icon: 'solar:trash-bin-trash-bold',
        onClick: (selectedRows) => {
          selectedRows.forEach(user => {
            const userToDelete = adminUsers?.find(u => u.id === user.id) || 
                                staffUsers?.find(u => u.id === user.id);
            if (userToDelete) {
              if (userToDelete.role === 'admin') {
                deleteAdminUser(user.id);
              } else {
                deleteStaffUser(user.id);
              }
            }
          });
        },
        color: 'error',
      },
    ],
    [t, adminUsers, staffUsers, deleteAdminUser, deleteStaffUser]
  );

  return (
    <Box sx={{ px: 2 }}>
      <DataTable<IUser>
        data={allUsers}
        columns={columns}
        rowActions={rowActions}
        batchActions={batchActions}
        persistKey={EMPLOYEE_DATATABLE_PERSIST_KEY}
        defaultConfig={DEFAULT_DATATABLE_CONFIG}
        onReset={() => {
          setSearchQuery('');
          setPaginationModel({ page: 0, pageSize: 20 });
        }}
        getRowId={(row) => row.id}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPaginationModel({ page: 0, pageSize: 20 });
        }}
        page={paginationModel.page}
        rowsPerPage={paginationModel.pageSize}
        totalCount={totalCount}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(page) => {
          setPaginationModel((prev) => ({ ...prev, page }));
        }}
        onRowsPerPageChange={(pageSize) => {
          setPaginationModel({ page: 0, pageSize });
        }}
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            component={RouterLink}
            href={paths.settings.usersNew}
            size="small"
          >
            {t('common.add', 'Add')}
          </Button>
        }
      />
    </Box>
  );
}
