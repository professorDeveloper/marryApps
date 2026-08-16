import type { EmployeeStatusCellProps } from '../types';

import Box from '@mui/material/Box';

/**
 * Employee status renderer component
 */
export function EmployeeStatusCell({ employee, statusColors }: EmployeeStatusCellProps) {
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
            {employee.status || '-'}
        </Box>
    );
}
