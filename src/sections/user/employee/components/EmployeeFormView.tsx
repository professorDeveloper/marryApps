import type { UserRole, IUserFormData } from 'src/types/user';
import type { EmployeeFormProps, EmployeeFormState } from '../types';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useCallback } from 'react';

import {
    Box,
    Card,
    Alert,
    Stack,
    Button,
    Select,
    MenuItem,
    TextField,
    InputLabel,
    Typography,
    FormControl,
    InputAdornment,
    CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { useGetUser, useCreateUser, useUpdateUser } from 'src/actions/users';

import { Iconify } from 'src/components/iconify';

import { ROLE_OPTIONS } from '../constants';
import { useCashRegisters } from '../hooks/useCashRegisters';

export const EmployeeFormView = React.memo(function EmployeeFormView({ isNew = false }: EmployeeFormProps) {
    const { t } = useTranslation('menu');
    const router = useRouter();
    const { id: userId } = useParams();

    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const { user: existingUser } = useGetUser(userId || '');

    const { ownBranchId, options: cashRegisterOptions, loading: cashRegistersLoading } = useCashRegisters();

    const [formData, setFormData] = useState<EmployeeFormState>({
        full_name: '',
        username: '',
        phone_number: '',
        password: '',
        role: '',
        is_active: true,
        pincode: '',
        cash_register_id: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load existing user data when updating
    useEffect(() => {
        if (!isNew && existingUser) {
            setFormData({
                full_name: existingUser.full_name || '',
                username: existingUser.username || '',
                phone_number: existingUser.phone_number || '',
                password: '', // Password is not returned from backend for security
                role: (existingUser.role || '') as UserRole | '',
                is_active:
                    typeof existingUser.is_active === 'boolean'
                        ? existingUser.is_active
                        : existingUser.status === 'active',
                pincode: existingUser.pincode || '',
                cash_register_id: existingUser.cash_register_id || '',
            });
        }
    }, [existingUser, isNew]);

    const handleChange = useCallback((field: keyof EmployeeFormState, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setError(null);
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.full_name?.trim()) {
            setError(t('users.fullNameRequired'));
            return false;
        }
        if (!formData.username?.trim()) {
            setError(t('users.usernameRequired'));
            return false;
        }
        if (!formData.role) {
            setError(t('users.roleRequired'));
            return false;
        }
        if (formData.role === 'cashier' && !formData.cash_register_id) {
            setError(t('users.cashRegisterRequired'));
            return false;
        }
        return true;
    }, [formData, t, isNew]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!validateForm()) return;

            setIsSaving(true);
            try {
                const userData: IUserFormData = {
                    full_name: formData.full_name || '',
                    username: formData.username || '',
                    role: (formData.role || 'user') as UserRole,
                    is_active: formData.is_active,
                    phone_number: formData.phone_number,
                    cash_register_id: formData.cash_register_id,
                    brand_id: localStorage.getItem('brand_id') || 'default_brand',
                    branch_id: ownBranchId,
                };

                if (formData.password.trim()) {
                    userData.password = formData.password.trim();
                }

                if (formData.pincode.trim()) {
                    userData.pincode = formData.pincode.trim();
                }

                if (isNew) {
                    await createUser(userData);
                    toast.success(t('users.created'));
                } else if (userId) {
                    await updateUser(userId, userData);
                    toast.success(t('users.updated'));
                }

                await new Promise((resolve) => setTimeout(resolve, 500));
                router.push(paths.settings.users);
            } catch (err) {
                console.error('Error saving user:', err);
                const message = err instanceof Error ? err.message : 'Failed to save employee';
                setError(message);
                toast.error(err instanceof Error ? err.message : t('error.loadFailed'));
            } finally {
                setIsSaving(false);
            }
        },
        [createUser, updateUser, formData, ownBranchId, router, t, validateForm, isNew, userId]
    );

    const isSubmitting = isSaving || cashRegistersLoading;

    return (
        <Box sx={{ p: 3 }}>


            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                <Card
                    sx={{
                        p: 3,
                        mb: 3,
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Stack spacing={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    backgroundColor: 'var(--accent-soft)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Iconify icon="solar:user-id-bold" sx={{ color: 'var(--accent)' }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {t('users.identityDetails')}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {t('users.personalLoginInfo')}
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 3,
                            }}
                        >
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    label={t('users.fullName')}
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    placeholder="e.g. John Doe"
                                    fullWidth
                                    disabled={isSubmitting}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& fieldset': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'var(--accent)',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: 'var(--text-3)',
                                            opacity: 1,
                                        },
                                    }}
                                />

                                <TextField
                                    label={t('users.username')}
                                    value={formData.username}
                                    onChange={(e) => handleChange('username', e.target.value)}
                                    placeholder="e.g. jdoe_sync"
                                    fullWidth
                                    disabled={isSubmitting}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& fieldset': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'var(--accent)',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: 'var(--text-3)',
                                            opacity: 1,
                                        },
                                    }}
                                />
                            </Box>

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    label={t('users.phoneNumber')}
                                    value={formData.phone_number}
                                    onChange={(e) => handleChange('phone_number', e.target.value)}
                                    placeholder="+998  90 123 45 67"
                                    fullWidth
                                    disabled={isSubmitting}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Iconify icon="solar:phone-bold" sx={{ color: 'var(--text-3)' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& fieldset': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'var(--accent)',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: 'var(--text-3)',
                                            opacity: 1,
                                        },
                                    }}
                                />

                                <TextField
                                    type="password"
                                    label={t('users.password')}
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder="••••••••"
                                    fullWidth
                                    disabled={isSubmitting}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Iconify icon="solar:lock-password-outline" sx={{ color: 'var(--text-3)' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& fieldset': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'var(--accent)',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: 'var(--text-3)',
                                            opacity: 1,
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    backgroundColor: 'rgba(99, 115, 129, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Iconify icon="solar:shield-check-bold" sx={{ color: 'var(--text-3)' }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {t('users.systemAccess')}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {t('users.permissionsHardware')}
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 3,
                            }}
                        >
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <FormControl fullWidth size="small" disabled={isSubmitting}>
                                    <InputLabel sx={{ color: 'var(--text-3)' }}>{t('users.role')}</InputLabel>
                                    <Select
                                        value={formData.role || ''}
                                        onChange={(e) => handleChange('role', e.target.value as string)}
                                        label={t('users.role')}
                                        sx={{
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--accent)',
                                            },
                                        }}
                                    >
                                        <MenuItem value="" disabled>
                                            {t('common.selectRole')}
                                        </MenuItem>
                                        {ROLE_OPTIONS.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth size="small" disabled={isSubmitting}>
                                    <InputLabel sx={{ color: 'var(--text-3)' }}>{t('users.status')}</InputLabel>
                                    <Select
                                        value={formData.is_active ? 'active' : 'inactive'}
                                        onChange={(e) => handleChange('is_active', e.target.value === 'active')}
                                        label={t('users.status')}
                                        sx={{
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--accent)',
                                            },
                                        }}
                                    >
                                        <MenuItem value="active">{t('common.active')}</MenuItem>
                                        <MenuItem value="inactive">{t('common.inactive')}</MenuItem>
                                    </Select>
                                </FormControl>

                                {formData.role === 'cashier' && (
                                    <FormControl fullWidth size="small" disabled={isSubmitting || cashRegistersLoading}>
                                        <InputLabel sx={{ color: 'var(--text-3)' }}>
                                            {t('cashbox.cashiers.title')}
                                        </InputLabel>
                                        <Select
                                            value={formData.cash_register_id}
                                            onChange={(e) => handleChange('cash_register_id', e.target.value as string)}
                                            label={t('cashbox.cashiers.title')}
                                            sx={{
                                                backgroundColor: 'var(--surface)',
                                                color: 'var(--text)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'var(--border)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'var(--border-strong)',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'var(--accent)',
                                                },
                                            }}
                                            startAdornment={
                                                cashRegistersLoading ? (
                                                    <InputAdornment position="start">
                                                        <CircularProgress size={20} />
                                                    </InputAdornment>
                                                ) : null
                                            }
                                        >
                                            <MenuItem value="" disabled>
                                                {t('common.selectCashRegister')}
                                            </MenuItem>
                                            {cashRegisterOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    label={t('users.pincode')}
                                    value={formData.pincode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        handleChange('pincode', value);
                                    }}
                                    placeholder="000000"
                                    fullWidth
                                    disabled={isSubmitting}
                                    variant="outlined"
                                    size="small"
                                    type="password"
                                    inputProps={{ maxLength: 6 }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'var(--surface)',
                                            color: 'var(--text)',
                                            '& fieldset': {
                                                borderColor: 'var(--border)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'var(--border-strong)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'var(--accent)',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: 'var(--text-3)',
                                            opacity: 1,
                                        },
                                    }}
                                />

                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        justifyContent: 'flex-end',
                                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => router.push(paths.settings.users)}
                                        disabled={isSubmitting}
                                    >
                                        {t('cancel')}
                                    </Button>

                                    <Button
                                        variant="contained"
                                        type="submit"
                                        disabled={isSubmitting}
                                        color="primary"
                                        sx={{
                                            '&:disabled': {
                                                opacity: 0.6,
                                            },
                                        }}
                                        startIcon={
                                            isSubmitting ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <Iconify icon="solar:check-circle-bold" />
                                            )
                                        }
                                    >
                                        {isSubmitting ? t('saving') : isNew ? t('users.addEmployee') : t('users.updateEmployee')}
                                    </Button>
                                </Box>
                            </Box>


                        </Box>


                    </Stack>
                </Card>


            </form>
        </Box>
    );
});
