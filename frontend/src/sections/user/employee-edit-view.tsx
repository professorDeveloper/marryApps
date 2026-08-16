
import type { TFunction } from 'i18next';
import type { IUserFormData } from 'src/types/user';
import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTransactionsAPI } from 'src/hooks/use-transactions-api';

import { useGetUser, useCreateUser, useUpdateUser, useDeleteUser } from 'src/actions/users';

import { GenericEditView } from 'src/components/generic-edit-view';

export interface EmployeeEditViewProps {
    userId?: string;
    isNew?: boolean;
    role?: string;
}

function buildBasicInfoSection(cashRegisterOptions: { value: string; label: string }[]): CardSection {
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
                key: 'password',
                label: 'users.password',
                type: 'text',
                required: true,
                defaultValue: '',
            },
            {
                key: 'role',
                label: 'users.role',
                type: 'select',
                required: true,
                options: [
                    { value: 'admin', label: 'Admin' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'cashier', label: 'Cashier' },
                    { value: 'waiter', label: 'Waiter' },
                    { value: 'kitchen', label: 'Kitchen' },
                    { value: 'user', label: 'User' },
                ],
                defaultValue: '',
            },
            {
                key: 'cash_register_id',
                label: 'cashbox.cashiers.title',
                type: 'select',
                required: false,
                options: cashRegisterOptions,
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
            },
            {
                key: 'terminal',
                label: 'users.terminal',
                type: 'text',
                defaultValue: '',
            },
        ],
    };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeEditView({ userId, isNew = false, role }: EmployeeEditViewProps) {
    const router = useRouter();
    const { t } = useTranslation('menu');

    // API hooks
    const { user, userLoading } = useGetUser(userId || '');
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();
    const { getCashRegistersByBranch } = useTransactionsAPI();

    const [cashRegisterOptions, setCashRegisterOptions] = useState<{ value: string; label: string }[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const ownBranchId = localStorage.getItem('selectedBranchId') || localStorage.getItem('branch_id') || '';

    useEffect(() => {
        let isActive = true;

        const loadCashRegisters = async () => {
            if (!ownBranchId) {
                setCashRegisterOptions([]);
                return;
            }

            const registers = await getCashRegistersByBranch(ownBranchId);
            if (!isActive) return;

            setCashRegisterOptions(
                registers.map((item) => ({
                    value: item.id,
                    label: item.name || item.id,
                }))
            );
        };

        loadCashRegisters();

        return () => {
            isActive = false;
        };
    }, [getCashRegistersByBranch, ownBranchId]);

    // Handle form submission
    const handleSubmit = useCallback(
        async (formData: Record<string, any>) => {
            try {
                setIsSaving(true);

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
                if (!formData.password) {
                    throw new Error(t('users.passwordRequired'));
                }
                if (!formData.pincode) {
                    throw new Error(t('users.pincodeRequired'));
                }
                if (isNew && !formData.cash_register_id) {
                    throw new Error(t('users.cashRegisterRequired'));
                }

                const userData: IUserFormData = {
                    full_name: formData.full_name,
                    username: formData.username,
                    password: formData.password,
                    role: 'admin',
                    phone_number: formData.phone_number,
                    pincode: formData.pincode,
                    terminal: formData.terminal,
                    cash_register_id: formData.cash_register_id,
                    // Login qilgan vaqtda saqlangan brand_id ni olamiz
                    brand_id: localStorage.getItem('brand_id') || 'default_brand',
                    branch_id: ownBranchId,
                };

                if (isNew) {
                    await createUser(userData);
                } else if (userId) {
                    await updateUser(userId, userData);
                }

                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise((resolve) => setTimeout(resolve, 500));
                router.push(paths.menu.user.root);
            } catch (err) {
                console.error('Error saving user:', err);
                setIsSaving(false);
                throw err;
            }
        },
        [isNew, userId, createUser, updateUser, router, t]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        try {
            setIsDeleting(true);

            if (userId) {
                await deleteUser(userId);
                // Add small delay to ensure SWR cache is updated before redirect
                await new Promise((resolve) => setTimeout(resolve, 500));
                router.push(paths.menu.user.root);
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            setIsDeleting(false);
        }
    }, [userId, deleteUser, router]);

    // Build sections
    const BASIC_INFO_SECTION_T = translateSection(buildBasicInfoSection(cashRegisterOptions), t);
    const STATUS_SECTION_T = translateSection(buildStatusSection(), t);

    const config: GenericEditViewConfig = {
        title: isNew ? t('users.new') : t('users.edit'),
        entityName: 'user',
        showBreadcrumbs: false,
        breadcrumbs: [
            { name: t('app'), href: paths.menu.root },
            { name: t('users.title'), href: paths.menu.user.root },
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
         

                <GenericEditView config={config} data={user} isNew={isNew} />
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

export function EmployeeEditViewWrapper({ isNew = false }: { isNew?: boolean }) {
    const { id } = useParams<{ id?: string }>();

    return <EmployeeEditView userId={id} isNew={isNew} />;
}
