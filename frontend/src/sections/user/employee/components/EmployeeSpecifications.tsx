import type { EmployeeSpecificationRow, EmployeeSpecificationsProps } from '../types';

import { SpecificationsTable } from 'src/components/generic-view-view';

/**
 * Employee specifications component for view modal
 */
export function EmployeeSpecifications({ employee, t }: EmployeeSpecificationsProps) {
    const specs: EmployeeSpecificationRow[] = [
        { label: t('users.fullName'), value: employee.full_name || '-' },
        { label: t('users.username'), value: employee.username || '-' },
        { label: t('users.role'), value: employee.role || '-' },
        { label: t('users.status'), value: employee.status || '-' },
        { label: t('users.phoneNumber'), value: employee.phone_number || '-' },
        { label: t('users.pincode'), value: employee.pincode ? '****' : '-' },
        { label: t('users.terminal'), value: employee.terminal || '-' },
        { label: t('users.createdAt'), value: new Date(employee.created_at).toLocaleString() || '-' },
    ];

    return <SpecificationsTable rows={specs} />;
}
