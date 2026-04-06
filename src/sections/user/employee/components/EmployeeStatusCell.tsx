import type { EmployeeStatusCellProps } from '../types';

import Chip from '@mui/material/Chip';

/**
 * Employee status renderer component
 */
export function EmployeeStatusCell({ employee, statusColors }: EmployeeStatusCellProps) {
    return (
        <Chip
            label={employee.status}
            color={statusColors[employee.status] || 'default'}
            size="small"
            variant="outlined"
        />
    );
}
