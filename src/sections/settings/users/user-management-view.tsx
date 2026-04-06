import type { IUser } from 'src/types/user';
import type { RowAction, BatchAction, DataTableColumn } from 'src/sections/warehouse/deduction/components/utility-data-table/types/types';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { DataTable } from 'src/sections/warehouse/deduction/components/utility-data-table/components/DataTable';

import { useEmployeeApi } from '../../user/employee/hooks/useEmployeeApi';
import { DEFAULT_DATATABLE_CONFIG, EMPLOYEE_DATATABLE_PERSIST_KEY } from '../../user/employee/constants';

export function UserManagementView() {
  console.log('UserManagementView rendering');
  const { t } = useTranslation('menu');
  const [searchQuery, setSearchQuery] = useState('');

  // API hooks for both user types
  const { 
    employees: adminUsers, 
    employeesLoading: adminUsersLoading, 
    deleteEmployee: deleteAdminUser, 
    deleteMultipleEmployees: deleteMultipleAdminUsers 
  } = useEmployeeApi('admin', false);
  
  const { 
    employees: staffUsers, 
    employeesLoading: staffUsersLoading, 
    deleteEmployee: deleteStaffUser, 
    deleteMultipleEmployees: deleteMultipleStaffUsers 
  } = useEmployeeApi('user', true);

  // Combine all users into one array
  const allUsers = useMemo(() => [...(adminUsers || []), ...(staffUsers || [])], [adminUsers, staffUsers]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return allUsers.filter(user => 
      user.full_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.phone_number?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

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
          const status = String(value || '').toLowerCase();
          let bgColor = '#E2E3E5';
          let textColor = '#383D41';
          if (status === 'active') { 
            bgColor = '#D1ECF1'; 
            textColor = '#0C5460'; 
          }
          if (status === 'inactive') { 
            bgColor = '#F8D7DA'; 
            textColor = '#721C24'; 
          }
          return (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 700,
                backgroundColor: bgColor,
                color: textColor,
              }}
            >
              {status}
            </span>
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
        data={filteredUsers}
        columns={columns}
        rowActions={rowActions}
        batchActions={batchActions}
        persistKey={EMPLOYEE_DATATABLE_PERSIST_KEY}
        defaultConfig={DEFAULT_DATATABLE_CONFIG}
        onReset={() => setSearchQuery('')}
        getRowId={(row) => row.id}
        searchValue={searchQuery}
        onSearchChange={(value) => setSearchQuery(value)}
        headerActions={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
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
