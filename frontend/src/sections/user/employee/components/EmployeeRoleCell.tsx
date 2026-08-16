import type { EmployeeRoleCellProps } from '../types';

import Box from '@mui/material/Box';

/**
 * Employee role renderer component
 */
export function EmployeeRoleCell({ employee, roleColors }: EmployeeRoleCellProps) {
    return (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            py: 1.5, 
            px: 1,
            color: 'text.primary',
            fontSize: '0.875rem',
            fontWeight: 400
        }}>
            {employee.role || '-'}
        </Box>
    );
}
