import type { GridColDef } from '@mui/x-data-grid';
import type { IUser } from 'src/types/user';

import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useGenericViewModal } from 'src/hooks/use-generic-view-modal';

import { getInitials, getAvatarColor } from 'src/utils/avatar';

import { useGetUsersByRole, useDeleteUser } from 'src/actions/users';
import { getErrorMessageKey } from 'src/auth/utils';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { GenericTableView } from 'src/components/generic-table-view';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';
import { GenericViewModal, SpecificationsTable, type SpecificationRow } from 'src/components/generic-view-view';

/**
 * User avatar renderer
 */
function RenderCellUser({ params }: { params: any }) {
    const user = params.row as IUser;
    const initials = getInitials(user.full_name);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                paddingTop: '15px',
                paddingBottom: '15px',
            }}
        >
            <Avatar
                sx={{
                    width: 60,
                    height: 60,
                    backgroundColor: getAvatarColor(user.full_name),
                    fontSize: '2',
                    fontWeight: 600,
                    color: '#fff',
                }}
            >
                {initials}
            </Avatar>
            <Box>
                <Box sx={{ fontWeight: 600 }}>{user.full_name}</Box>
                <Box sx={{ fontSize: '0.875rem', opacity: 0.5 }}>{user.username}</Box>
            </Box>
        </Box>
    );
}

/**
 * Role renderer
 */
function RenderCellRole({ params }: { params: any }) {
    const user = params.row as IUser;
    const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
        admin: 'error',
        manager: 'warning',
        cashier: 'info',
        waiter: 'primary',
        kitchen: 'secondary',
        user: 'default',
    };

    return (
        <Chip
            label={user.role}
            color={roleColors[user.role] || 'default'}
            size="small"
            variant="outlined"
        />
    );
}

/**
 * Status renderer
 */
function RenderCellStatus({ params }: { params: any }) {
    const user = params.row as IUser;
    const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
        active: 'success',
        inactive: 'error',
    };

    return (
        <Chip
            label={user.status}
            color={statusColors[user.status] || 'default'}
            size="small"
            variant="outlined"
        />
    );
}

function UserSpecifications({ user, t }: { user: IUser; t: any }) {
    const specs: SpecificationRow[] = [
        { label: t('users.fullName'), value: user.full_name || '-' },
        { label: t('users.username'), value: user.username || '-' },
        { label: t('users.role'), value: user.role || '-' },
        { label: t('users.status'), value: user.status || '-' },
        { label: t('users.phoneNumber'), value: user.phone_number || '-' },
        { label: t('users.pincode'), value: user.pincode ? '****' : '-' },
        { label: t('users.terminal'), value: user.terminal || '-' },
        { label: t('users.createdAt'), value: new Date(user.created_at).toLocaleString() || '-' },
    ];

    return <SpecificationsTable rows={specs} />;
}

interface EmployeeListViewProps {
    role: string;
    title: string;
    useStaffApi?: boolean;
}

export function EmployeeListView({ role, title, useStaffApi = false }: EmployeeListViewProps) {
    console.log('EmployeeListView rendered for role:', role);
    const theme = useTheme();
    const { t } = useTranslation('menu');

    // API hooks
    const { users: employees, usersLoading } = useGetUsersByRole(role, useStaffApi);
    const deleteUser = useDeleteUser();

    // State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    // View modal hook
    const { isOpen, selectedData, openModal, closeModal } = useGenericViewModal<IUser>();

    // Columns config
    const columns = useMemo<GridColDef[]>(
        () => [
            {
                field: 'full_name',
                headerName: t('users.fullName'),
                flex: 1,
                minWidth: 280,
                hideable: false,
                renderCell: (params) => (
                    <RenderCellUser params={params} />
                ),
            },
            {
                field: 'username',
                headerName: t('users.username'),
                width: 150,
            },
            {
                field: 'role',
                headerName: t('users.role'),
                width: 140,
                renderCell: (params) => <RenderCellRole params={params} />,
            },
            {
                field: 'phone_number',
                headerName: t('users.phoneNumber'),
                width: 150,
            },
            // {
            //     field: 'status',
            //     headerName: t('users.status'),
            //     width: 120,
            //     renderCell: (params) => <RenderCellStatus params={params} />,
            // },
            {
                type: 'actions',
                field: 'actions',
                headerName: t('actions'),
                width: 150,
                // align: 'right',
                // headerAlign: 'right',
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                getActions: (params) => [
                    <CustomGridActionsCellItem
                        // showInMenu
                        label={t('users.edit')}
                        icon={<Iconify icon="solar:pen-bold" />}
                        href={role === 'user'
                            ? paths.menu.user.restaurantStaffEdit(params.row.id)
                            : paths.menu.user.edit(params.row.id)
                        }
                    />,
                    <CustomGridActionsCellItem
                        key="delete"
                        // showInMenu
                        label={t('users.delete')}
                        icon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => {
                            setUserToDelete(params.row.id);
                            setDeleteDialogOpen(true);
                        }}
                        style={{ color: theme.vars.palette.error.main }}
                    />,
                ],
            },
        ],
        [theme.vars.palette.error.main, t]
    );

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete);
                toast.success(t('success.deleteSuccess'));
            } catch (error) {
                console.error('Error deleting user:', error);
                // Use translated error message if available
                const { key, fallback } = getErrorMessageKey(error);
                const errorMessage = t(key, fallback);
                toast.error(errorMessage);
            } finally {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
            }
        }
    }, [userToDelete, deleteUser, t]);

    const handleDeleteMultiple = useCallback(async (ids: string[]) => {
        try {
            await Promise.all(ids.map(id => deleteUser(id)));
            toast.success(t('success.deleteSuccess'));
        } catch (error) {
            console.error('Error deleting users:', error);
            // Use translated error message if available
            const { key, fallback } = getErrorMessageKey(error);
            const errorMessage = t(key, fallback);
            toast.error(errorMessage);
        }
    }, [deleteUser, t]);

    return (
        <>
            <GenericTableView<IUser>
                data={employees}
                loading={usersLoading}
                columns={columns}
                breadcrumbs={{
                    heading: title,
                    links: [
                        { name: t('app'), href: paths.menu.root },
                        { name: title, href: paths.menu.user.root },
                        { name: t('users.list') },
                    ],
                }}
                addButton={{
                    label: t('users.add'),
                    href: role === 'user'
                        ? paths.menu.user.restaurantStaffNew
                        : paths.menu.user.new,
                }}
                filterOptions={{
                    status: [
                        { value: 'active', label: t('users.statusActive') },
                        { value: 'inactive', label: t('users.statusInactive') },
                    ],
                    role: [
                        { value: 'admin', label: 'Admin' },
                        { value: 'manager', label: 'Manager' },
                        { value: 'cashier', label: 'Cashier' },
                        { value: 'waiter', label: 'Waiter' },
                        { value: 'kitchen', label: 'Kitchen' },
                        { value: 'user', label: 'User' },
                    ],
                }}
                initialFilters={{
                    status: [],
                    role: [],
                }}
                hideColumnsTogglable={['actions']}
                onDeleteRows={handleDeleteMultiple}
                onRowClick={(id) => {
                    const employee = employees.find(emp => emp.id === id);
                    if (employee) {
                        openModal(employee);
                    }
                }}
            />

            {/* User View Modal */}
            <GenericViewModal
                isOpen={isOpen}
                onClose={closeModal}
                title={selectedData?.full_name || title}
                data={selectedData}
                renderContent={(data) => <UserSpecifications user={data} t={t} />}
                maxWidth="sm"
                slideDirection="left"
                position="right"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('users.deleteConfirm')}</DialogTitle>
                <DialogContent>
                    {t('users.deleteMessage')}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setDeleteDialogOpen(false)}
                    >
                        {t('users.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        autoFocus
                    >
                        {t('users.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
