import type { TFunction } from 'i18next';
import type { IUserFormData } from 'src/types/user';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMemo, useCallback } from 'react';
import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetUser, useCreateUser, useUpdateUser, useDeleteUser } from 'src/actions/users';

import { GenericEditView } from 'src/components/generic-edit-view';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { getErrorMessageKey } from 'src/auth/utils';

export interface EmployeeEditViewUserProps {
    userId?: string;
    isNew?: boolean;
}

function buildBasicInfoSection(): CardSection {
    return {
        id: 'basic',
        title: 'users.basicTitle',
        columns: 2,
        fields: [
            {
                key: 'full_name',
                label: 'users.fullName',
                type: 'text',
                required: true,
                defaultValue: '',
            },
            {
                key: 'username',
                label: 'users.username',
                type: 'text',
                required: true,
                defaultValue: '',
            },
            {
                key: 'phone_number',
                label: 'users.phoneNumber',
                type: 'text',
                defaultValue: '',
            },

            {
                key: 'role',
                label: 'users.role',
                type: 'select',
                required: true,
                options: [
                    { value: 'cashier', label: 'Cashier' },
                    { value: 'waiter', label: 'Waiter' },
                    { value: 'kitchen', label: 'Kitchen' },
                    { value: 'user', label: 'User' },
                ],
                defaultValue: '',
            },
        ],
    };
}

function buildStatusSection(): CardSection {
    return {
        id: 'status',
        title: 'users.statusTitle',
        columns: 2,
        fields: [
            {
                key: 'pincode',
                label: 'users.pincode',
                type: 'text',
                required: true,
                defaultValue: '',
            }
        ],
    };
}

export function EmployeeEditViewUser({ userId, isNew = false }: EmployeeEditViewUserProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');

    // API hooks
    const { user, userLoading } = useGetUser(userId || '');
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const ownBranchId = localStorage.getItem('branch_id') || '';

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            // Validate required fields
            if (!formData.full_name || !formData.full_name.trim()) {
                throw new Error(t('users.fullNameRequired'));
            }
            if (!formData.username || !formData.username.trim()) {
                throw new Error(t('users.usernameRequired'));
            }
            if (!formData.role) {
                throw new Error(t('users.roleRequired'));
            }

            if (!formData.pincode) {
                throw new Error(t('users.pincodeRequired'));
            }
            if (!ownBranchId) {
                throw new Error(t('users.branchRequired'));
            }

            const userData: IUserFormData = {
                full_name: formData.full_name,
                username: formData.username,
                password: formData.password,
                role: formData.role,
                phone_number: formData.phone_number,
                pincode: formData.pincode,
                terminal: formData.terminal,
                // Login qilgan vaqtda saqlangan brand_id ni olamiz
                brand_id: localStorage.getItem('brand_id') || 'default_brand',
                // Xodim doimo joriy foydalanuvchining branch'iga biriktiriladi
                branch_id: ownBranchId,
            };

            try {
                if (isNew) {
                    await createUser(userData);
                } else if (userId) {
                    await updateUser(userId, userData);
                }

                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise((resolve) => setTimeout(resolve, 500));
                router.push(paths.menu.user.restaurantStaff);
            } catch (err) {
                console.error('Error saving user:', err);
                // Get translated error message
                const { key, fallback } = getErrorMessageKey(err);
                const translatedMessage = t(key, fallback);
                throw new Error(translatedMessage);
            }
        },
        [isNew, userId, createUser, updateUser, router, t, ownBranchId]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            if (userId) {
                await deleteUser(userId);
                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise((resolve) => setTimeout(resolve, 500));
                router.push(paths.menu.user.restaurantStaff);
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            const { key, fallback } = getErrorMessageKey(err);
            const translatedMessage = t(key, fallback);
            throw new Error(translatedMessage);
        }
    }, [userId, deleteUser, router, t]);

    // Build sections
    const BASIC_INFO_SECTION_T = translateSection(buildBasicInfoSection(), t);
    const STATUS_SECTION_T = translateSection(buildStatusSection(), t);

    const config: GenericEditViewConfig = {
        title: isNew ? t('users.new') : t('users.edit'),
        entityName: 'user',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('overview.employe.staff'), href: paths.menu.user.restaurantStaff },
            { name: isNew ? t('users.new') : t('users.edit'), href: '' },
        ],
        sections: [BASIC_INFO_SECTION_T, STATUS_SECTION_T],
        onSubmit: handleSubmit,
        onDelete: !isNew ? handleDelete : undefined,
        showDeleteButton: !isNew,
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* BREADCRUMBS AND TITLE */}
                <CustomBreadcrumbs
                    heading={isNew ? t('users.new') : t('users.edit')}
                    links={config.breadcrumbs}
                    sx={{ mb: 3 }}
                />

                <GenericEditView config={config} data={user} isNew={isNew} loading={userLoading} />
            </Box>
        </Box>
    );
}

function translateSection(section: CardSection, t: TFunction): CardSection {
    const mapped = { ...section } as CardSection;
    if (typeof mapped.title === 'string' && mapped.title.includes('.')) {
        mapped.title = t(mapped.title as string, mapped.title as string);
    }
    if (Array.isArray(mapped.fields)) {
        mapped.fields = mapped.fields.map((f) => {
            const nf = { ...f };
            if (typeof nf.label === 'string' && nf.label.includes('.')) {
                nf.label = t(nf.label as string, nf.label as string);
            }
            if (nf.options && Array.isArray(nf.options)) {
                nf.options = nf.options.map((opt) => ({
                    ...opt,
                    label: typeof opt.label === 'string' && opt.label.includes('.')
                        ? t(opt.label as string, opt.label as string)
                        : opt.label,
                }));
            }
            return nf;
        });
    }
    return mapped;
}

// ============================================================================
// WRAPPER COMPONENT - EXTRACTS :id FROM ROUTE PARAMS
// ============================================================================

export function EmployeeEditViewUserWrapper({ isNew = false }: { isNew?: boolean }) {
    const { id } = useParams<{ id?: string }>();

    return <EmployeeEditViewUser userId={id} isNew={isNew} />;
}

