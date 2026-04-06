import type { EmployeeRoleCellProps } from '../types';

import Chip from '@mui/material/Chip';

/**
 * Employee role renderer component
 */
export function EmployeeRoleCell({ employee, roleColors }: EmployeeRoleCellProps) {
    return (
        <Chip
            label={employee.role}
            color={roleColors[employee.role] || 'default'}
            size="small"
            variant="outlined"
        />
    );
}
